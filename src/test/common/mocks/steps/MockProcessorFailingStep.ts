import { Transform, TransformOptions } from "node:stream";
import { MockPassingStep } from "./MockPassingStep";
import { StepOptions } from "../../../../main/common";

export class MockProcessorFailingStep extends MockPassingStep {
    constructor(name:string ="MockProcessorFailingStep", delay: number = 0, options?: Partial<StepOptions>) {
        super(name, delay, options);
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
