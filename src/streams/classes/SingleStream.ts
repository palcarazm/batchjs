import { TransformCallback } from "stream";
import { SingleStreamError } from "../errors/_index";
import { InternalBufferDuplex, ObjectDuplexOptions } from "../interfaces/_index";

/**
 * @class
 * Class that allows you to verify that a stream contains only one chunk.
 * @extends InternalBufferDuplex
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
export class SingleStream<T> extends InternalBufferDuplex<T,T> {
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
        } else {
            const error = new SingleStreamError();
            this.emit("error", error);
        }
        callback();
    }
}