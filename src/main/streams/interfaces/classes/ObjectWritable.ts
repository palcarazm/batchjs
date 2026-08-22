import { Writable, WritableEventMap, WritableOptions } from "node:stream";
import { TypedEventEmitter } from "../_index";

/**
 * @interface
 * Options for the ObjectWritable.
 * @extends WritableOptions
 */
export interface ObjectWritableOptions extends WritableOptions {
    /**
     * Whether the stream should operate in object mode.
     */
    objectMode?:true;

    /**
     * Milliseconds until the stream is considered drained.
     */
    drainTimeout?: number;
}

const defaultOptions = {
    objectMode: true,
    drainTimeout: 50
};

/**
 * @abstract
 * @class
 * Abstract class that handle data in a stream in object mode.
 * @extends Writable
 * @template Tin The type of the input data
 * @template TEventMap The type of the event map
 */
export abstract class ObjectWritable<   
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Tin = any,
    TEventMap extends WritableEventMap = WritableEventMap
> extends Writable implements TypedEventEmitter<TEventMap> {
    readonly drainTimeout: number;
    /**
     * @param {ObjectWritableOptions} options - The options for the ObjectWritable.
     */
    constructor(options: ObjectWritableOptions) {
        const opts = {...defaultOptions, ...options};
        super(opts);
        this.drainTimeout = opts.drainTimeout;
    }
    
    write(chunk: Tin, callback?: WriteCallback): boolean;
    write(chunk: Tin, encoding: BufferEncoding, callback?: WriteCallback): boolean;
    write(
        chunk: Tin,
        encodingOrCallback?: BufferEncoding | WriteCallback,
        callback?: WriteCallback
    ): boolean {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return super.write(chunk as any, encodingOrCallback as any, callback);
    }
    
    end(cb?: () => void): this;
    end(chunk: Tin, cb?: () => void): this;
    end(chunk: Tin, encoding: BufferEncoding, cb?: () => void): this;
    end(
        chunkOrCb?: Tin | (() => void),
        encodingOrCb?: BufferEncoding | (() => void),
        cb?: () => void
    ): this {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return super.end(chunkOrCb as any, encodingOrCb as any, cb);
    }
}

export type WriteCallback = (error?: Error | null | undefined) => void;