/* eslint-disable @typescript-eslint/no-explicit-any */
import { Readable } from "stream";

export interface StreamEventEmitters {
    close: void;
    error: Error;
}

export interface ReadableEventEmitters extends StreamEventEmitters {
    data: any
    end: void;
    pause: void;
    readable: void;
    resume: void;
}

export interface WritableEventEmitters extends StreamEventEmitters{
    drain: void;
    finish: void;
    pipe: Readable;
    unpipe: Readable;
}

export interface DuplexEventEmitters extends WritableEventEmitters, ReadableEventEmitters {}