import { Readable, ReadableOptions } from "stream";

/**
 * @interface
 * Options for the ObjectReadable.
 * @extends ReadableOptions
 */
export interface ObjectReadableOptions extends ReadableOptions {
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
 * @extends Readable
 * @template Tout
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class ObjectReadable<Tout=any> extends Readable {
    readonly drainTimeout: number;

    /**
     * @constructor
     * @param {ObjectReadableOptions} options - The options for the ObjectReadable.
     * @param [options.objectMode=true] {true} - Whether the stream should operate in object mode.
     * @param [options.drainTimeout=50] {number} - Milliseconds until the stream is considered drained.
     */
    constructor(options: ObjectReadableOptions) {
        const opts = {...defaultOptions, ...options};
        super(opts);
        this.drainTimeout = opts.drainTimeout;
    }

    /**
     * Implementation of the Readable interface.
     * @param {number} [size] - If specified, the maximum number of bytes to read.
     * @returns {Tout|null} - The object read or null if the stream has ended.
     */
    read(size?: number):Tout|null {
        return super.read(size);
    }
}

export type ReadCallback = (error?: Error | null) => void;