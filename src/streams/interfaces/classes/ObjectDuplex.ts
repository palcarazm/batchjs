import { Duplex, DuplexOptions } from "stream";

/**
 * @interface
 * Options for the ObjectDuplex.
 * @extends DuplexOptions
 */
export interface ObjectDuplexOptions extends DuplexOptions {
    objectMode?:true;
}

const defaultOptions = {
    objectMode: true
};

/**
 * @abstract
 * @class
 * Abstract class that handle data in a stream in object mode.
 * @extends Duplex
 */
export abstract class ObjectDuplex extends Duplex {

    /**
     * @constructor
     * @param {ObjectDuplexOptions} options - The options for the ObjectDuplex.
     * @param [options.objectMode=true] {true} - Whether the stream should operate in object mode.
     */
    constructor(options: ObjectDuplexOptions) {
        const opts = {...defaultOptions, ...options};
        super(opts);
    }
}