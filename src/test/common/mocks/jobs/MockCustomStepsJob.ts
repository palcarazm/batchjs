import { Job, JobOptions, Step } from "../../../../main/common/index";

export class MockCustomStepsJob extends Job {
    constructor(
        name: string,
        public readonly steps: (Step | Step[])[] ,
        options?: JobOptions
    ) {
        super(name, {}, options);
    }

    protected _steps(): (Step | Step[])[] {
        return this.steps;
    }
}