import { TransformCallback } from "stream";
import { SingleStreamError } from "../errors/_index";
import { ObjectDuplex, ObjectDuplexOptions } from "../interfaces/_index";

/**
 * @class
 * Class that allows you to verify that a stream contains only one chunk.
 * @extends ObjectDuplex
 * @template T
 * @example
 * ```typescript
 * const stream:SingleStream<string> = new SingleStream({
 *     objectMode: true,
 * });
 * 
 * stream.write("data1");
 * stream.write("data2"); // This should launch error
 * stream.end();
 * 
 * stream.on("data", (chunk: string) => {
 *     console.log(``Pushed chunk: ${chunk}```);
 * });
 * stream.once("error", (err: SingleStreamError) => {
 *     console.log(``Error: ${err.message}```);
 * });
 * ```
 * ```shell
 * >> Pushed chunk: data1
 * >> Error: Expected only one chunk in the stream
 * ```
 */
export class SingleStream<T> extends ObjectDuplex {
    protected buffer: T[] = [];
    private isFirstChunk = true;

    /**
     * @constructor
     * @param {ObjectDuplexOptions} options - The options for the SingleStream.
     */
    constructor(options: ObjectDuplexOptions) {
        super(options);
    }

    /**
     * A method to write data to the stream, push the chunk to the buffer if its the first chunk, otherwise discard it, and execute the callback.
     *
     * @param {T} chunk - The data chunk to write to the stream.
     * @param {BufferEncoding} encoding - The encoding of the data.
     * @param {TransformCallback} callback - The callback function to be executed after writing the data.
     * @return {void} This function does not return anything.
     */
    _write(chunk: T, encoding: BufferEncoding, callback: TransformCallback): void {
        if (this.isFirstChunk) {
            this.isFirstChunk = false;
            this.buffer.push(chunk);
            this._read(1);
        } else {
            const error = new SingleStreamError();
            this.emit("error", error);
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
                const chunk = this.buffer.shift() as T;
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
        while (this.buffer.length > 0 && size > 0) {
            const chunk = this.buffer.shift() as T;
            if (!this.push(chunk)) {
                this.buffer.unshift(chunk);
            }
            size--;
        }
    }
}