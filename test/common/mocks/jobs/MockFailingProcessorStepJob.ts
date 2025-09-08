import { Job, JobOptions } from "../../../../src/common/index";
import { MockPassingStep, MockProcessorFailingStep } from "../_index";

export class MockProcessorFailingStepJob extends Job {
    constructor(options?: JobOptions) {
        super("MockFailingProcessorStepJob",undefined,options);
    }
    protected _steps() {
        return [new MockProcessorFailingStep("step1"), new MockPassingStep("step2")];
    }
}
