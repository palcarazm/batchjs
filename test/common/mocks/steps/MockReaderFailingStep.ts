import { MockPassingStep } from "./MockPassingStep";
import { Readable} from "stream";

export class MockReaderFailingStep extends MockPassingStep {
    protected _reader() {
        return new Readable({
            objectMode: true,
            read() {
                this.emit("error", new Error("Reader error"));
            }
        });
    }
}