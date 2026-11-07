import { StepOptions } from "../../../../main/common";
import { MockPassingStep } from "./MockPassingStep";
import { Readable} from "node:stream";

export class MockReaderFailingStep extends MockPassingStep {
    constructor(name:string ="MockReaderFailingStep", delay: number = 0, options?: Partial<StepOptions>) {
        super(name, delay, options);
    }
    
    protected _reader() {
        return new Readable({
            objectMode: true,
            read() {
                this.emit("error", new Error("Reader error"));
            }
        });
    }
}