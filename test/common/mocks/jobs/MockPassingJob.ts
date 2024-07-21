import { Job } from "../../../../src/common/index";
import { MockPassingStep } from "../_index";

export class MockPassingJob extends Job {
    protected _steps() {
        return [new MockPassingStep(), new MockPassingStep()];
    }
}
