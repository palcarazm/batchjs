import { DiscardingStreamEventEmitters, DiscardingStreamEventHandlers } from "../events/_index";
import { SingleObjectDuplex } from "./SingleObjectDuplex";
import {  ObjectDuplexOptions } from "./ObjectDuplex";

/**
 * @abstract
 * @class
 * Abstract class that allows you to emit discarded data in a single data stream adding support to discard events.
 * @extends SingleObjectDuplex    
 * @template Tin The type of the input data
 * @template Tout The type of the output data
 * @example
 * ```typescript
 * class DiscardingStreamImplementation<Tin> extends DiscardingSingleObjectDuplex<Tin> {
 *     constructor(){
 *         super({objectMode: true});
 *     }
 * 
 *     _write(chunk: T, encoding: BufferEncoding, callback: TransformCallback): void {
 *         this.emit("discard", chunk);
 *         callback();
 *     }
 * 
 *     _final(callback: TransformCallback): void {
 *         this.push(null);
 *         callback();
 *     }
 * 
 *     _read(): void {}
 * }
 * const stream:DiscardingStreamImplementation<string> = new DiscardingStreamImplementation();
 * 
 * stream.write("data1"); //Discarded
 * stream.write("data2"); //Discarded
 * stream.write("data3"); //Discarded
 * stream.end();
 * 
 * stream.on("discard", (chunk: string) => {
 *     console.log(``Discarded chunk: ${chunk}```);
 * });
 * ```
 * ```shell
 * >> Discarded chunk: data1
 * >> Discarded chunk: data2
 * >> Discarded chunk: data3
 * ```
 */
export abstract class DiscardingSingleObjectDuplex<Tin,Tout> extends SingleObjectDuplex<Tin,Tout> {
    /**
     * @param options {ObjectDuplexOptions}
     * @param {Function} canEarlyFlush - A function that returns a boolean indicating whether the stream can early flush.
     */
    constructor(options:ObjectDuplexOptions, canEarlyFlush:()=>boolean) {
        super(options, canEarlyFlush);
    }

    /**
     * Adds an event listener to the specified event type.
     * @template U Type of the event.
     * @param {U} event Event type
     * @param {DiscardingStreamEventHandlers<Tin>[U]} listener Event listener
     * @returns {this} allowing to chain
     */
    addListener<U extends keyof DiscardingStreamEventHandlers<Tin>>(event: U, listener: DiscardingStreamEventHandlers<Tin>[U]): this {
        return super.addListener(event, listener);
    }

    /**
     * Emits an event of the specified type to the listeners.
     * @template U Type of the event.
     * @param {U} event Event type
     * @param {...Array<DiscardingStreamEventEmitters<Tin>>} args Additional arguments to pass to the listeners
     * @returns  {boolean}
     */

    emit<U extends keyof DiscardingStreamEventEmitters<Tin>>(event: U, ...args: Array<DiscardingStreamEventEmitters<Tin>[U]>): boolean {
        return super.emit(event, ...args);
    }

    /**
     * Adds an event listener to the specified event type.
     * @template U Type of the event.
     * @param {U} event Event type
     * @param {DiscardingStreamEventHandlers<Tin>[U]} listener Event listener
     * @returns {this} allowing to chain
     */
    on<U extends keyof DiscardingStreamEventHandlers<Tin>>(event: U, listener: DiscardingStreamEventHandlers<Tin>[U]): this {
        return super.on(event, listener);
    }

    /**
     * Adds a one time event listener to the specified event type.
     * @template U Type of the event.
     * @param {U} event Event type
     * @param {DiscardingStreamEventHandlers<Tin>[U]} listener Event listener
     * @returns {this} allowing to chain
     */
    once<U extends keyof DiscardingStreamEventHandlers<Tin>>(event: U, listener: DiscardingStreamEventHandlers<Tin>[U]): this {
        return super.once(event, listener);
    }

    /**
     * Adds an event listener to the specified event type to the beginning of the listeners array.
     * @template U Type of the event.
     * @param {U} event Event type
     * @param {DiscardingStreamEventHandlers<Tin>[U]} listener Event listener
     * @returns {this} allowing to chain
     */
    prependListener<U extends keyof DiscardingStreamEventHandlers<Tin>>(event: U, listener: DiscardingStreamEventHandlers<Tin>[U]): this {
        return super.prependListener(event, listener);
    }

    /**
     * Adds a one time event listener to the specified event type to the beginning of the listeners array.
     * @template U Type of the event.
     * @param {U} event Event type
     * @param {DiscardingStreamEventHandlers<Tin>[U]} listener Event listener
     * @returns {this} allowing to chain
     */
    prependOnceListener<U extends keyof DiscardingStreamEventHandlers<Tin>>(event: U, listener: DiscardingStreamEventHandlers<Tin>[U]): this {
        return super.prependOnceListener(event, listener);
    }
    
    /**
     * Removes an event listener to the specified event type.
     * @template U Type of the event.
     * @param {U} event Event type
     * @param {DiscardingStreamEventHandlers<Tin>[U]} listener Event listener
     * @returns {this} allowing to chain
     */
    removeListener<U extends keyof DiscardingStreamEventHandlers<Tin>>(event: U, listener: DiscardingStreamEventHandlers<Tin>[U]): this {
        return super.removeListener(event, listener);
    }
}