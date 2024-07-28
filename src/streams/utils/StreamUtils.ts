import {Readable,ReadableOptions,Writable,WritableOptions, TransformCallback} from "stream";
import { PushError } from "../errors/PushError";

/**
 * @abstract
 * @class
 * Utility class for streams exposing static methods.
 */
export abstract class StreamUtils {
    /**
     * Merges multiple readable streams into a single duplex stream.
     * @example
     * ```typescript
     *  const streams: Array<Readable> = [
     *      Readable.from(["a","b"],{objectMode: true}),
     *      Readable.from(["c"],{objectMode: true}),
     *      Readable.from(["d","e"],{objectMode: true})
     *  ];
     *
     *  const merged: Readable = StreamUtils.mergeStreams(streams,{objectMode: true});
     *  merged.on("data", (chunk: string) => {
     *      console.log(`Received chunk: ${chunk}`);
     *  });
     * ```
     * ```shell
     * >> Received chunk: a
     * >> Received chunk: b
     * >> Received chunk: c
     * >> Received chunk: d
     * >> Received chunk: e
     * ```
     * @param {Array<Readable>} streams An array of readable streams to merge.
     * @param {ReadableOptions} options The options for the Readable stream.
     * @return {Readable} A readable stream that combines the input streams.
     * @static
     */
    public static mergeStreams(streams: Array<Readable>, options:ReadableOptions = {}): Readable {
        let endSignals:number = 0;
        const merged:Readable = new Readable({
            ...options,
            read(){}
        });

        streams.forEach((stream: Readable ) => {
            stream.on("data", (chunk: unknown) => {
                merged.push(chunk);
            }).once("end", () => {
                endSignals++;
                if (endSignals === streams.length) {
                    merged.push(null);
                }
            });
        });

        return merged;
    }

    /**
     * Returns a stream that split the input stream into multiple writable streams.
     * @example
     * ```typescript
     *  const streams: Array<Writable> = [
     *    new Writable({
     *      objectMode: true},
     *      write(chunk: unknown, encoding: BufferEncoding, callback: TransformCallback) {
     *        console.log(`Writer 1 - Received chunk: ${chunk}`);
     *        callback();
     *      }
     *    }),
     *    new Writable({
     *      objectMode: true},
     *      write(chunk: unknown, encoding: BufferEncoding, callback: TransformCallback) {
     *        console.log(`Writer 1 - Received chunk: ${chunk}`);
     *        callback();
     *      }
     *    }),
     *  ];
     *
     *  const splitter: Writable = StreamUtils.splitStreams(streams);

     *  splitter.write("a");
     *  splitter.write("b");
     *  splitter.write("c");
     *  splitter.end();
     * ```
     * ```shell
     * >> Writer 1 - Received chunk: a
     * >> Writer 2 - Received chunk: a
     * >> Writer 1 - Received chunk: b
     * >> Writer 2 - Received chunk: b
     * >> Writer 1 - Received chunk: c
     * >> Writer 2 - Received chunk: c
     * ```
     * @param {Array<Writable>} streams An array of writable streams to send the input stream.
     * @param {WritableOptions} options The options for the Writable stream.
     * @return {Writable} A splitter stream that sends the input stream to the provided writable streams.
     * @static
     */
    public static splitStreams(streams: Array<Writable>, options:WritableOptions = {}):Writable {
        const splitter:Writable = new Writable({
            ...options,
            write(chunk:unknown, encoding: BufferEncoding, callback: TransformCallback) {
                try {
                    streams.forEach((stream: Writable ) => {
                        if(!stream.write(chunk)){
                            throw new PushError();
                        }
                    });
                    callback();
                } catch (error) {
                    callback(error as Error);
                }
            },
            final(callback:TransformCallback) {
                streams.forEach((stream: Writable ) => {
                    stream.end();
                });
                callback();
            }
        });
        
        return splitter;
    }
}