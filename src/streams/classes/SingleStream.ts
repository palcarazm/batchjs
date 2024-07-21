import { Duplex, DuplexOptions, TransformCallback } from "stream";
import { PushError, SingleStreamError } from "../errors/_index";

/**
 * Options for the SingleStream.
 */
export interface SingleStreamOptions extends DuplexOptions {
    objectMode?:true;
}

const defaultOptions = {
    objectMode: true
};

/**
 * A class that allows you  stream data in batches of a specified size.
 */
export class SingleStream<T> extends Duplex {
    private buffer: T[] = [];
    private isFirstChunk = true;

    /**
     * Initializes a new instance of the SingleStream class with the specified options.
     *
     * @param {SingleStreamOptions} options - The options for the SingleStream.
     */
    constructor(options: SingleStreamOptions) {
        const opts = {...defaultOptions, ...options};
        super(opts);
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

    /**
     * Finalizes the stream by pushing remaining data, handling errors,
     * and executing the final callback.
     *
     * @param {TransformCallback} callback - The callback function to be executed after finalizing the stream.
     * @return {void} This function does not return anything.
     */
    _final(callback: TransformCallback): void {
        while (this.buffer.length > 0) {
            const chunk = this.buffer.shift() as T;
            if (!this.push(chunk)) {
                this.buffer.unshift(chunk);
                callback(new PushError());
                return;
            }
        }
        this.push(null);
        callback();
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