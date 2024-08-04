import { TransformCallback } from "stream";
import { ObjectDuplex, ObjectDuplexOptions } from "../interfaces/_index";

/**
 * @class
 * Class that allows you to validate that a stream is empty.
 * @extends Duplex
 * @template T
 * @example
 * ```typescript
 * const stream:EmptyStream<string> = new EmptyStream({
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
export class EmptyStream<T> extends ObjectDuplex {
    private hasChunks: boolean = false;
    private pushedResult: boolean = false;

    /**
     * @constructor
     * @param {ObjectDuplexOptions} options - The options for the EmptyStream.
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
     * Finalizes the stream by pushing the true if the stream is empty and false otherwise, if not already pushed.
     *
     * @param {TransformCallback} callback - The callback function to be executed after finalizing the stream.
     * @return {void} This function does not return anything.
     */
    _final(callback: TransformCallback): void {
        const pushData = ()=>{
            if( !this.pushedResult){
                if(this.push(!this.hasChunks)){
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
     * Push once false if at least one chunk has been received.
     *
     * @return {void}
     */
    _read(): void {
        if(this.hasChunks && !this.pushedResult){
            if(this.push(false)){
                this.pushedResult = true;
                this.push(null);
            }
        }
    }
}