import { TransformCallback } from "stream";
import {  DiscardingStream, ObjectDuplexOptions } from "../interfaces/_index";

/**
 * @class
 * Class that allows you to emit only the first chunk in a stream and discard the rest.
 * @extends DiscardingStream
 * @template T
 * @example
 * ```typescript
 * const stream:FirstStream<string> = new FirstStream({
 *     objectMode: true,
 *     matcher: (chunk: string) => chunk.length > 2
 * });
 * 
 * stream.write("first");
 * stream.write("second");// Discarded
 * stream.write("third");// Discarded
 * stream.end();
 * 
 * stream.on("data", (chunk: string) => {
 *     console.log(``Pushed chunk: ${chunk}```);
 * });
 * stream.on("discard", (chunk: string) => {
 *     console.log(``Discarded chunk: ${chunk}```);
 * });
 * ```
 * ```shell
 * >> Pushed chunk: first
 * >> Discarded chunk: second
 * >> Discarded chunk: third
 * ```
 */
export class FirstStream<T> extends DiscardingStream<T> {
    private firstChunk: T | undefined = undefined;
    private pushedResult = false;

    /**
     * @constructor
     * @param {ObjectDuplexOptions} options - The options for the FirstStream.
     */
    constructor(options: ObjectDuplexOptions) {
        super(options);
    }

    /**
     * A method to write data to the stream, save first chunk and discard the rest, and execute the callback.
     *
     * @param {T} chunk - The data chunk to write to the stream.
     * @param {BufferEncoding} encoding - The encoding of the data.
     * @param {TransformCallback} callback - The callback function to be executed after writing the data.
     * @return {void} This function does not return anything.
     */
    _write(chunk: T, encoding: BufferEncoding, callback: TransformCallback): void {
        if(this.firstChunk === undefined){
            this.firstChunk = chunk;
            this._read();
        }else{
            this.emit("discard", chunk);
        }
        callback();
    }


    /**
     * Finalizes the stream by pushing the first chunk if it exists and not pushed, handling errors,
     * and executing the final callback.
     *
     * @param {TransformCallback} callback - The callback function to be executed after finalizing the stream.
     * @return {void} This function does not return anything.
     */
    _final(callback: TransformCallback): void {
        const pushData = ()=>{
            if (!this.pushedResult ) {
                if(this.firstChunk !== undefined){
                    if(!this.push(this.firstChunk)){
                        this.once("drain", pushData);
                        return;
                    }
                }
                this.pushedResult = true;
                this.push(null);
            }
            callback();
        };

        pushData();
    }

    /**
     * Pushes the first chunk, if it exists and not pushed, to the consumer stream and marks it as pushed.
     *
     * @return {void} This function does not return anything.
     */
    _read(): void {
        if (!this.pushedResult && this.firstChunk !== undefined) {
            if (this.push(this.firstChunk)) {
                this.pushedResult = true;
            }
        }
    }
}