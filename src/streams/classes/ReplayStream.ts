import { TransformCallback, Readable } from "stream";
import { PushError } from "../errors/PushError";
import { NotClosedError } from "../errors/NotClosedError";
import { ObjectDuplex, ObjectDuplexOptions } from "../interfaces/_index";

/**
 * @class
 * Class that allows you to remit chunks from a stream when the source is finished.
 * @extends ObjectDuplex
 * @template T
 * @example
 * ```typescript
 * const stream:ReplayStream<string> = new ReplayStream({
 *     objectMode: true,
 * });
 * 
 * stream.write("data1");
 * stream.write("data2");
 * stream.write("data3");
 * stream.end();
 * 
 * stream.on("data", (chunk: string) => {
 *     console.log(``Pushed chunk: ${chunk}```);
 * }).on("close", () => {
 *     stream.replay().on("data", (chunk: string) => {
 *         console.log(`Replayed chunk: ${chunk}`);
 *     });
 * });
 * ```
 * ```shell
 * >> Pushed chunk: data1
 * >> Pushed chunk: data2
 * >> Pushed chunk: data3
 * >> Replayed chunk: data1
 * >> Replayed chunk: data2
 * >> Replayed chunk: data3
 * ```
 */
export class ReplayStream<T> extends ObjectDuplex {
    private buffer: T[] = [];
    private index:number = 0;

    /**
     * @constructor
     * @param {ObjectDuplexOptions} options - The options for the ReplayStream.
     * @param [options.objectMode=true] {true} - Whether the stream should operate in object mode.
     */
    constructor(options: ObjectDuplexOptions) {
        super(options);
    }

    /**
     * A method to write data to the stream, push the chunk to the buffer, and execute the callback.
     *
     * @param {T} chunk - The data chunk to write to the stream.
     * @param {BufferEncoding} encoding - The encoding of the data.
     * @param {TransformCallback} callback - The callback function to be executed after writing the data.
     * @return {void} This function does not return anything.
     */
    _write(chunk: T, encoding: BufferEncoding, callback: TransformCallback): void {
        this.buffer.push(chunk);
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
        while (this.buffer.length > this.index) {
            const chunk = this.buffer.at(this.index) as T;
            if (!this.push(chunk)) {
                callback(new PushError());
                return;
            }else{
                this.index++;
            }
        }
        this.push(null);
        callback();
    }

    /**
     * Pushes the ready chunks to the consumer stream since all the buffer is pushed or the size limit is reached.
     *
     * @param {number} size - The size parameter for controlling the read operation.
     * @return {void} This function does not return anything.
     */
    _read(size: number): void {
        while (this.buffer.length > this.index && size > 0) {
            const chunk = this.buffer.at(this.index) as T;
            if (this.push(chunk)) {
                this.index++;
            }
            size--;
        }
    }

    /**
     * Creates a readable stream from the buffer to replay the data that have been pushed.
     * @returns {Readable} The replay stream.
     * @throws {NotClosedError} If the stream is not closed, so the buffer is not already completed to be replayed.
     */
    replay(): Readable {
        if (this.closed) {
            return Readable.from(this.buffer,{objectMode: true});
        }else{
            throw new NotClosedError();
        }
    }
}