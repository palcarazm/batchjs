import { Job, JobOptions } from "../../../../src/common/index";
import { MockPassingStep } from "../_index";

export class MockPassingJob extends Job {
    constructor(options?:JobOptions){
        super("MockPassingJob",{},options);
    }
    protected _steps() {
        return [new MockPassingStep("step1"), new MockPassingStep("step2")];
    }
}
