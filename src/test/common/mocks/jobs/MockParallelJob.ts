import { Job, JobOptions, Step } from "../../../../main/common/index";
import { MockPassingStep, MockProcessorFailingStep } from "../_index";

/**
 * Mock job with a parallel group where all steps pass.
 * Structure: sequential1 -> [parallel1, parallel2] -> sequential2
 */
export class MockParallelAllPassingJob extends Job {
    constructor(options?: JobOptions) {
        super("MockParallelAllPassingJob", {}, options);
    }

    protected _steps(): (Step | Step[])[] {
        return [
            new MockPassingStep("sequential1"),
            [new MockPassingStep("parallel1", 0), new MockPassingStep("parallel2", 25)],
            new MockPassingStep("sequential2"),
        ];
    }
}

/**
 * Mock job with a parallel group where one step fails.
 * Structure: sequential1 -> [parallel1, parallel2_failing, parallel3] -> sequential2 (should not run)
 */
export class MockParallelWithFailureJob extends Job {
    constructor(options?: JobOptions) {
        super("MockParallelWithFailureJob", {}, options);
    }

    protected _steps(): (Step | Step[])[] {
        return [
            new MockPassingStep("sequential1"),
            [
                new MockPassingStep("parallel1", 25),
                new MockProcessorFailingStep("parallel2_failing"),
                new MockPassingStep("parallel3", 25),
            ],
            new MockPassingStep("sequential2"), // Should not be reached
        ];
    }
}

/**
 * Mock job with a sequential step that fails before reaching the parallel group.
 * Structure: sequential1_failing -> [parallel1, parallel2] (should not run)
 */
export class MockSequentialFailingBeforeParallelJob extends Job {
    constructor(options?: JobOptions) {
        super("MockSequentialFailingBeforeParallelJob", {}, options);
    }

    protected _steps(): (Step | Step[])[] {
        return [
            new MockProcessorFailingStep("sequential1_failing"),
            [new MockPassingStep("parallel1"), new MockPassingStep("parallel2")],
        ];
    }
}