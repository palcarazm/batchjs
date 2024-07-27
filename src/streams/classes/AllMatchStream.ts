import { TransformCallback } from "stream";
import { PushError } from "../errors/PushError";
import { ObjectDuplexOptions, DiscardingStream } from "../interfaces/_index";

/**
 * @interface
 * Options for the AllMatchStream.
 * @extends ObjectDuplexOptions
 * @template T
 */
export interface AllMatchStreamOptions<T> extends ObjectDuplexOptions {
    matcher: (chunk: T) => boolean;
}

/**
 * @class
 * Class that allows you to validate that all elements in a stream match a given condition.
 * @extends DiscardingStream
 * @template T
 * @example
 * ```typescript
 * const stream:AllMatchStream<string> = new AllMatchStream({
 *     objectMode: true,
 *     matcher: (chunk: string) => chunk.length > 2
 * });
 * 
 * stream.write("first"); // match
 * stream.write("second"); // match
 * stream.write("3"); // not match
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
export class AllMatchStream<T> extends DiscardingStream<T> {
    private allChunksMatch: boolean|undefined = undefined;
    private pushedResult: boolean = false;
    private readonly _matcher: (chunk: T) => boolean;

    /**
     * @constructor
     * @param {AllMatchStreamOptions} options - The options for the AllMatchStream.
     * @param [options.matcher] {Function} - The function that will be used to validate the chunk.
     */
    constructor(options: AllMatchStreamOptions<T>) {
        super(options);
        this._matcher = options.matcher;
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
        if(this.allChunksMatch === undefined || this.allChunksMatch){
            this.allChunksMatch = matcherResult;
        }
        if(!matcherResult){
            this.emit("discard", chunk);
        }
        callback();
    }


    /**
     * Finalizes the stream by pushing the true if all chunks match the condition and false otherwise, if not already pushed.
     *
     * @param {TransformCallback} callback - The callback function to be executed after finalizing the stream.
     * @return {void} This function does not return anything.
     */
    _final(callback: TransformCallback): void {
        if( !this.pushedResult){
            if(this.push(this.allChunksMatch)){
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
     * Push once false if at least one chunk has not matched.
     *
     * @return {void}
     */
    _read(): void {
        if(this.allChunksMatch === false && !this.pushedResult){
            if(this.push(this.allChunksMatch)){
                this.pushedResult = true;
                this.push(null);
            }
        }
    }
}