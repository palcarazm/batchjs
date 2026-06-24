import { Writable, WritableOptions } from "node:stream";

/**
 * @interface
 * Options for the ObjectWritable.
 * @extends WritableOptions
 */
export interface ObjectWritableOptions extends WritableOptions {
    objectMode?:true;
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
 * @template Tin
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class ObjectWritable<Tin=any> extends Writable {
    readonly drainTimeout: number;
    /**
     * @constructor
     * @param {ObjectWritableOptions} options - The options for the ObjectWritable.
     * @param [options.objectMode=true] {true} - Whether the stream should operate in object mode.
     * @param [options.drainTimeout=50] {number} - Milliseconds until the stream is considered drained.
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