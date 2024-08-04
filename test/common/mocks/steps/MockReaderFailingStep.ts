import { MockPassingStep } from "./MockPassingStep";
import { Readable} from "stream";

export class MockReaderFailingStep extends MockPassingStep {
    constructor(name:string ="MockReaderFailingStep") {
        super(name);
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