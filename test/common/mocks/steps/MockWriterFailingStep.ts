import { Writable, TransformCallback } from "stream";
import { MockPassingStep } from "./MockPassingStep";

export class MockWriterFailingStep extends MockPassingStep {
    constructor(name:string ="MockWriterFailingStep") {
        super(name);
    }
    
    protected _writer() {
        return new Writable({
            objectMode: true,
            write(chunk: unknown, encoding: BufferEncoding, callback: TransformCallback) {
                callback(new Error("Writer error"));
            }
        });
    }
}
