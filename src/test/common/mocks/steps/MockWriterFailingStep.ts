import { Writable, TransformCallback } from "node:stream";
import { MockPassingStep } from "./MockPassingStep";
import { StepOptions } from "../../../../main/common";

export class MockWriterFailingStep extends MockPassingStep {
    constructor(name:string ="MockWriterFailingStep", delay: number = 0, options?: Partial<StepOptions>) {
        super(name, delay, options);
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
