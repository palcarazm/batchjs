import { Readable, ReadableOptions } from "node:stream";

/**
 * @interface
 * Options for the ObjectReadable.
 * @extends ReadableOptions
 */
export interface ObjectReadableOptions extends ReadableOptions {
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
 * @extends Readable
 * @template Tout The type of the output data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class ObjectReadable<Tout=any> extends Readable {
    readonly drainTimeout: number;

    /**
     * @param {ObjectReadableOptions} options - The options for the ObjectReadable.
     */
    constructor(options: ObjectReadableOptions) {
        const opts = {...defaultOptions, ...options};
        super(opts);
        this.drainTimeout = opts.drainTimeout;
    }

    read(size?: number):Tout|null {
        return super.read(size);
    }
}

export type ReadCallback = (error?: Error | null) => void;