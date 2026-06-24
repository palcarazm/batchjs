import {
    Logger,
    RunnableStatus,
} from "../../../../main/common/index";
import {
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
        passingJob.once("end", () => {
            const metrics = passingJob.metrics;
            expect(metrics.name).toBe("MockPassingJob");
            expect(metrics.status).toBe(RunnableStatus.COMPLETED);
            expect(metrics.duration?.ms).toBeGreaterThan(0);
            expect(metrics.steps.length).toBe(2);
            expect(metrics.steps[0].name).toBe("step1");
            expect(metrics.steps[1].name).toBe("step2");
            expect(logger.info).toHaveBeenCalled();
            done();
        });
        passingJob.run();
    });

    test("should capture step metrics correctly", (done) => {
        passingJob.once("end", () => {
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
        failingJob.once("error", () => {
            const metrics = failingJob.metrics;
            expect(metrics.status).toBe(RunnableStatus.FAILED);
            expect(metrics.steps[0].status).toBe(
                RunnableStatus.FAILED
            );
            expect(logger.error).toHaveBeenCalled();
            done();
        });
        expect(failingJob.run()).rejects.toThrow("Processor error");
    });
});
