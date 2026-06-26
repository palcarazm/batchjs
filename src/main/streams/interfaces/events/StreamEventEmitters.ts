/* eslint-disable @typescript-eslint/no-explicit-any */
import { Readable } from "node:stream";

/**
 * @interface
 * Interface that represents the event emitters of a stream.
 */
export interface StreamEventEmitters {
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
 */
export interface ReadableEventEmitters extends StreamEventEmitters {
    /**
     * Emits data
     */
    data: any;

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
 * @interface
 * Interface that represents the event emitters of a writable stream.
 */
export interface WritableEventEmitters extends StreamEventEmitters{
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
 * @interface
 * Interface that represents the event emitters of a duplex stream.
 */
export interface DuplexEventEmitters extends WritableEventEmitters, ReadableEventEmitters {}

/**
 * @interface
 * Interface that represents the event emitters of a duplex stream adding support to discard events.
 */
export interface DiscardingStreamEventEmitters<T> extends DuplexEventEmitters {
    /**
     * Emits the discard event
     */
    discard: T;
}