import { Duplex, DuplexOptions, TransformCallback } from "stream";
import { PushError } from "../errors/PushError";

/**
 * @interface
 * Options for the FlatStream.
 * @extends DuplexOptions
 */
export interface FlatStreamOptions extends DuplexOptions {
    objectMode?:true;
}

const defaultOptions = {
    objectMode: true
};

/**
 * @class
 * Class that allows you to transform an array stream into a flat stream.
 * @extends Duplex
 * @template T
 * @example
 * ```typescript
 * const stream:FlatStream<string> = new FlatStream({
 *     objectMode: true,
 *     matcher: (chunk: string) => chunk.length > 2
 * });
 * 
 * stream.write(["data1", "data2"]);
 * stream.write(["data3"]);
 * stream.end();
 * 
 * stream.on("data", (chunk: string) => {
 *     console.log(``Pushed chunk: ${chunk}```);
 * });
 * ```
 * ```shell
 * >> Pushed chunk: data1
 * >> Pushed chunk: data2
 * >> Pushed chunk: data3
 * ```
 */
export class FlatStream<T> extends Duplex {
    private buffer: T[] = [];

    /**
     * @constructor
     * @param {FlatStreamOptions} options - The options for the FlatStream.
     * @param [options.objectMode=true] {true} - Whether the stream should operate in object mode.
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