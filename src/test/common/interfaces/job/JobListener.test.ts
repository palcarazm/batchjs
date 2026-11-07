/// <reference types="jest" />
import {
    Logger,
    RunnableStatus,
} from "../../../../main/common/index";
import { MockProcessorFailingStep } from "../../mocks/_index";
import {
    MockCustomStepsJob,
    MockPassingJob,
    MockProcessorFailingStepJob,
} from "../../mocks/jobs/_index";

class MockLogger implements Logger {
    debug = jest.fn();
    info = jest.fn();
    warn = jest.fn();
    error = jest.fn();
}

describe("JobListener", () => {
    let passingJob: MockPassingJob;
    let failingJob: MockProcessorFailingStepJob;
    let logger: MockLogger;

    beforeEach(() => {
        logger = new MockLogger();
        passingJob = new MockPassingJob({ logger });
        failingJob = new MockProcessorFailingStepJob({ logger });
    });

    test("should capture job start and end metrics", (done) => {
        passingJob.once("finished", () => {
            const metrics = passingJob.metrics;
            expect(metrics.name).toBe("MockPassingJob");
            expect(metrics.status).toBe(RunnableStatus.COMPLETED);
            expect(metrics.duration?.ms).toBeGreaterThan(0);
            expect(metrics.steps).toHaveLength(2);
            expect(metrics.steps[0].name).toBe("step1");
            expect(metrics.steps[1].name).toBe("step2");
            expect(logger.info).toHaveBeenCalled();
            done();
        });
        passingJob.run();
    });

    test("should capture step metrics correctly", (done) => {
        passingJob.once("finished", () => {
            const stepMetrics = passingJob.metrics.steps;
            for (const step of stepMetrics) {
                expect(step.status).toBe(RunnableStatus.COMPLETED);
                expect(step.duration?.ms).toBeGreaterThan(0);
            }
            done();
        });
        passingJob.run();
    });

    test("should log errors and mark job as failed", (done) => {
        failingJob
            .once("failed", ({ error }) => {
                expect(error).toBeDefined();
                expect(error?.message).toBe("Processor error");
            })
            .once("finished", () => {
                const metrics = failingJob.metrics;
                expect(metrics.status).toBe(RunnableStatus.FAILED);
                expect(metrics.steps[0].status).toBe(
                    RunnableStatus.FAILED
                );
                expect(logger.error).toHaveBeenCalled();
                done();
            });
        failingJob.run();
    });

    test("should log rollback success", (done) => {
        const step = new MockProcessorFailingStep("rollback-step", 0, { autoRollback: true });
        jest.spyOn(step as unknown as { _rollback: () => Promise<void> }, "_rollback")
            .mockImplementationOnce(() => Promise.resolve());

        const job = new MockCustomStepsJob("test-job", [step], { logger });

        job.once("finished", () => {
            expect(logger.info).toHaveBeenCalledWith(
                expect.stringContaining("rollback succeeded")
            );
            done();
        });

        job.run();
    });

    test("should log rollback failure", (done) => {
        const step = new MockProcessorFailingStep("rollback-step", 0, { autoRollback: true });
        jest.spyOn(step as unknown as { _rollback: () => Promise<void> }, "_rollback")
            .mockImplementationOnce(() => Promise.reject(new Error("unexpected error")));

        const job = new MockCustomStepsJob("test-job", [step], { logger });

        job.once("finished", () => {
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining("rollback failed")
            );
            done();
        });

        job.run();
    });

    test("should log retry messages", (done) => {
        const step = new MockProcessorFailingStep("retry-step", 0, { autoRollback: true, maxRetries: 1 });
        jest.spyOn(step as unknown as { _rollback: () => Promise<void> }, "_rollback")
            .mockImplementation(() => Promise.resolve());
        
        const job = new MockCustomStepsJob("test-job", [step], { logger });

        job.once("finished", () => {
            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining("STEP::retry-step retry created with attempt 1 of 1")
            );
            expect(logger.debug).toHaveBeenCalledWith(
                expect.stringContaining("STEP::retry-step retry started with attempt 1 of 1")
            );
            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining("STEP::retry-step retry exhausted with attempt 2 of 1")
            );
            done();
        });

        job.run();
    });
});
