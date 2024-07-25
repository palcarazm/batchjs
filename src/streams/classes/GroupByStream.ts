import { Duplex, DuplexOptions, TransformCallback  } from "stream";
import { PushError } from "../errors/PushError";

/**
 * @interface
 * Options for the GroupByStream.
 * @extends DuplexOptions
 * @template T
 */
export interface GroupByStreamOptions<T> extends DuplexOptions {
    objectMode?: true;
    groupBy: (chunk: T) => string;
}

const defaultOptions = {
    objectMode: true
};

/**
 * @class
 * Class that allows you to group data in a stream.
 * @extends Duplex
 * @template T
 * @example
 * ```typescript
 * const stream:GroupByStream<string> = new GroupByStream({
 *     objectMode: true,
 *     groupBy: (chunk: string) => chunk.split("").at(0) ?? "",
 * });
 * 
 * stream.write("DATA1"); //group : D
 * stream.write("DATA2"); //group : D
 * stream.write("data3"); //group : d
 * stream.end();
 * 
 * stream.on("data", (chunk: Array<string>) => {
 *     console.log(``Pushed chunk: ${chunk}```);
 * });
 * ```
 * ```shell
 * >> Pushed chunk: ["DATA1", "DATA2"]
 * >> Pushed chunk: ["data3"]
 * ```
 */
export class GroupByStream<T> extends Duplex {
    private buffer: Map<string,Array<T>> = new Map();
    private readonly groupBy: (chunk: T) => string;

    /**
     * @constructor
     * @param {GroupByStreamOptions<T>} options - The options for the GroupBy.
     * @param [options.objectMode=true] {true} - Whether the stream should operate in object mode.
     * @param [options.groupBy] {Function} - The function used to get the grouping key from the chunk.
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
