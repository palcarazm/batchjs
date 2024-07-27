import { TransformCallback } from "stream";
import { PushError } from "../errors/PushError";
import { DiscardingStream, ObjectDuplexOptions } from "../interfaces/_index";


/**
 * @class
 * Class that allows you to emit only the last chunk in a stream and discard the rest.
 * @extends DiscardingStream
 * @template T
 * @example
 * ```typescript
 * const stream:LastStream<string> = new LastStream({
 *     objectMode: true,
 * });
 * 
 * stream.write("first"); //Discarded
 * stream.write("second"); //Discarded
 * stream.write("third");
 * stream.end();
 * 
 * stream.on("data", (chunk: boolean) => {
 *     console.log(``Pushed chunk: ${chunk}```);
 * });
 * stream.on("discard", (chunk: boolean) => {
 *     console.log(``Discarded chunk: ${chunk}```);
 * });
 * ```
 * ```shell
 * >> Discarded chunk: first
 * >> Discarded chunk: second
 * >> Pushed chunk: third
 * ```
 */
export class LastStream<T> extends DiscardingStream<T> {
    private lastChunk: T | undefined = undefined;

    /**
     * @constructor
     * @param {ObjectDuplexOptions} options - The options for the LastStream.
     */
    constructor(options: ObjectDuplexOptions) {
        super(options);
    }

    /**
     * A method to write data to the stream, save last chunk and discard the rest, and execute the callback.
     *
     * @param {T} chunk - The data chunk to write to the stream.
     * @param {BufferEncoding} encoding - The encoding of the data.
     * @param {TransformCallback} callback - The callback function to be executed after writing the data.
     * @return {void} This function does not return anything.
     */
    _write(chunk: T, encoding: BufferEncoding, callback: TransformCallback): void {
        if(this.lastChunk !== undefined){
            this.emit("discard", this.lastChunk);
        }
        this.lastChunk = chunk;
        callback();
    }


    /**
     * Finalizes the stream by pushing the last chunk if it exists, handling errors,
     * and executing the final callback.
     *
     * @param {TransformCallback} callback - The callback function to be executed after finalizing the stream.
     * @return {void} This function does not return anything.
     */
    _final(callback: TransformCallback): void {
        if ( this.lastChunk !== undefined) {
            if (!this.push(this.lastChunk)) {
                callback(new PushError());
                return;
            }
        }
        this.push(null);
        callback();
    }

    /**
     * Reading is not supported since writer finishes first.
     *
     * @return {void}
     */
    _read(): void {
        return;
    }
}