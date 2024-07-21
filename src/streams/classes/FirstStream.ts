import { DuplexOptions, TransformCallback } from "stream";
import { PushError } from "../errors/PushError";
import { DiscardingStream } from "../interfaces/_index";

/**
 * Options for the FirstStream.
 */
export interface FirstStreamOptions extends DuplexOptions {
    objectMode?:true;
}

const defaultOptions = {
    objectMode: true
};

/**
 * A class that allows you to emit only the first chunk in a stream and discard the rest.
 */
export class FirstStream<T> extends DiscardingStream<T> {
    private firstChunk: T | undefined = undefined;
    private pushedFirstChunk = false;

    /**
     * Initializes a new instance of the FirstStream class with the specified options.
     *
     * @param {FirstStreamOptions} options - The options for the FirstStream.
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