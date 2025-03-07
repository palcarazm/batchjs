import { TransformCallback  } from "stream";
import { ObjectDuplex, ObjectDuplexOptions } from "../interfaces/_index";

/**
 * @interface
 * Options for the ParallelStream.
 * @extends ObjectDuplexOptions
 * @template TInput The type of the input data.
 * @template TOutput The type of the output data.
 */
export interface ParallelStreamOptions<TInput, TOutput> extends ObjectDuplexOptions {
    maxConcurrent: number;
    transform: (chunk: TInput) => Promise<TOutput>;
}

/**
 * @class
 * Class that allows you to transform and stream data in parallel.
 * @extends ObjectDuplex
 * @template TInput The type of the input data.
 * @template TOutput The type of the output data.
 * @example
 * ```typescript
 * const stream:ParallelStream<string,string> = new ParallelStream({
 *     objectMode: true,
 *     maxConcurrent: 2,
 *     transform(chunk: string) {
 *         return Promise.resolve(chunk.toUpperCase());
 *     },
 * });
 * 
 * stream.write("data1");
 * stream.write("data2");
 * stream.write("data3");
 * stream.end();
 * 
 * stream.on("data", (chunk: string) => {
 *     console.log(``Pushed chunk: ${chunk}```);
 * });
 * ```
 * ```shell
 * >> Pushed chunk: DATA1
 * >> Pushed chunk: DATA2
 * >> Pushed chunk: DATA3
 * ```
 */
export class ParallelStream<TInput, TOutput> extends ObjectDuplex {
    private queue: Array<TInput> = [];
    private buffer: Array<TOutput> = [];
    private pool: Set<Promise<void>> = new Set();
    private readonly maxConcurrent: number;
    private readonly transform: (chunk: TInput) => Promise<TOutput>;

    /**
     * @constructor
     * @param {ParallelStreamOptions<TInput, TOutput>} options - The options for the ParallelStream.
     * @param [options.maxConcurrent] {number} - The maximum number of concurrent promises.
     * @param [options.transform] {Function} - The function to transform the data returning a promise.
     */
    constructor(options: ParallelStreamOptions<TInput, TOutput>) {
        super(options);
        this.maxConcurrent = options.maxConcurrent;
        this.transform = options.transform;
    }

    /**
     * A method to write data to the stream, push the chunk to the queue, transform it, and then execute the callback.
     *
     * @param {TInput} chunk - The data chunk to write to the stream.
     * @param {BufferEncoding} encoding - The encoding of the data.
     * @param {TransformCallback} callback - The callback function to be executed after writing the data.
     * @return {void} This function does not return anything.
     */
    _write(chunk: TInput, encoding: BufferEncoding, callback: TransformCallback): void {
        this.queue.push(chunk);
        this._transform();
        callback();
    }

    /**
     * Asynchronously finalizes the stream by draining the queue and buffer, pushing any remaining chunks to the stream,
     * and calling the provided callback when complete. If the stream is unable to push a chunk, the chunk is placed back
     * into the buffer and a PushError is passed to the callback.
     *
     * @param {TransformCallback} callback - The callback to be called when the stream is finalized.
     * @return {Promise<void>} A promise that resolves when the stream is finalized.
     */
    async _final(callback: TransformCallback): Promise<void> {
        const pushData = ()=>{
            while (this.buffer.length > 0) {
                const chunk = this.buffer.shift() as TOutput;
                if (!this.push(chunk)) {
                    this.buffer.unshift(chunk);
                    this.once("drain", pushData);
                    return;
                }
            }
            this.push(null);
            callback();
        };

        while (this.queue.length > 0 || this.pool.size > 0) {
            await new Promise(resolve => setImmediate(resolve));
        }

        pushData();
    }

    /**
     * Pushes the ready chunks to the consumer stream since the buffer is empty or the size limit is reached.
     *
     * @param {number} size - The size parameter for controlling the read operation.
     * @return {void} This function does not return anything.
     */
    _read(size: number): void {
        const handleDrain = () => this._read(size);

        while (this.buffer.length > 0 && size > 0) {
            const chunk = this.buffer.shift() as TOutput;
            if (!this.push(chunk)) {
                this.buffer.unshift(chunk);
                this.once("drain", handleDrain);
                return;
            }
            size--;
        }
    }

    /**
     * Loop through the pool and queue to process chunks, adding promises to the pool.
     */
    private _transform(): void {
        while (this.pool.size < this.maxConcurrent && this.queue.length > 0) {
            const chunk = this.queue.shift() as TInput; // Get the next chunk
            const promise = this.transform(chunk)
                .then((result: TOutput) => {
                    this.buffer.push(result);
                    this._read(1);
                })
                .catch((err: Error) => {
                    this.emit("error", err);
                })
                .finally(() => {
                    this.pool.delete(promise); // Remove promise from pool
                    this._transform(); // Continue processing remaining chunks
                });

            this.pool.add(promise); // Add promise to pool
        }
    }
}
