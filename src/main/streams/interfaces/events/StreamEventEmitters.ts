/* eslint-disable @typescript-eslint/no-explicit-any */
import { Readable } from "node:stream";

/**
 * @interface
 * Interface that represents the event emitters of a stream.
 */
export interface StreamEventMap {
    /**
     * Closes the stream
     */
    close: void;

    /**
     * Emits an error
     */
    error: Error;
}

/**
 * @interface
 * Interface that represents the event emitters of a readable stream.
 * @template TOuput - The type of data emitted by the readable stream.
 */
export interface ReadableEventMap<TOuput = any> extends StreamEventMap {
    /**
     * Emits data
     */
    data: TOuput;

    /**
     * Emits the end of the stream
     */
    end: void;

    /**
     * Pauses the stream
     */
    pause: void;

    /**
     * Resumes the stream
     */
    readable: void;

    /**
     * Resumes the stream
     */
    resume: void;
}

/**
 * Helper type to prevent conflicts with readable event keys.
 * If a custom event key matches a readable event key, it will be replaced with an error message.
 * 
 * @template TOuput - The type of data emitted by the readable stream.
 * @template TEventMap - Custom event map to merge with readable events.
 */
export type NoReadableEventMap<TOuput, TEventMap> =
  keyof TEventMap & keyof ReadableEventMap<TOuput> extends never
    ? TEventMap
    : {
        [K in keyof TEventMap]: K extends keyof ReadableEventMap<TOuput>
          ? `❌ Event key "${K & string}" conflicts with readable event. Use a different name.`
          : TEventMap[K];
      };

/**
 * Extends the readable event map with custom events.
 * Prevents key conflicts with readable events.
 * 
 * @template TOuput - The type of data emitted by the readable stream.
 * @template TEventMap - Custom event map to merge with readable events.
 * 
 * @example
 * ```typescript
 * type MyEvents = ExtendableReadableEventMap<{
 *   "data-loaded": { records: number };
 * }>;
 * // Results in: ReadableEventMap & { "data-loaded": { records: number } }
 * 
 * type InvalidEvents = ExtendableReadableEventMap<{ started: {} }>;
 * // Results in: { started: "❌ Event key \"started\" conflicts with readable event. Use a different name." }
 * ```
 */
export type ExtendableReadableEventMap<TOuput, TEventMap> =
  NoReadableEventMap<TOuput, TEventMap> & Omit<ReadableEventMap<TOuput>, keyof TEventMap>;



/**
 * @interface
 * Interface that represents the event emitters of a writable stream.
 */
export interface WritableEventMap extends StreamEventMap{
    /**
     * Emits the drain event
     */
    drain: void;

    /**
     * Emits the finish event
     */
    finish: void;

    /**
     * Emits the pipe event
     */
    pipe: Readable;

    /**
     * Emits the unpipe event
     */
    unpipe: Readable;
}

/**
 * Helper type to prevent conflicts with writable event keys.
 * If a custom event key matches a writable event key, it will be replaced with an error message.
 * 
 * @template TEventMap - Custom event map to merge with writable events.
 */
export type NoWritableEventMap<TEventMap> =
  keyof TEventMap & keyof WritableEventMap extends never
    ? TEventMap
    : {
        [K in keyof TEventMap]: K extends keyof WritableEventMap
          ? `❌ Event key "${K & string}" conflicts with writable event. Use a different name.`
          : TEventMap[K];
      };

/**
 * Extends the writable event map with custom events.
 * Prevents key conflicts with writable events.
 * 
 * @template TEventMap - Custom event map to merge with writable events.
 * 
 * @example
 * ```typescript
 * type MyEvents = ExtendableWritableEventMap<{
 *   "data-loaded": { records: number };
 * }>;
 * // Results in: WritableEventMap & { "data-loaded": { records: number } }
 * 
 * type InvalidEvents = ExtendableWritableEventMap<{ started: {} }>;
 * // Results in: { started: "❌ Event key \"started\" conflicts with writable event. Use a different name." }
 * ```
 */
export type ExtendableWritableEventMap<TEventMap> =
  NoWritableEventMap<TEventMap> & Omit<WritableEventMap, keyof TEventMap>;


/**
 * @interface
 * Interface that represents the event emitters of a duplex stream.
 * 
 * @template TOuput - The type of data emitted by the readable stream.
 */
export interface DuplexEventMap<TOuput = any> extends WritableEventMap, ReadableEventMap<TOuput> {}


/**
 * Helper type to prevent conflicts with duplex event keys.
 * If a custom event key matches a duplex event key, it will be replaced with an error message.
 * 
 * @template TOuput - The type of data emitted by the readable stream.
 * @template TEventMap - Custom event map to merge with duplex events.
 */
export type NoDuplexEventMap<TOuput, TEventMap> =
  keyof TEventMap & keyof DuplexEventMap<TOuput> extends never
    ? TEventMap
    : {
        [K in keyof TEventMap]: K extends keyof DuplexEventMap<TOuput>
          ? `❌ Event key "${K & string}" conflicts with duplex event. Use a different name.`
          : TEventMap[K];
      };

/**
 * Extends the duplex event map with custom events.
 * Prevents key conflicts with duplex events.
 * 
 * @template TOuput - The type of data emitted by the readable stream.
 * @template TEventMap - Custom event map to merge with duplex events.
 * 
 * @example
 * ```typescript
 * type MyEvents = ExtendableDuplexEventMap<{
 *   "data-loaded": { records: number };
 * }>;
 * // Results in: DuplexEventMap & { "data-loaded": { records: number } }
 * 
 * type InvalidEvents = ExtendableDuplexEventMap<{ started: {} }>;
 * // Results in: { started: "❌ Event key \"started\" conflicts with duplex event. Use a different name." }
 * ```
 */
export type ExtendableDuplexEventMap<TOuput, TEventMap> =
  NoDuplexEventMap<TOuput, TEventMap> & Omit<DuplexEventMap<TOuput>, keyof TEventMap>;