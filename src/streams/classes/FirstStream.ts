import { DuplexOptions, TransformCallback } from "stream";
import { PushError } from "../errors/PushError";
import { DiscardingStream } from "../interfaces/_index";

/**
 * @interface
 * Options for the FirstStream.
 * @extends DuplexOptions
 */
export interface FirstStreamOptions extends DuplexOptions {
    objectMode?:true;
}

const defaultOptions = {
    objectMode: true
};

/**
 * @class
 * Class that allows you to emit only the first chunk in a stream and discard the rest.
 * @extends DiscardingStream
 * @template T
 * @example
 * ```typescript
 * const stream:FirstStream<string> = new FirstStream({
 *     objectMode: true,
 *     matcher: (chunk: string) => chunk.length > 2
 * });
 * 
 * stream.write("first");
 * stream.write("second");// Discarded
 * stream.write("third");// Discarded
 * stream.end();
 * 
 * stream.on("data", (chunk: string) => {
 *     console.log(``Pushed chunk: ${chunk}```);
 * });
 * stream.on("discard", (chunk: string) => {
 *     console.log(``Discarded chunk: ${chunk}```);
 * });
 * ```
 * ```shell
 * >> Pushed chunk: first
 * >> Discarded chunk: second
 * >> Discarded chunk: third
 * ```
 */
export class FirstStream<T> extends DiscardingStream<T> {
    private firstChunk: T | undefined = undefined;
    private pushedFirstChunk = false;

    /**
     * @constructor
     * @param {FirstStreamOptions} options - The options for the FirstStream.
     * @param [options.objectMode=true] {true} - Whether the stream should operate in object mode.
     */
    constructor(options: FirstStreamOptions) {
        const opts = {...defaultOptions, ...options};
        super(opts);
    }

    /**
     * A method to write data to the stream, save first chunk and discard the rest, and execute the callback.
     *
     * @param {T} chunk - The data chunk to write to the stream.
     * @param {BufferEncoding} encoding - The encoding of the data.
     * @param {TransformCallback} callback - The callback function to be executed after writing the data.
     * @return {void} This function does not return anything.
     */
    _write(chunk: T, encoding: BufferEncoding, callback: TransformCallback): void {
        if(this.firstChunk === undefined){
            this.firstChunk = chunk;
        }else{
            this.emit("discard", chunk);
        }
        callback();
    }


    /**
     * Finalizes the stream by pushing the first chunk if it exists and not pushed, handling errors,
     * and executing the final callback.
     *
     * @param {TransformCallback} callback - The callback function to be executed after finalizing the stream.
     * @return {void} This function does not return anything.
     */
    _final(callback: TransformCallback): void {
        if (!this.pushedFirstChunk && this.firstChunk !== undefined) {
            if (!this.push(this.firstChunk)) {
                callback(new PushError());
                return;
            }else{
                this.pushedFirstChunk = true;
            }
        }
        this.push(null);
        callback();
    }

    /**
     * Pushes the first chunk, if it exists and not pushed, to the consumer stream and marks it as pushed.
     *
     * @return {void} This function does not return anything.
     */
    _read(): void {
        if (!this.pushedFirstChunk && this.firstChunk !== undefined) {
            if (this.push(this.firstChunk)) {
                this.pushedFirstChunk = true;
            }
        }
    }
}