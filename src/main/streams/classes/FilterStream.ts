import { TransformCallback } from "node:stream";
import { DiscardingInternalBufferDuplex, ObjectDuplexOptions } from "../interfaces/_index";

/**
 * @interface
 * Options for the FilterStream.
 * @extends ObjectDuplexOptions
 * @template T The type of the input data.
 */
export interface FilterStreamOptions<T> extends ObjectDuplexOptions {
    /**
     * The function that will be used to validate the chunk.
     */
    filter: (chunk: T) => boolean;
}

/**
 * @class
 * Class that allows you to filter data in a stream.
 * @extends DiscardingInternalBufferDuplex
 * @template T The type of the input data.
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
export class FilterStream<T> extends DiscardingInternalBufferDuplex<T,T> {
    private readonly _filter: (chunk: T) => boolean;

    /**
     * @param {FilterStreamOptions} options - The options for the FilterStream.
     */
    constructor(options: FilterStreamOptions<T>) {
        super(options);
        this._filter = options.filter;
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
            this._flush();
        }else{
            this.emit("discard", chunk);
        }
        callback();
    }
}