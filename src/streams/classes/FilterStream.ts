import { DuplexOptions, TransformCallback } from "stream";
import { PushError } from "../errors/PushError";
import { DiscardingStream } from "../interfaces/_index";

/**
 * @interface
 * Options for the FilterStream.
 * @extends DuplexOptions
 * @template T
 */
export interface FilterStreamOptions<T> extends DuplexOptions {
    objectMode?:true;
    filter: (chunk: T) => boolean;
}

const defaultOptions = {
    objectMode: true
};

/**
 * @class
 * Class that allows you to filter data in a stream.
 * @extends DiscardingStream
 * @template T
 * @example
 * ```typescript
 * const stream:FilterStream<string> = new FilterStream({
 *     objectMode: true,
 *     filter: (chunk: string) => chunk === "data1" || chunk === "data2",
 * });
 * 
 * stream.write("data1");
 * stream.write("data2");
 * stream.write("data3");// Discarded
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
 * >> Pushed chunk: data1
 * >> Pushed chunk: data2
 * >> Discarded chunk: data3
 * ```
 */
export class FilterStream<T> extends DiscardingStream<T> {
    private buffer: T[] = [];
    private readonly _filter: (chunk: T) => boolean;

    /**
     * @constructor
     * @param {FilterStreamOptions} options - The options for the FilterStream.
     * @param [options.objectMode=true] {true} - Whether the stream should operate in object mode.
     * @param [options.filter] {Function} - The filter function for pushing data to the stream or discarding it.
     */
    constructor(options: FilterStreamOptions<T>) {
        const opts = {...defaultOptions, ...options};
        super(opts);
        this._filter = opts.filter;
    }

    /**
     * A method to write data to the stream, filter the chunk and push it to the buffer or discard it, and execute the callback.
     *
     * @param {T} chunk - The data chunk to write to the stream.
     * @param {BufferEncoding} encoding - The encoding of the data.
     * @param {TransformCallback} callback - The callback function to be executed after writing the data.
     * @return {void} This function does not return anything.
     */
    _write(chunk: T, encoding: BufferEncoding, callback: TransformCallback): void {
        if(this._filter(chunk)){
            this.buffer.push(chunk);
        }else{
            this.emit("discard", chunk);
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