import { Writable, WritableOptions } from "stream";

/**
 * @interface
 * Options for the ObjectWritable.
 * @extends WritableOptions
 */
export interface ObjectWritableOptions extends WritableOptions {
    objectMode?:true;
}

const defaultOptions = {
    objectMode: true
};

/**
 * @abstract
 * @class
 * Abstract class that handle data in a stream in object mode.
 * @extends Writable
 */
export abstract class ObjectWritable extends Writable {

    /**
     * @constructor
     * @param {ObjectWritableOptions} options - The options for the ObjectWritable.
     * @param [options.objectMode=true] {true} - Whether the stream should operate in object mode.
     */
    constructor(options: ObjectWritableOptions) {
        const opts = {...defaultOptions, ...options};
        super(opts);
    }
}

export type WriteCallback = (error?: Error | null) => void;