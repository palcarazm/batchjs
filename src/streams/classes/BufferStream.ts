import { Duplex, DuplexOptions, TransformCallback } from "stream";
import { PushError } from "../errors/PushError";

/**
 * Options for the BufferStream.
 */
export interface BufferStreamOptions extends DuplexOptions {
    batchSize: number;
    objectMode?:true;
}

const defaultOptions = {
    objectMode: true
};

/**
 * A class that allows you  stream data in batches of a specified size.
 */
export class BufferStream<T> extends Duplex {
    private batchSize: number;
    private buffer: T[] = [];

    /**
     * Initializes a new instance of the BufferStream class with the specified options.
     *
     * @param {BufferStreamOptions} options - The options for the BufferStream.
     */
    constructor(options: BufferStreamOptions) {
        const opts = {...defaultOptions, ...options};
        super(opts);
        this.batchSize = opts.batchSize;
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
     * Finalizes the stream by pushing remaining data batches, handling errors,
     * and executing the final callback.
     *
     * @param {TransformCallback} callback - The callback function to be executed after finalizing the stream.
     * @return {void} This function does not return anything.
     */
    _final(callback: TransformCallback): void {
        while (this.buffer.length > 0) {
            const batch = this.buffer.splice(0, this.batchSize);
            if (!this.push(batch)) {
                this.buffer.unshift(...batch);
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
            const batch = this.buffer.splice(0, this.batchSize);
            if (!this.push(batch)) {
                this.buffer.unshift(...batch);
            }
            size--;
        }
    }
}