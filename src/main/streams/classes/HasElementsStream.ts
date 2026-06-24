import { TransformCallback } from "node:stream";
import { SingleObjectDuplex, ObjectDuplexOptions } from "../interfaces/_index";

/**
 * @class
 * Class that allows you to validate that a stream has elements.
 * @extends SingleObjectDuplex
 * @template T
 * @example
 * ```typescript
 * const stream:HasElementsStream<string> = new HasElementsStream({
 *     objectMode: true,
 * });
 * 
 * stream.write("first"); // not empty
 * stream.end();
 * 
 * stream.on("data", (chunk: boolean) => {
 *     console.log(``Result: ${chunk}```);
 * });
 * ```
 * ```shell
 * >> Result: false
 * ```
 */
export class HasElementsStream<T> extends SingleObjectDuplex<T,boolean> {
    protected result: boolean = false;

    /**
     * @constructor
     * @param {ObjectDuplexOptions} options - The options for the HasElementsStream.
     */
    constructor(options: ObjectDuplexOptions) {
        super(options,()=>this.result);
    }

    /**
     * A method to write data to the stream, setting the hasChunks flag to true, and execute the callback.
     *
     * @param {T} chunk - The data chunk to write to the stream.
     * @param {BufferEncoding} encoding - The encoding of the data.
     * @param {TransformCallback} callback - The callback function to be executed after writing the data.
     * @return {void} This function does not return anything.
     */
    _write(chunk: T, encoding: BufferEncoding, callback: TransformCallback): void {
        this.result = true;
        this._flush();
        callback();
    }
}