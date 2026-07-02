import { TransformCallback } from "node:stream";
import { ObjectDuplex, ObjectDuplexOptions } from "./ObjectDuplex";
import { DuplexEventMap } from "../_index";

/**
 * @abstract
 * @class
 * Abstract class that implements an stream that buffers data internally.
 * @extends ObjectDuplex
 * @template Tin The type of the input data
 * @template Tout The type of the output data
 * @template TEventMap The type of the event map
 */
export abstract class InternalBufferDuplex<Tin, Tout, TEventMap extends DuplexEventMap<Tout> = DuplexEventMap<Tout>> extends ObjectDuplex<Tin, Tout, TEventMap> {
    protected buffer: Tout[] = [];

    /**
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
                const timer = setTimeout(()=>this.emit("drain"), this.drainTimeout);
                this.once("drain", () => {
                    clearTimeout(timer);
                    finalize(callback);
                });
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