import {Readable, ReadableOptions, Writable, WritableOptions, TransformCallback} from "stream";

export function chunks2Readable(chunks: Array<unknown>,options:ReadableOptions={}): Readable {
    return new Readable({
        ...options,
        read(){
            chunks.forEach((chunk: unknown) => {
                this.push(chunk);
            });
            this.push(null);
        }
    });
}

export class CollectStream extends Writable {
    public chunks: Array<unknown> = [];
    constructor(options: WritableOptions = {}) {
        super(options); 
    }

    _write(chunk: unknown, encoding: BufferEncoding, callback: TransformCallback) {
        this.chunks.push(chunk);
        callback();
    }
}

export function buffer2String(buffer: Array<Buffer>, encoding: BufferEncoding = "utf8"): Array<string> {
    return buffer.map((chunk) => chunk.toString(encoding));
}