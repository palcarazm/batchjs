/// <reference types="jest" />
import { RunnableStatus, Step, StepCancelledError } from "../../../../main/common";
import { MockPassingStep, MockProcessorFailingStep, MockReaderFailingStep, MockWriterFailingStep } from "../../mocks/_index";

type StepInstances = {_readerInstance: {destroyed: boolean}, _writerInstance: {destroyed: boolean}, _processorsInstances: Array<{destroyed: boolean}>};

function getStepInstances(step: Step): StepInstances {
    return step as unknown as StepInstances;
}

describe("Step", () => {
    describe("run()", () => {
        test("should run the step successfully", async () => {
            const step = new MockPassingStep();
            await expect(step.run()).resolves.toBeUndefined();
        });
        
        test("should reject if the reader stream errors", async () => {
            const step = new MockReaderFailingStep();
            await expect(step.run()).rejects.toThrow("Reader error");
        });
        
        test("should reject if a processor stream errors", async () => {
            const step = new MockProcessorFailingStep();
            await expect(step.run()).rejects.toThrow("Processor error");
        });
        
        test("should reject if the writer stream errors", async () => {
            const step = new MockWriterFailingStep();
            await expect(step.run()).rejects.toThrow("Writer error");
        });
    });

    describe("cancel()", () => {
        test("should cancel a running step", async () => {
            const step = new MockPassingStep();

            const runPromise = step.run();
            step.cancel();

            await expect(runPromise).rejects.toThrow(StepCancelledError);
            expect(step.status).toBe(RunnableStatus.CANCELLED);
            expect(step.isRunning).toBe(false);
        });

        test("should do nothing when cancel() called on non-running step", () => {
            const step = new MockPassingStep();

            step.cancel();

            expect(step.status).toBe(RunnableStatus.CREATED);
            expect(step.isRunning).toBe(false);
        });

        
        test("should cancel multiple times without side effects", async () => {
            const step = new MockPassingStep();
            const runPromise = step.run();
            
            step.cancel();
            step.cancel(); // Second call should do nothing
            
            await expect(runPromise).rejects.toThrow(StepCancelledError);
            expect(step.status).toBe(RunnableStatus.CANCELLED);
        });
    });

    describe("destroy()", () => {
        test("should destroy streams when destroy() is called in a Completed step", async() => {
            const step = new MockPassingStep();
            const stepInstances = getStepInstances(step);
            
            await expect(step.run()).resolves.toBeUndefined();

            expect(stepInstances._readerInstance?.destroyed).toBe(true);
            expect(stepInstances._writerInstance?.destroyed).toBe(true);
            for (const processor of stepInstances._processorsInstances) {
                expect(processor.destroyed).toBe(true);
            }
        });

        test("should destroy streams when destroy() is called in a Failed step", async () => {
            const step = new MockReaderFailingStep();
            const stepInstances = getStepInstances(step);

            await expect(step.run()).rejects.toThrow("Reader error");

            expect(stepInstances._readerInstance?.destroyed).toBe(true);
            expect(stepInstances._writerInstance?.destroyed).toBe(true);
            for (const processor of stepInstances._processorsInstances) {
                expect(processor.destroyed).toBe(true);
            }
        });

        test("should destroy streams when cancel() is called", async() => {
            const step = new MockPassingStep();
            const stepInstances = getStepInstances(step);
          
            
            const runPromise = step.run();
            
            step.cancel();
            
            await expect(runPromise).rejects.toThrow(StepCancelledError);
            expect(stepInstances._readerInstance?.destroyed).toBe(true);
            expect(stepInstances._writerInstance?.destroyed).toBe(true);
            for (const processor of stepInstances._processorsInstances) {
                expect(processor.destroyed).toBe(true);
            }
        });
    });
});
