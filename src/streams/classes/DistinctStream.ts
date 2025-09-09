import { TransformCallback } from "stream";
import { DiscardingInternalBufferDuplex, ObjectDuplexOptions } from "../interfaces/_index";

/**
 * @interface
 * Options for the FilterStream.
 * @extends DuplexOptions
 * @template TInput
 * @template TKey
 */
export interface DistinctStreamOptions<TInput,TKey> extends ObjectDuplexOptions {
    keyExtractor: (chunk: TInput) => TKey;
}

/**
 * @class
 * Class that allows you to discard repeated data in a stream in base on a key.
 * Data with duplicated key will be emitted through the discard event.
 * @extends DiscardingInternalBufferDuplex
 * @template TInput
 * @template TKey
 * @example
 * ```typescript
 * const stream:DistinctStream<string,string> = new DistinctStream({
 *     objectMode: true,
 *     keyExtractor: (chunk: string) => chunk,
 * });
 * 
 * stream.write("data1");
 * stream.write("data2");
 * stream.write("data1"); //Duplicated
 * stream.end();
 * 
 * stream.on("data", (chunk: string) => {
 *     console.log(``Pushed chunk: ${chunk}```);
 * });
 * stream.on("discard", (chunk: string) => {
 *     console.log(``Duplicated chunk: ${chunk}```);
 * });
 * ```
 * ```shell
 * >> Pushed chunk: data1
 * >> Pushed chunk: data2
 * >> Duplicated chunk: data1
 * ```
 */
export class DistinctStream<TInput,TKey> extends DiscardingInternalBufferDuplex<TInput,TInput> {
    private readonly keySet: Set<TKey> = new Set();
    private readonly _keyExtractor: (chunk: TInput) => TKey;

    /**
     * @constructor
     * @param {DistinctStreamOptions} options - The options for the FilterStream.
     * @param [options.keyExtractor] {Function} - The key extractor function for determining the key of the data to be filtered.
     */
    constructor(options: DistinctStreamOptions<TInput,TKey>) {
        super(options);
        this._keyExtractor = options.keyExtractor;
    }

    /**
     * A method to write data to the stream, get the key of the data, and if the key is not in the set, push the data to the buffer, otherwise discard it.
     *
     * @param {TInput} chunk - The data chunk to write to the stream.
     * @param {BufferEncoding} encoding - The encoding of the data.
     * @param {TransformCallback} callback - The callback function to be executed after writing the data.
     * @return {void} This function does not return anything.
     */
    _write(chunk: TInput, encoding: BufferEncoding, callback: TransformCallback): void {
        const key = this._keyExtractor(chunk);
        if(!this.keySet.has(key)){
            this.keySet.add(key);
            this.push(chunk);
            this._flush();
        }else{
            this.emit("discard", chunk);
        }
        callback();
    }
}