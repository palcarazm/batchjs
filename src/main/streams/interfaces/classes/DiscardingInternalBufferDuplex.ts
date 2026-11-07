import { ExtendableDuplexEventMap } from "../events/_index";
import { InternalBufferDuplex } from "./InternalBufferDuplex";

/**
 * @abstract
 * @class
 * Abstract class that allows you to emit discarded data in a stream adding support to discard events implementing an internal buffer.
 * @extends InternalBufferDuplex    
 * @template Tin The type of the input data
 * @template Tout The type of the output data
 * @example
 * ```typescript
 * class DiscardingStreamImplementation<Tin> extends DiscardingInternalBufferDuplex<T,T> {
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
export abstract class DiscardingInternalBufferDuplex<Tin, Tout> extends InternalBufferDuplex<Tin, Tout, ExtendableDuplexEventMap<Tout, {discard: Tin}>> {
}