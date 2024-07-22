import { Duplex, DuplexOptions, TransformCallback } from "stream";
import { PushError } from "../errors/PushError";

/**
 * Options for the EmptyStream.
 */
export interface EmptyStreamOptions extends DuplexOptions {
    objectMode?:true;
}

const defaultOptions = {
    objectMode: true
};

/**
 * A class that allows you to validate that a stream is empty.
 */
export class EmptyStream<T> extends Duplex {
    private hasChunks: boolean = false;
    private pushedHasElements: boolean = false;

    /**
     * Initializes a new instance of the EmptyStream class with the specified options.
     *
     * @param {EmptyStreamOptions} options - The options for the EmptyStream.
     */
    constructor(options: EmptyStreamOptions) {
        const opts = {...defaultOptions, ...options};
        super(opts);
    }

    /**
     * A method to write data to the stream, setting the hasChunks flag to true, and execute the callback.
     *
     * @param {T} chunk - The data chunk to write to the stream.
     * @param {BufferEncoding} encoding - The encoding of the data.
     * @param {TransformCallback} callback - The callback function to be executed after writing the data.
     * @return {void} This function does not return anything.
     */
    _write(chunk: T, encoding: BufferEncoding, callback: TransformCallback): void {
        this.hasChunks = true;
        callback();
    }


    /**
     * Finalizes the stream by pushing the true if the stream is empty and false otherwise, if not already pushed.
     *
     * @param {TransformCallback} callback - The callback function to be executed after finalizing the stream.
     * @return {void} This function does not return anything.
     */
    _final(callback: TransformCallback): void {
        if( !this.pushedHasElements){
            if(this.push(!this.hasChunks)){
                this.pushedHasElements = true;
                this.push(null);
            }else{
                callback(new PushError());
                return;
            }
        }
        callback();
    }

    /**
     * Push once false if at least one chunk has been received.
     *
     * @return {void}
     */
    _read(): void {
        if(this.hasChunks && !this.pushedHasElements){
            if(this.push(false)){
                this.pushedHasElements = true;
                this.push(null);
            }
        }
    }
}