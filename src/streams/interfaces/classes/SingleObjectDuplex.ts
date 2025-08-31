import { TransformCallback } from "stream";
import { ObjectDuplex, ObjectDuplexOptions } from "./ObjectDuplex";

/**
 * @abstract
 * @class
 * Abstract class that allows you to emit a single data in a stream.
 * @extends ObjectDuplex
 * @template T
 */
export abstract class SingleObjectDuplex<T> extends ObjectDuplex {
    protected result: T | undefined = undefined;
    protected pushedResult = false;

    /**
     * @constructor
     * @param {ObjectDuplexOptions} options 
     */
    constructor(options: ObjectDuplexOptions) {
        super(options);
    }


    /**
     * Finalizes the stream by pushing the result chunk if it exists and not pushed, handling errors,
     * and executing the final callback.
     *
     * @param {TransformCallback} callback - The callback function to be executed after finalizing the stream.
     * @return {void} This function does not return anything.
     */
    _final(callback: TransformCallback): void {
        if (!this.pushedResult ) {
            if(this.result !== undefined){
                this.push(this.result);
            }
            this.pushedResult = true;
            this.push(null);
        }
        callback();
    }

    /**
     * Pushes the result chunk, if it exists and not pushed, to the consumer stream and marks it as pushed.
     *
     * @return {void} This function does not return anything.
     */
    _read(): void {
        if (!this.pushedResult && this.result !== undefined) {
            this.push(this.result);
            this.pushedResult = true;
            this.push(null);
        }
    }
}