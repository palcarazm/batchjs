import { MockProcessorFailingStepJob,MockPassingJob } from "../mocks/jobs/_index";

describe("Job", () => {
    test("should run all steps successfully", async () => {
        const job = new MockPassingJob();
        await expect(job.run()).resolves.toBeUndefined();
    });

    test("should reject if a step fails", async () => {
        const job = new MockProcessorFailingStepJob();
        await expect(job.run()).rejects.toThrow("Processor error");
    });
});
