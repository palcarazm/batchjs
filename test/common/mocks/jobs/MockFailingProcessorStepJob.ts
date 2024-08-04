import { Job } from "../../../../src/common/index";
import { MockPassingStep, MockProcessorFailingStep } from "../_index";

export class MockProcessorFailingStepJob extends Job {
    constructor() {
        super("MockFailingProcessorStepJob");
    }
    protected _steps() {
        return [new MockProcessorFailingStep(), new MockPassingStep()];
    }
}
