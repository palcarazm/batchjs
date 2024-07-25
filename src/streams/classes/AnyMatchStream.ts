import { DuplexOptions, TransformCallback } from "stream";
import { PushError } from "../errors/PushError";
import { DiscardingStream } from "../interfaces/_index";

/**
 * @interface
 * Options for the AnyMatchStream.
 * @extends DuplexOptions
 * @template T
 */
export interface AnyMatchStreamOptions<T> extends DuplexOptions {
    objectMode?:true;
    matcher: (chunk: T) => boolean;
}

const defaultOptions = {
    objectMode: true
};

/**
 * @class
 * Class that allows you to validate that all elements in a stream match a given condition.
 * @extends DiscardingStream
 * @template T
 * @example
 * ```typescript
 * const stream:AnyMatchStream<string> = new AnyMatchStream({
 *     objectMode: true,
 *     matcher: (chunk: string) => chunk.length > 2
 * });
 * 
 * stream.write("1"); // not match
 * stream.write("2"); // not match
 * stream.write("third"); // match
 * stream.end();
 * 
 * stream.on("data", (chunk: boolean) => {
 *     console.log(``Result: ${chunk}```);
 * });
 * ```
 * ```shell
 * >> Result: false
 * ```
 */
export class AnyMatchStream<T> extends DiscardingStream<T> {
    private anyChunkMatch: boolean|undefined = undefined;
    private pushedResult: boolean = false;
    private readonly _matcher: (chunk: T) => boolean;

    /**
     * @constructor
     * @param {AnyMatchStreamOptions} options - The options for the AnyMatchStream.
     * @param [options.objectMode=true] {true} - Whether the stream should operate in object mode.
     * @param [options.matcher] {Function} - The function that will be used to validate the chunk.
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