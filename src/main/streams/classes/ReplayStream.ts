import { TransformCallback, Readable } from "node:stream";
import { NotClosedError } from "../errors/NotClosedError";
import { InternalBufferDuplex, ObjectDuplexOptions } from "../interfaces/_index";

/**
 * @class
 * Class that allows you to remit chunks from a stream when the source is finished.
 * @extends ObjectDuplex
 * @template T
 * @example
 * ```typescript
 * const stream:ReplayStream<string> = new ReplayStream({
 *     objectMode: true,
 * });
 * 
 * stream.write("data1");
 * stream.write("data2");
 * stream.write("data3");
 * stream.end();
 * 
 * stream.on("data", (chunk: string) => {
 *     console.log(``Pushed chunk: ${chunk}```);
 * }).on("close", () => {
 *     stream.replay().on("data", (chunk: string) => {
 *         console.log(`Replayed chunk: ${chunk}`);
 *     });
 * });
 * ```
 * ```shell
 * >> Pushed chunk: data1
 * >> Pushed chunk: data2
 * >> Pushed chunk: data3
 * >> Replayed chunk: data1
 * >> Replayed chunk: data2
 * >> Replayed chunk: data3
 * ```
 */
export class ReplayStream<T> extends InternalBufferDuplex<T,T> {
    private readonly memory: T[] = [];

    /**
     * @constructor
     * @param {ObjectDuplexOptions} options - The options for the ReplayStream.
     * @param [options.objectMode=true] {true} - Whether the stream should operate in object mode.
     */
    constructor(options: ObjectDuplexOptions) {
        super(options);
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
        this.memory.push(chunk);
        this.buffer.push(chunk);
        this._flush();
        callback();
    }

    /**
     * Creates a readable stream from the buffer to replay the data that have been pushed.
     * @returns {Readable} The replay stream.
     * @throws {NotClosedError} If the stream is not closed, so the buffer is not already completed to be replayed.
     */
    replay(): Readable {
        if (this.closed) {
            return Readable.from(this.memory,{objectMode: true});
        }else{
            throw new NotClosedError();
        }
    }
}