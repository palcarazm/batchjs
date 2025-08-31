import { DiscardingStreamEventEmitters, DiscardingStreamEventHandlers } from "../events/_index";
import { InternalBufferDuplex } from "./InternalBufferDuplex";
import {  ObjectDuplexOptions } from "./ObjectDuplex";

/**
 * @abstract
 * @class
 * Abstract class that allows you to emit discarded data in a stream adding support to discard events implementing an internal buffer.
 * @extends InternalBufferDuplex    
 * @template T
 * @example
 * ```typescript
 * class DiscardingStreamImplementation<T> extends DiscardingInternalBufferDuplex<T> {
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
export abstract class DiscardingInternalBufferDuplex<T> extends InternalBufferDuplex<T> {
    /**
     * @constructor
     * @param options {ObjectDuplexOptions}
     */
    constructor(options:ObjectDuplexOptions) {
        super(options);
    }

    addListener<U extends keyof DiscardingStreamEventHandlers<T>>(event: U, listener: DiscardingStreamEventHandlers<T>[U]): this {
        return super.addListener(event, listener);
    }

    emit<U extends keyof DiscardingStreamEventEmitters<T>>(event: U, ...args: Array<DiscardingStreamEventEmitters<T>[U]>): boolean {
        return super.emit(event, ...args);
    }

    on<U extends keyof DiscardingStreamEventHandlers<T>>(event: U, listener: DiscardingStreamEventHandlers<T>[U]): this {
        return super.on(event, listener);
    }

    once<U extends keyof DiscardingStreamEventHandlers<T>>(event: U, listener: DiscardingStreamEventHandlers<T>[U]): this {
        return super.once(event, listener);
    }

    prependListener<U extends keyof DiscardingStreamEventHandlers<T>>(event: U, listener: DiscardingStreamEventHandlers<T>[U]): this {
        return super.prependListener(event, listener);
    }

    prependOnceListener<U extends keyof DiscardingStreamEventHandlers<T>>(event: U, listener: DiscardingStreamEventHandlers<T>[U]): this {
        return super.prependOnceListener(event, listener);
    }

    removeListener<U extends keyof DiscardingStreamEventHandlers<T>>(event: U, listener: DiscardingStreamEventHandlers<T>[U]): this {
        return super.removeListener(event, listener);
    }
}