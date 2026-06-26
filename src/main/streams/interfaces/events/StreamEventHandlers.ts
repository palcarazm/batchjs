/* eslint-disable @typescript-eslint/no-explicit-any */
import { Readable } from "node:stream";

/**
 * @interface
 * Interface that represents the event handlers of a stream.
 */
export interface StreamEventHandlers {
    /**
     * Closes the stream.
     */
    close: () => void;

    /**
     * Emits an error on the stream.
     */
    error: (err: Error) => void;
}

/**
 * @interface
 * Interface that represents the event handlers of a readable stream.
 */
export interface ReadableEventHandlers extends StreamEventHandlers {
    /**
     * Emits a chunk on the stream.
     */
    data: (chunk: any) => void;

    /**
     * Emits the end event on the stream.
     */
    end: () => void;

    /**
     * Pauses the stream.
     */
    pause: () => void;

    /**
     * Resumes the stream.
     */
    readable: () => void;

    /**
     * Resumes the stream.
     */
    resume: () => void;
}

/**
 * @interface
 * Interface that represents the event handlers of a writable stream.
 */
export interface WritableEventHandlers extends StreamEventHandlers{
    /**
     * Emits the drain event on the stream.
     */
    drain: () => void;

    /**
     * Emits the finish event on the stream.
     */
    finish: () => void;

    /**
     * Emits the pipe event on the stream.
     */
    pipe: (src: Readable) => void;

    /**
     * Emits the unpipe event on the stream.
     */
    unpipe: (src: Readable) => void;
}

/**
 * @interface
 * Interface that represents the event handlers of a duplex stream.
 */
export interface DuplexEventHandlers extends WritableEventHandlers, ReadableEventHandlers {}

/**
 * @interface
 * Interface that represents the event handlers of a duplex stream adding support to discard events.
 */
export interface DiscardingStreamEventHandlers<T> extends DuplexEventHandlers {
    /**
     * Emits the discard event on the stream.
     */
    discard: (chunk: T) => void;
}