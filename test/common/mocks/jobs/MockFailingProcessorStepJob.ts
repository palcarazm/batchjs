import { Job } from "../../../../src/common/index";
import { MockPassingStep, MockProcessorFailingStep } from "../_index";

export class MockProcessorFailingStepJob extends Job {
    protected _steps() {
        return [new MockProcessorFailingStep(), new MockPassingStep()];
    }
}
