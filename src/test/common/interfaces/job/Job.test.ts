import { RunnableStatus } from "../../../../main/common";
import { MockProcessorFailingStepJob,MockPassingJob, MockParallelAllPassingJob, MockParallelWithFailureJob, MockSequentialFailingBeforeParallelJob } from "../../mocks/jobs/_index";

describe("Job", () => {
    test("should run all steps successfully", async () => {
        const job = new MockPassingJob();
        await expect(job.run()).resolves.toBeUndefined();
    });

    test("should reject if a step fails", async () => {
        const job = new MockProcessorFailingStepJob();
        await expect(job.run()).rejects.toThrow("Processor error");
    });

    test("should run parallel steps successfully", async () => {
        const job = new MockParallelAllPassingJob();
        await expect(job.run()).resolves.toBeUndefined();

        const metrics = job.metrics;
        expect(metrics.status).toBe(RunnableStatus.COMPLETED);
        // sequential1, parallel1, parallel2, sequential2
        expect(metrics.steps).toHaveLength(4);
        
        const stepNames = metrics.steps.map(s => s.name);
        expect(stepNames).toContain("sequential1");
        expect(stepNames).toContain("parallel1");
        expect(stepNames).toContain("parallel2");
        expect(stepNames).toContain("sequential2");
    });

    test("should cancel parallel steps on failure", async () => {
        const job = new MockParallelWithFailureJob();
        await expect(job.run()).rejects.toThrow("Processor error");

        const metrics = job.metrics;
        expect(metrics.status).toBe(RunnableStatus.FAILED);

        // Failed step should be in metrics
        const failedStep = metrics.steps.find(s => s.name === "parallel2_failing");
        expect(failedStep).toBeDefined();
        expect(failedStep?.status).toBe(RunnableStatus.FAILED);

        // Other parallel steps should have run or been cancelled
        const parallel1 = metrics.steps.find(s => s.name === "parallel1");
        const parallel3 = metrics.steps.find(s => s.name === "parallel3");
        expect(parallel1).toBeDefined();
        expect(parallel1?.status).toMatch(/(CANCELLED|COMPLETED)$/);
        expect(parallel3).toBeDefined();
        expect(parallel3?.status).toMatch(/(CANCELLED|COMPLETED)$/);
    });

    test("should not run subsequent steps after parallel failure", async () => {
        const job = new MockParallelWithFailureJob();
        await expect(job.run()).rejects.toThrow("Processor error");

        const stepNames = job.metrics.steps.map(s => s.name);

        // Only sequential1 and the parallel group steps should exist
        expect(stepNames).toContain("sequential1");
        expect(stepNames).toContain("parallel1");
        expect(stepNames).toContain("parallel2_failing");
        expect(stepNames).toContain("parallel3");

        // sequential2 should NOT be in metrics
        expect(stepNames).not.toContain("sequential2");
    });

    test("should run mixed sequential and parallel steps in correct order", async () => {
        const job = new MockParallelAllPassingJob();
        
        await expect(job.run()).resolves.toBeUndefined();

        const metrics = job.metrics;
        const stepNames = metrics.steps.map(s => s.name);
        
        expect(stepNames).toEqual(["sequential1", "parallel1", "parallel2", "sequential2"]);
        expect(metrics.status).toBe(RunnableStatus.COMPLETED);
    });

    test("should halt job when sequential step fails before parallel group", async () => {
        const job = new MockSequentialFailingBeforeParallelJob();
        await expect(job.run()).rejects.toThrow("Processor error");

        const metrics = job.metrics;
        expect(metrics.status).toBe(RunnableStatus.FAILED);
        
        expect(metrics.steps).toHaveLength(1);
        expect(metrics.steps[0].name).toBe("sequential1_failing");
        expect(metrics.steps[0].status).toBe(RunnableStatus.FAILED);
    });
});
