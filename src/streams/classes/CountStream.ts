import { Duplex, DuplexOptions, TransformCallback  } from "stream";
import { PushError } from "../errors/PushError";

/**
 * Options for the CountStream.
 */
export interface CountStreamOptions extends DuplexOptions {
    objectMode?: true;
}

const defaultOptions = {
    objectMode: true
};

/**
 * A class that allows you to count the number of chunks in a stream.
 */
export class CountStream<T> extends Duplex {
    private count: number = 0;

    /**
     * Creates a new instance of GroupBy with the given options.
     *
     * @param {CountStreamOptions} options - The options for the GroupBy.
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
