import { DuplexOptions, TransformCallback } from "stream";
import { PushError } from "../errors/PushError";
import { DiscardingStream } from "../interfaces/_index";

/**
 * Options for the LastStream.
 */
export interface LastStreamOptions extends DuplexOptions {
    objectMode?:true;
}

const defaultOptions = {
    objectMode: true
};

/**
 * A class that allows you to emit only the last chunk in a stream and discard the rest.
 */
export class LastStream<T> extends DiscardingStream<T> {
    private lastChunk: T | undefined = undefined;

    /**
     * Initializes a new instance of the LastStream class with the specified options.
     *
     * @param {LastStreamOptions} options - The options for the LastStream.
     */
    constructor(options: LastStreamOptions) {
        const opts = {...defaultOptions, ...options};
        super(opts);
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