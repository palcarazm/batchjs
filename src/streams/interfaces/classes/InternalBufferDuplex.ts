import { TransformCallback } from "stream";
import { ObjectDuplex, ObjectDuplexOptions } from "./ObjectDuplex";

/**
 * @abstract
 * @class
 * Abstract class that implements an stream that buffers data internally.
 * @extends ObjectDuplex
 * @template T
 */
export abstract class InternalBufferDuplex<T> extends ObjectDuplex {
    protected buffer: T[] = [];

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
        /**
         * Pushes the next batch of elements from the buffer to the stream, handling backpressure.
         *
         * @return {void} This function does not return anything.
         */
        const pushNext = () => {
            if (this.buffer.length === 0) {
                callback();
                this.push(null);
                return;
            }
    
            const chunk = this.buffer.shift() as T;
            if (!this.push(chunk)) {
                this.once("drain", pushNext);
            } else {
                setImmediate(pushNext);
            }
        };
    
        pushNext();
    }

    /**
     * Pushes the ready chunks to the consumer stream since the buffer is empty or the size limit is reached.
     *
     * @param {number} size - The size parameter for controlling the read operation.
     * @return {void} This function does not return anything.
     */
    _read(size: number): void {
        while (this.buffer.length > 0 && size > 0) {
            const chunk = this.buffer.shift() as T;
            if(!this.push(chunk)){
                return;
            };
            size--;
        }
    }
}