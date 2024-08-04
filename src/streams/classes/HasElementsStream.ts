import { TransformCallback } from "stream";
import { ObjectDuplex, ObjectDuplexOptions } from "../interfaces/_index";

/**
 * @class
 * Class that allows you to validate that a stream has elements.
 * @extends ObjectDuplex
 * @template T
 * @example
 * ```typescript
 * const stream:HasElementsStream<string> = new HasElementsStream({
 *     objectMode: true,
 * });
 * 
 * stream.write("first"); // not empty
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
export class HasElementsStream<T> extends ObjectDuplex {
    private hasChunks: boolean = false;
    private pushedResult: boolean = false;

    /**
     * @constructor
     * @param {ObjectDuplexOptions} options - The options for the HasElementsStream.
     */
    constructor(options: ObjectDuplexOptions) {
        super(options);
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
     * Finalizes the stream by pushing the true if the stream has elements and false otherwise, if not already pushed.
     *
     * @param {TransformCallback} callback - The callback function to be executed after finalizing the stream.
     * @return {void} This function does not return anything.
     */
    _final(callback: TransformCallback): void {
        const pushData = ()=>{
            if( !this.pushedResult){
                if(this.push(this.hasChunks)){
                    this.pushedResult = true;
                    this.push(null);
                    callback();
                }else{
                    this.once("drain", pushData);
                }
            }
        };

        pushData();
    }

    /**
     * Push once true if at least one chunk has been received.
     *
     * @return {void}
     */
    _read(): void {
        if(this.hasChunks && !this.pushedResult){
            if(this.push(true)){
                this.pushedResult = true;
                this.push(null);
            }
        }
    }
}