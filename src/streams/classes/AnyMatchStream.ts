import { DuplexOptions, TransformCallback } from "stream";
import { PushError } from "../errors/PushError";
import { DiscardingStream } from "../interfaces/_index";

/**
 * Options for the AnyMatchStream.
 */
export interface AnyMatchStreamOptions<T> extends DuplexOptions {
    objectMode?:true;
    matcher: (chunk: T) => boolean;
}

const defaultOptions = {
    objectMode: true
};

/**
 * A class that allows you to validate that all elements in a stream match a given condition.
 */
export class AnyMatchStream<T> extends DiscardingStream<T> {
    private anyChunkMatch: boolean|undefined = undefined;
    private pushedResult: boolean = false;
    private readonly _matcher: (chunk: T) => boolean;

    /**
     * Initializes a new instance of the AnyMatchStream class with the specified options.
     *
     * @param {AnyMatchStreamOptions} options - The options for the AnyMatchStream.
     */
    constructor(options: AnyMatchStreamOptions<T>) {
        const opts = {...defaultOptions, ...options};
        super(opts);
        this._matcher = opts.matcher;
    }

    /**
     * A method to write data to the stream, filter the chunk and push it to the buffer or discard it, and execute the callback.
     *
     * @param {T} chunk - The data chunk to write to the stream.
     * @param {BufferEncoding} encoding - The encoding of the data.
     * @param {TransformCallback} callback - The callback function to be executed after writing the data.
     * @return {void} This function does not return anything.
     */
    _write(chunk: T, encoding: BufferEncoding, callback: TransformCallback): void {
        const matcherResult = this._matcher(chunk);
        if(this.anyChunkMatch === undefined || this.anyChunkMatch){
            this.anyChunkMatch = !matcherResult;
        }
        if(matcherResult){
            this.emit("discard", chunk);
        }
        callback();
    }


    /**
     * Finalizes the stream by pushing the true if any chunk match the condition and false otherwise, if not already pushed.
     *
     * @param {TransformCallback} callback - The callback function to be executed after finalizing the stream.
     * @return {void} This function does not return anything.
     */
    _final(callback: TransformCallback): void {
        if( !this.pushedResult){
            if(this.push(this.anyChunkMatch)){
                this.pushedResult = true;
                this.push(null);
            }else{
                callback(new PushError());
                return;
            }
        }
        callback();
    }

    /**
     * Push once false if at least one chunk has matched.
     *
     * @return {void}
     */
    _read(): void {
        if(this.anyChunkMatch === false && !this.pushedResult){
            if(this.push(this.anyChunkMatch)){
                this.pushedResult = true;
                this.push(null);
            }
        }
    }
}