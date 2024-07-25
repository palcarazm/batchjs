import { Duplex, DuplexOptions, TransformCallback  } from "stream";
import { PushError } from "../errors/PushError";

/**
 * @interface
 * Options for the CountStream.
 * @extends DuplexOptions
 */
export interface CountStreamOptions extends DuplexOptions {
    objectMode?: true;
}

const defaultOptions = {
    objectMode: true
};

/**
 * @class
 * Class that allows you to count the number of chunks in a stream.
 * @extends Duplex
 * @template T
 * @example
 * ```typescript
 * const stream:CountStream<string> = new CountStream({
 *     objectMode: true,
 * });
 * 
 * stream.write("data1");
 * stream.write("data2");
 * stream.write("data3");
 * stream.end();
 * 
 * stream.on("data", (chunk: number) => {
 *     console.log(``Received chunks: ${chunk}```);
 * });
 * ```
 * ```shell
 * >> Received chunks: 3
 * ```
 */
export class CountStream<T> extends Duplex {
    private count: number = 0;

    /**
     * @constructor
     * @param {CountStreamOptions} options - The options for the GroupBy.
     * @param [options.objectMode=true] {true} - Whether the stream should operate in object mode.
     */
    constructor(options: CountStreamOptions) {
        const opts = {...defaultOptions, ...options};
        super(opts);
    }

    /**
     * Writes a chunk of data to the stream, groups it according to a specified function,
     * and executes the callback.
     *
     * @param {T} chunk - The data chunk to write to the stream.
     * @param {BufferEncoding} encoding - The encoding of the data.
     * @param {TransformCallback} callback - The callback function to be executed after writing the data.
     * @return {void}
     */
    _write(chunk: T, encoding: BufferEncoding, callback: TransformCallback): void {
        if (chunk !== null) {
            this.count++;
        }
        callback();
    }

 
    /**
     * Finalize the stream by draining the buffer and pushing the count of chunks to the stream.
     *
     * @param {TransformCallback} callback - The callback to be called when the stream is finalized.
     * @return {void}
     */
    _final(callback: TransformCallback): void {
        try {
            if (!this.push(this.count)) {
                throw new PushError();
            }
            this.push(null);
            callback();
        } catch (error) {
            const e = error as Error;
            callback(e);
        }
    }

    /**
     * Reading is not supported since writer finishes first.
     *
     * @return {void}
     */
    _read(): void {
        return;
    }
}
