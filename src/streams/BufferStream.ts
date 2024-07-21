import { Duplex, DuplexOptions, TransformCallback } from "stream";
import { PushError } from "./errors/PushError";

export interface BufferStreamOptions extends DuplexOptions {
    batchSize: number;
    objectMode:true;
}

export class BufferStream<T> extends Duplex {
    private batchSize: number;
    private buffer: T[] = [];

    constructor(options: BufferStreamOptions) {
        super(options);
        this.batchSize = options.batchSize;
    }

    _write(chunk: T, encoding: BufferEncoding, callback: TransformCallback): void {
        this.buffer.push(chunk);
        callback();
    }

    _final(callback: TransformCallback): void {
        while (this.buffer.length > 0) {
            const batch = this.buffer.splice(0, this.batchSize);
            if (!this.push(batch)) {
                this.buffer.unshift(...batch);
                callback(new PushError());
                return;
            }
        }
        this.push(null);
        callback();
    }

    _read(size: number): void {
        while (this.buffer.length > 0 && size > 0) {
            const batch = this.buffer.splice(0, this.batchSize);
            if (!this.push(batch)) {
                this.buffer.unshift(...batch);
            }
            size--;
        }
    }
}