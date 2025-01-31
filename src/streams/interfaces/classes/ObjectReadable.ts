import { Readable, ReadableOptions } from "stream";

/**
 * @interface
 * Options for the ObjectReadable.
 * @extends ReadableOptions
 */
export interface ObjectReadableOptions extends ReadableOptions {
    objectMode?:true;
}

const defaultOptions = {
    objectMode: true
};

/**
 * @abstract
 * @class
 * Abstract class that handle data in a stream in object mode.
 * @extends Readable
 */
export abstract class ObjectReadable extends Readable {

    /**
     * @constructor
     * @param {ObjectReadableOptions} options - The options for the ObjectReadable.
     * @param [options.objectMode=true] {true} - Whether the stream should operate in object mode.
     */
    constructor(options: ObjectReadableOptions) {
        const opts = {...defaultOptions, ...options};
        super(opts);
    }
}

export type ReadCallback = (error?: Error | null) => void;