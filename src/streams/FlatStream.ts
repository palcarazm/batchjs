import { Duplex, DuplexOptions, TransformCallback } from "stream";
import { PushError } from "./errors/PushError";

/**
 * Options for the FlatStream.
 */
export interface FlatStreamOptions extends DuplexOptions {
    objectMode?:true;
}

const defaultOptions = {
    objectMode: true
};

/**
 * A class that allows you  stream data in batches of a specified size.
 */
export class FlatStream<T> extends Duplex {
    private buffer: T[] = [];

    /**
     * Initializes a new instance of the FlatStream class with the specified options.
     *
     * @param {FlatStreamOptions} options - The options for the FlatStream.
     */
    constructor(options: FlatStreamOptions) {
        const opts = {...defaultOptions, ...options};
        super(opts);
    }

    /**
     * A method to write data to the stream, push the chunk to the buffer, and execute the callback.
     *
     * @param {T} chunk - The data chunk to write to the stream.
     * @param {BufferEncoding} encoding - The encoding of the data.
     * @param {TransformCallback} callback - The callback function to be executed after writing the data.
     * @return {void} This function does not return anything.
     */
    _write(chunk: Array<T>, encoding: BufferEncoding, callback: TransformCallback): void {
        this.buffer.push(...chunk);
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