import { Transform, TransformOptions } from "stream";
import { MockPassingStep } from "./MockPassingStep";

export class MockProcessorFailingStep extends MockPassingStep {
    constructor(name:string ="MockProcessorFailingStep") {
        super(name);
    }
    
    protected _processors() {
        const opts: TransformOptions = {
            objectMode: true,
            transform() {
                this.emit("error", new Error("Processor error"));
            }
        };
        return [new Transform(opts)];
    }
}
