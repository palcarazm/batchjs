import { Duplex, DuplexOptions } from "stream";
import { WriteCallback } from "./ObjectWritable";

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
 * @template Tin
 * @template Tout
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class ObjectDuplex<Tin=any,Tout=any> extends Duplex {

    /**
     * @constructor
     * @param {ObjectDuplexOptions} options - The options for the ObjectDuplex.
     * @param [options.objectMode=true] {true} - Whether the stream should operate in object mode.
     */
    constructor(options: ObjectDuplexOptions) {
        const opts = {...defaultOptions, ...options};
        super(opts);
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