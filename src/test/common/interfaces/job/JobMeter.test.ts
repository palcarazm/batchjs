import { JobMeter, RunnableStatus } from "../../../../main/common/index";

describe("JobMeter", () => {
    let jobMeter: JobMeter;

    beforeEach(() => {
        jobMeter = new JobMeter("TestJob", RunnableStatus.CREATED);
    });

    test("constructor should initialize metrics correctly", () => {
        const metrics = jobMeter.metrics;
        expect(metrics.name).toBe("TestJob");
        expect(metrics.status).toBe(RunnableStatus.CREATED);
        expect(metrics.steps).toEqual([]);
        expect(metrics.duration).toBeUndefined();
    });

    test("start should update job status", () => {
        jobMeter.start(RunnableStatus.RUNNING);
        expect(jobMeter.metrics.status).toBe(RunnableStatus.RUNNING);
    });

    test("finish should update job status and duration", () => {
        jobMeter.finish(RunnableStatus.COMPLETED, 150.5);
        expect(jobMeter.metrics.status).toBe(RunnableStatus.COMPLETED);
        expect(jobMeter.metrics.duration).toEqual({ ms: 150.5 });
    });

    test("StepStart should add a step with correct name and status", () => {
        jobMeter.StepStart("Step1", RunnableStatus.RUNNING);
        const steps = jobMeter.metrics.steps;
        expect(steps.length).toBe(1);
        expect(steps[0]).toEqual({ name: "Step1", status: RunnableStatus.RUNNING });
    });

    test("StepFinish should update the correct step's status and duration", () => {
        jobMeter.StepStart("Step1", RunnableStatus.RUNNING);
        jobMeter.StepFinish("Step1", RunnableStatus.COMPLETED, 75.25);

        const step = jobMeter.metrics.steps.find(s => s.name === "Step1");
        expect(step).toBeDefined();
        expect(step?.status).toBe(RunnableStatus.COMPLETED);
        expect(step?.duration).toEqual({ ms: 75.25 });
    });

    test("StepFinish should do nothing if step does not exist", () => {
        jobMeter.StepFinish("NonExistentStep", RunnableStatus.COMPLETED, 50);
        expect(jobMeter.metrics.steps.find(s => s.name === "NonExistentStep")).toBeUndefined();
    });
});
