import { TransformCallback } from "stream";
import { SingleObjectDuplex, ObjectDuplexOptions } from "../interfaces/_index";

/**
 * @class
 * Class that allows you to validate that a stream is empty.
 * @extends SingleObjectDuplex
 * @template T
 * @example
 * ```typescript
 * const stream:EmptyStream<string> = new EmptyStream({
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
export class EmptyStream<T> extends SingleObjectDuplex<boolean> {
    protected result = true;
    /**
     * @constructor
     * @param {ObjectDuplexOptions} options - The options for the EmptyStream.
     */
    constructor(options: ObjectDuplexOptions) {
        super(options);
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
        this.result = false;
        callback();
    }

    /**
     * Push once false if at least one chunk has been received.
     *
     * @override
     * @return {void}
     */
    _read(): void {
        if(!this.result) super._read();
    }
}