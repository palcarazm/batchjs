import { TransformCallback } from "stream";
import { DiscardingStream, ObjectDuplexOptions } from "../interfaces/_index";

/**
 * @interface
 * Options for the FilterStream.
 * @extends DuplexOptions
 * @template TInput
 * @template TKey
 */
export interface DistinctStreamOptions<TInput,TKey> extends ObjectDuplexOptions {
    keyExtractor: (chunk: TInput) => TKey;
}

/**
 * @class
 * Class that allows you to discard repeated data in a stream in base on a key.
 * Data with duplicated key will be emitted through the discard event.
 * @extends DiscardingStream
 * @template TInput
 * @template TKey
 * @example
 * ```typescript
 * const stream:DistinctStream<string,string> = new DistinctStream({
 *     objectMode: true,
 *     keyExtractor: (chunk: string) => chunk,
 * });
 * 
 * stream.write("data1");
 * stream.write("data2");
 * stream.write("data1"); //Duplicated
 * stream.end();
 * 
 * stream.on("data", (chunk: string) => {
 *     console.log(``Pushed chunk: ${chunk}```);
 * });
 * stream.on("discard", (chunk: string) => {
 *     console.log(``Duplicated chunk: ${chunk}```);
 * });
 * ```
 * ```shell
 * >> Pushed chunk: data1
 * >> Pushed chunk: data2
 * >> Duplicated chunk: data1
 * ```
 */
export class DistinctStream<TInput,TKey> extends DiscardingStream<TInput> {
    protected buffer: Array<TInput> = [];
    private keySet: Set<TKey> = new Set();
    private readonly _keyExtractor: (chunk: TInput) => TKey;

    /**
     * @constructor
     * @param {DistinctStreamOptions} options - The options for the FilterStream.
     * @param [options.keyExtractor] {Function} - The key extractor function for determining the key of the data to be filtered.
     */
    constructor(options: DistinctStreamOptions<TInput,TKey>) {
        super(options);
        this._keyExtractor = options.keyExtractor;
    }

    /**
     * A method to write data to the stream, get the key of the data, and if the key is not in the set, push the data to the buffer, otherwise discard it.
     *
     * @param {TInput} chunk - The data chunk to write to the stream.
     * @param {BufferEncoding} encoding - The encoding of the data.
     * @param {TransformCallback} callback - The callback function to be executed after writing the data.
     * @return {void} This function does not return anything.
     */
    _write(chunk: TInput, encoding: BufferEncoding, callback: TransformCallback): void {
        const key = this._keyExtractor(chunk);
        if(!this.keySet.has(key)){
            this.buffer.push(chunk);
            this.keySet.add(key);
            this._read(1);
        }else{
            this.emit("discard", chunk);
        }
        callback();
    }


    /**
     * Finalizes the stream by pushing remaining data, handling errors,
     * and executing the final callback.
     *
     * @param {TransformCallback} callback - The callback function to be executed after finalizing the stream.
     * @return {void} This function does not return anything.
     */
    _final(callback: TransformCallback): void {
        const pushData = ()=>{
            while (this.buffer.length > 0) {
                const chunk = this.buffer.shift() as TInput;
                if (!this.push(chunk)) {
                    this.buffer.unshift(chunk);
                    this.once("drain", pushData);
                    return;
                }
            }
            this.push(null);
            callback();
        };

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
            const chunk = this.buffer.shift() as TInput;
            if (!this.push(chunk)) {
                this.buffer.unshift(chunk);
                this.once("drain", handleDrain);
                return;
            }
            size--;
        }
    }
}