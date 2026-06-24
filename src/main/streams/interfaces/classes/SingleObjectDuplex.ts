import { TransformCallback } from "node:stream";
import { ObjectDuplex, ObjectDuplexOptions } from "./ObjectDuplex";

/**
 * @abstract
 * @class
 * Abstract class that allows you to emit a single data in a stream.
 * @extends ObjectDuplex
 * @template T
 */
export abstract class SingleObjectDuplex<Tin,Tout> extends ObjectDuplex<Tin,Tout> {
    protected result: Tout | undefined = undefined;
    protected pushedResult = false;
    private readonly canEarlyFlush:()=>boolean;
    private finalCallback?: TransformCallback;

    /**
     * @constructor
     * @param {ObjectDuplexOptions} options 
     * @param {Function} canEarlyFlush - A function that returns a boolean indicating whether the stream can early flush.
     */
    constructor(options: ObjectDuplexOptions, canEarlyFlush:()=>boolean) {
        super(options);
        this.canEarlyFlush = canEarlyFlush;
    }


    /**
     * Finalizes the stream by pushing the result chunk if it exists and not pushed, handling errors,
     * and executing the final callback.
     *
     * @param {TransformCallback} callback - The callback function to be executed after finalizing the stream.
     * @return {void} This function does not return anything.
     */
    _final(callback: TransformCallback): void {
        this.finalCallback = callback;
        this._flush();
    }

    /**
     * Pushes the result chunk, if it exists and not pushed, to the consumer stream and marks it as pushed.
     *
     * @return {void} This function does not return anything.
     */
    _read(): void {
        this._flush();
    }

    /**
     * Flushes the buffer by pushing its content to the consumer stream. If the consumer stream is not ready to receive data, it waits for the drain event and flushes the buffer again when it is emitted.
     * This function is recursive and will keep flushing the buffer until it is empty.
     *
     * @private
     * @return {void} This function does not return anything.
     */
    protected _flush(): void {
        if(this.finalCallback){
            if (!this.pushedResult ) {
                if(this.result !== undefined){
                    this.push(this.result);
                }
                this.pushedResult = true;
                this.push(null);
            }
            this.finalCallback();
        }else{
            if (!this.pushedResult && this.result !== undefined && this.canEarlyFlush()) {
                this.push(this.result);
                this.pushedResult = true;
                this.push(null);
            }
        }
    }
}