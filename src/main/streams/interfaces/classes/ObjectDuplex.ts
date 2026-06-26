import { Duplex, DuplexOptions } from "node:stream";
import { WriteCallback } from "./ObjectWritable";

/**
 * @interface
 * Options for the ObjectDuplex.
 * @extends DuplexOptions
 */
export interface ObjectDuplexOptions extends DuplexOptions {
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
 * @extends Duplex
 * @template Tin The type of the input data
 * @template Tout The type of the output data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class ObjectDuplex<Tin=any,Tout=any> extends Duplex {
    readonly drainTimeout: number;

    /**
     * @param {ObjectDuplexOptions} options - The options for the ObjectDuplex.
     */
    constructor(options: ObjectDuplexOptions) {
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
    
    read(size?: number):Tout|null {
        return super.read(size);
    }
}