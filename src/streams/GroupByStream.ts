import { Duplex, DuplexOptions, TransformCallback  } from "stream";
import { PushError } from "./errors/PushError";

/**
 * Options for the GroupByStream.
 */
export interface GroupByStreamOptions<T> extends DuplexOptions {
    objectMode?: true;
    groupBy: (chunk: T) => string;
}

const defaultOptions = {
    objectMode: true
};

/**
 * A class that allows you to transform and stream data in parallel.
 */
export class GroupByStream<T> extends Duplex {
    private buffer: Map<string,Array<T>> = new Map();
    private readonly groupBy: (chunk: T) => string;

    /**
     * Creates a new instance of GroupBy with the given options.
     *
     * @param {GroupByStreamOptions<T>} options - The options for the GroupBy.
     */
    constructor(options: GroupByStreamOptions<T>) {
        const opts = {...defaultOptions, ...options};
        super(opts);
        this.groupBy = opts.groupBy;
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
        this._groupBy(chunk);
        callback();
    }

 
    /**
     * Finalize the stream by draining the buffer and pushing any remaining chunks to the stream.
     *
     * @param {TransformCallback} callback - The callback to be called when the stream is finalized.
     * @return {void}
     */
    _final(callback: TransformCallback): void {
        try {
            Array.from(this.buffer.values()).forEach((group:Array<T>) => {
                if (!this.push(group)) {
                    throw new PushError();
                }
            });
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

    /**
     * Groups a chunk of data based on the provided groupBy function and stores it in the buffer.
     *
     * @param {T} chunk - The data chunk to be grouped.
     * @return {void} This function does not return anything.
     */
    private _groupBy(chunk: T): void {
        const groupKey = this.groupBy(chunk);
        const group = this.buffer.get(groupKey) ?? [];
        group.push(chunk);
        this.buffer.set(groupKey, group);
    }
}
