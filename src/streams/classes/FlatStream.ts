import { TransformCallback } from "stream";
import { InternalBufferDuplex, ObjectDuplexOptions } from "../interfaces/_index";

/**
 * @class
 * Class that allows you to transform an array stream into a flat stream.
 * @extends InternalBufferDuplex
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
export class FlatStream<T> extends InternalBufferDuplex<T[],T> {
    /**
     * @constructor
     * @param {ObjectDuplexOptions} options - The options for the FlatStream.
     */
    constructor(options: ObjectDuplexOptions) {
        super(options);
    }

    /**
     * A method to write data to the stream, push the chunk to the buffer, and execute the callback.
     *
     * @param {Array<T>} chunk - The data chunk to write to the stream.
     * @param {BufferEncoding} encoding - The encoding of the data.
     * @param {TransformCallback} callback - The callback function to be executed after writing the data.
     * @return {void} This function does not return anything.
     */
    _write(chunk: Array<T>, encoding: BufferEncoding, callback: TransformCallback): void {
        this.buffer.push(...chunk);
        callback();
    }
}