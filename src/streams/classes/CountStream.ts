import {  TransformCallback  } from "stream";
import { ObjectDuplex, ObjectDuplexOptions } from "../interfaces/_index";

/**
 * @class
 * Class that allows you to count the number of chunks in a stream.
 * @extends ObjectDuplex
 * @template T
 * @example
 * ```typescript
 * const stream:CountStream<string> = new CountStream({
 *     objectMode: true,
 * });
 * 
 * stream.write("data1");
 * stream.write("data2");
 * stream.write("data3");
 * stream.end();
 * 
 * stream.on("data", (chunk: number) => {
 *     console.log(``Received chunks: ${chunk}```);
 * });
 * ```
 * ```shell
 * >> Received chunks: 3
 * ```
 */
export class CountStream<T> extends ObjectDuplex {
    private count: number = 0;
    private pushedResult:boolean = false;

    /**
     * @constructor
     * @param {ObjectDuplexOptions} options - The options for the GroupBy.
     */
    constructor(options: ObjectDuplexOptions) {
        super(options);
    }

    /**
     * Writes a chunk of data to the stream, groups it according to a specified function,
     * and executes the callback.
     *
     * @param {T} chunk - The data chunk to write to the stream.
     * @param {BufferEncoding} encoding - The encoding of the data.
     * @param {TransformCallback} callback - The callback function to be executed after writing the data.
     * @return {void}
     */
    _write(chunk: T, encoding: BufferEncoding, callback: TransformCallback): void {
        if (chunk !== null) {
            this.count++;
        }
        callback();
    }

 
    /**
     * Finalize the stream by draining the buffer and pushing the count of chunks to the stream.
     *
     * @param {TransformCallback} callback - The callback to be called when the stream is finalized.
     * @return {void}
     */
    _final(callback: TransformCallback): void {
        const pushData = ()=>{
            if( !this.pushedResult){
                if(this.push(this.count)){
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
     * Reading is not supported since writer finishes first.
     *
     * @return {void}
     */
    _read(): void {
        return;
    }
}
