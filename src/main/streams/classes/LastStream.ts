import { TransformCallback } from "node:stream";
import { DiscardingSingleObjectDuplex, ObjectDuplexOptions } from "../interfaces/_index";


/**
 * @class
 * Class that allows you to emit only the last chunk in a stream and discard the rest.
 * @extends DiscardingSingleObjectDuplex
 * @template T
 * @example
 * ```typescript
 * const stream:LastStream<string> = new LastStream({
 *     objectMode: true,
 * });
 * 
 * stream.write("first"); //Discarded
 * stream.write("second"); //Discarded
 * stream.write("third");
 * stream.end();
 * 
 * stream.on("data", (chunk: boolean) => {
 *     console.log(``Pushed chunk: ${chunk}```);
 * });
 * stream.on("discard", (chunk: boolean) => {
 *     console.log(``Discarded chunk: ${chunk}```);
 * });
 * ```
 * ```shell
 * >> Discarded chunk: first
 * >> Discarded chunk: second
 * >> Pushed chunk: third
 * ```
 */
export class LastStream<T> extends DiscardingSingleObjectDuplex<T,T> {

    /**
     * @constructor
     * @param {ObjectDuplexOptions} options - The options for the LastStream.
     */
    constructor(options: ObjectDuplexOptions) {
        super(options,()=>false);
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
        if(this.result !== undefined){
            this.emit("discard", this.result);
        }
        this.result = chunk;
        callback();
    }
}