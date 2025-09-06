import { DiscardingStreamEventEmitters, DiscardingStreamEventHandlers } from "../events/_index";
import { SingleObjectDuplex } from "./SingleObjectDuplex";
import {  ObjectDuplexOptions } from "./ObjectDuplex";

/**
 * @abstract
 * @class
 * Abstract class that allows you to emit discarded data in a single data stream adding support to discard events.
 * @extends SingleObjectDuplex    
 * @template Tin
 * @template Tout
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
     * @constructor
     * @param options {ObjectDuplexOptions}
     * @param {Function} canEarlyFlush - A function that returns a boolean indicating whether the stream can early flush.
     */
    constructor(options:ObjectDuplexOptions, canEarlyFlush:()=>boolean) {
        super(options, canEarlyFlush);
    }

    addListener<U extends keyof DiscardingStreamEventHandlers<Tin>>(event: U, listener: DiscardingStreamEventHandlers<Tin>[U]): this {
        return super.addListener(event, listener);
    }

    emit<U extends keyof DiscardingStreamEventEmitters<Tin>>(event: U, ...args: Array<DiscardingStreamEventEmitters<Tin>[U]>): boolean {
        return super.emit(event, ...args);
    }

    on<U extends keyof DiscardingStreamEventHandlers<Tin>>(event: U, listener: DiscardingStreamEventHandlers<Tin>[U]): this {
        return super.on(event, listener);
    }

    once<U extends keyof DiscardingStreamEventHandlers<Tin>>(event: U, listener: DiscardingStreamEventHandlers<Tin>[U]): this {
        return super.once(event, listener);
    }

    prependListener<U extends keyof DiscardingStreamEventHandlers<Tin>>(event: U, listener: DiscardingStreamEventHandlers<Tin>[U]): this {
        return super.prependListener(event, listener);
    }

    prependOnceListener<U extends keyof DiscardingStreamEventHandlers<Tin>>(event: U, listener: DiscardingStreamEventHandlers<Tin>[U]): this {
        return super.prependOnceListener(event, listener);
    }

    removeListener<U extends keyof DiscardingStreamEventHandlers<Tin>>(event: U, listener: DiscardingStreamEventHandlers<Tin>[U]): this {
        return super.removeListener(event, listener);
    }
}