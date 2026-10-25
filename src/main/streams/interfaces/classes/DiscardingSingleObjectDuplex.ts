import { ExtendableDuplexEventMap } from "../events/_index";
import { SingleObjectDuplex } from "./SingleObjectDuplex";

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
export abstract class DiscardingSingleObjectDuplex<Tin, Tout> extends SingleObjectDuplex<Tin, Tout, ExtendableDuplexEventMap<Tout, {discard: Tin}>> {

}