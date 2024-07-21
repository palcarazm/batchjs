/* eslint-disable @typescript-eslint/no-explicit-any */
import { Readable } from "stream";

export interface StreamEventHandlers {
    close: () => void;
    error: (err: Error) => void;
}

export interface ReadableEventHandlers extends StreamEventHandlers {
    data: (chunk: any) => void;
    end: () => void;
    pause: () => void;
    readable: () => void;
    resume: () => void;
}

export interface WritableEventHandlers extends StreamEventHandlers{
    drain: () => void;
    finish: () => void;
    pipe: (src: Readable) => void;
    unpipe: (src: Readable) => void;
}

export interface DuplexEventHandlers extends WritableEventHandlers, ReadableEventHandlers {}