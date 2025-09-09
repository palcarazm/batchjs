import { TransformCallback } from "stream";
import { ObjectDuplex, ObjectDuplexOptions } from "./ObjectDuplex";

/**
 * @abstract
 * @class
 * Abstract class that implements an stream that buffers data internally.
 * @extends ObjectDuplex
 * @template Tin
 * @template Tout
 */
export abstract class InternalBufferDuplex<Tin,Tout> extends ObjectDuplex<Tin,Tout> {
    protected buffer: Tout[] = [];

    /**
     * @constructor
     * @param {ObjectDuplexOptions} options - The options for the InternalBufferDuplex.
     */
    constructor(options: ObjectDuplexOptions) {
        super(options);
    }

    /**
     * Finalizes the stream by pushing remaining data, handling errors,
     * and executing the final callback.
     *
     * @param {TransformCallback} callback - The callback function to be executed after finalizing the stream.
     * @return {void} This function does not return anything.
     */
    _final(callback: TransformCallback): void {
        const finalize = (callback: TransformCallback)=>{
            if(this._flush()){
                this.once("drain", ()=>finalize(callback));
            }else{
                this.push(null);
                callback();
            }
        };
        finalize(callback);
    }

    /**
     * Pushes the ready chunks to the consumer stream since the buffer is empty or the size limit is reached.
     *
     * @param {number} size - The size parameter for controlling the read operation.
     * @return {void} This function does not return anything.
     */
    _read(): void {
        this._flush();
    }

    /**
     * Pushes the next batch of elements from the buffer to the stream, handling backpressure.
     * @protected
     * @return {boolean} Needs drains
     */
    protected  _flush(): boolean {
        while (this.buffer.length > 0) {
            const chunk = this.buffer.shift() as Tout;
            if(!this.push(chunk)){   
                return true;
            }
        }
        return false;
    }
}