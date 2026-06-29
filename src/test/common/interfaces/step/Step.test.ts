/// <reference types="jest" />
import { RollbackStatus, RunnableStatus, Step, StepCancelledError } from "../../../../main/common";
import { MockPassingStep, MockProcessorFailingStep, MockReaderFailingStep, MockWriterFailingStep } from "../../mocks/_index";

type StepInstances = {_readerInstance: {destroyed: boolean}, _writerInstance: {destroyed: boolean}, _processorsInstances: Array<{destroyed: boolean}>};

function getStepInstances(step: Step): StepInstances {
    return step as unknown as StepInstances;
}

describe("Step", () => {
    describe("run()", () => {
        test("should run the step successfully", (done) => {
            new MockPassingStep()
                .once("finished", ({ status }) => {
                    expect(status).toBe(RunnableStatus.COMPLETED);
                    done();
                })
                .run();
        });
        
        test("should reject if the reader stream errors", (done) => {
            new MockReaderFailingStep()
                .once("failed", ({ error }) => {
                    expect(error).toBeDefined();
                    expect(error?.message).toBe("Reader error");
                })
                .once("finished", ({ status }) => {
                    expect(status).toBe(RunnableStatus.FAILED);
                    done();
                })
                .run();
        });
        
        test("should reject if a processor stream errors", (done) => {
            new MockProcessorFailingStep()
                .once("failed", ({ error }) => {
                    expect(error).toBeDefined();
                    expect(error?.message).toBe("Processor error");
                })
                .once("finished", ({ status }) => {
                    expect(status).toBe(RunnableStatus.FAILED);
                    done();
                })
                .run();
        });
        
        test("should reject if the writer stream errors", (done) => {
            new MockWriterFailingStep()
                .once("failed", ({ error }) => {
                    expect(error).toBeDefined();
                    expect(error?.message).toBe("Writer error");
                })
                .once("finished", ({ status }) => {
                    expect(status).toBe(RunnableStatus.FAILED);
                    done();
                })
                .run();
        });
    });

    describe("cancel()", () => {
        test("should cancel a running step", (done) => {
            const step = new MockPassingStep()
                .once("finished", ({ status }) => {
                    expect(status).toBe(RunnableStatus.CANCELLED);
                    done();
                });

            step.run().then(()=>step.cancel());
        });

        test("should do nothing when cancel() called on non-running step", async () => {
            const step = new MockPassingStep();

            await step.cancel();

            expect(step.status).toBe(RunnableStatus.CREATED);
            expect(step.isRunning).toBe(false);
        });

        
        test("should cancel multiple times without side effects", (done) => {
            const step = new MockPassingStep()
                .on("finished", ({ status }) => {
                    expect(status).toBe(RunnableStatus.CANCELLED);
                    done();
                });
            
            step.run()
                .then(()=>step.cancel())
                .then(()=>step.cancel()); // No side effects on second call
        });
    });

    describe("destroy()", () => {
        test("should destroy streams when destroy() is called in a Completed step", (done) => {
            const step = new MockPassingStep()
                .once("finished", ({ status }) => {
                    expect(status).toBe(RunnableStatus.COMPLETED);
                    const stepInstances = getStepInstances(step);

                    expect(stepInstances._readerInstance?.destroyed).toBe(true);
                    expect(stepInstances._writerInstance?.destroyed).toBe(true);
                    for (const processor of stepInstances._processorsInstances) {
                        expect(processor.destroyed).toBe(true);
                    }

                    done();
                });

            step.run();            
        });

        test("should destroy streams when destroy() is called in a Failed step", (done) => {
            const step = new MockReaderFailingStep()
                .once("finished", ({ status }) => {
                    expect(status).toBe(RunnableStatus.FAILED);
                    const stepInstances = getStepInstances(step);

                    expect(stepInstances._readerInstance?.destroyed).toBe(true);
                    expect(stepInstances._writerInstance?.destroyed).toBe(true);
                    for (const processor of stepInstances._processorsInstances) {
                        expect(processor.destroyed).toBe(true);
                    }

                    done();
                });
                
            step.run();    
        });

        test("should destroy streams when cancel() is called", (done) => {
            const step = new MockPassingStep()
                .once("finished", ({ status }) => {
                    expect(status).toBe(RunnableStatus.CANCELLED);
                    const stepInstances = getStepInstances(step);

                    expect(stepInstances._readerInstance?.destroyed).toBe(true);
                    expect(stepInstances._writerInstance?.destroyed).toBe(true);
                    for (const processor of stepInstances._processorsInstances) {
                        expect(processor.destroyed).toBe(true);
                    }

                    done();
                });
                
            step.run().then(()=>step.cancel());    
        });
    });

    describe("_rollback()", () => {
        test("should not call _rollback() when autoRollback is false and step fails", (done) => {
            const step = new MockProcessorFailingStep("test-step", 0, { autoRollback: false });

            const rollbackSpy = jest.spyOn(step as unknown as { _rollback(): Promise<void> }, "_rollback")
                .mockImplementationOnce(() => {
                    fail("Should not have called _rollback()");
                });

            step
                .once("failed", () => {
                    expect(step.rollbackStatus).toBe(RollbackStatus.UNATTEMPTED);
                    expect(rollbackSpy).toHaveBeenCalledTimes(0);
                    done();
                })
                .run();
        });

        test("should call _rollback() when autoRollback is true and step fails", (done) => {
            const step = new MockProcessorFailingStep("test-step", 0, { autoRollback: true });
            const rollbackSpy = jest.spyOn(step as unknown as { _rollback(): Promise<void> }, "_rollback")
                .mockImplementationOnce(() => Promise.resolve());

            step
                .once("failed", () => {
                    expect(step.rollbackStatus).toBe(RollbackStatus.SUCCEED);
                    expect(rollbackSpy).toHaveBeenCalledTimes(1);
                    done();
                })
                .run();
        });

        test("should not call _rollback() when autoRollback is false and step is cancelled", (done) => {
            const step = new MockPassingStep("test-step", 0, { autoRollback: false });

            const rollbackSpy = jest.spyOn(step as unknown as { _rollback(): Promise<void> }, "_rollback")
                .mockImplementationOnce(() => {
                    fail("Should not have called _rollback()");
                });

            step.once("cancelled", () => {
                expect(step.rollbackStatus).toBe(RollbackStatus.UNATTEMPTED);
                expect(rollbackSpy).toHaveBeenCalledTimes(0);
                done();
            });

            step.run().then(() => step.cancel());
        });

        test("should call _rollback() when autoRollback is true and step is cancelled", (done) => {
            const step = new MockPassingStep("test-step", 0, { autoRollback: true });
            const rollbackSpy = jest.spyOn(step as unknown as { _rollback(): Promise<void> }, "_rollback")
                .mockImplementationOnce(() => Promise.resolve());

            step.once("cancelled", () => {
                expect(step.rollbackStatus).toBe(RollbackStatus.SUCCEED);
                expect(rollbackSpy).toHaveBeenCalledTimes(1);
                done();
            });

            step.run().then(() => step.cancel());
        });

        test("should emit rollback-succeed event when rollback succeeds", (done) => {
            const step = new MockProcessorFailingStep("test-step", 0, { autoRollback: true });
            jest.spyOn(step as unknown as { _rollback(): Promise<void> }, "_rollback")
                .mockImplementationOnce(() => Promise.resolve());

            let rollbackSucceedEmitted = false;

            step
                .once("rollback-succeed", () => {
                    rollbackSucceedEmitted = true;
                })
                .once("failed", () => {
                    expect(rollbackSucceedEmitted).toBe(true);
                    expect(step.rollbackStatus).toBe(RollbackStatus.SUCCEED);
                    done();
                })
                .run();
        });

        test("should emit rollback-failed event when rollback throws", (done) => {
            const step = new MockProcessorFailingStep("test-step", 0, { autoRollback: true });

            jest.spyOn(step as unknown as { _rollback(): Promise<void> }, "_rollback")
                .mockImplementationOnce(() => {
                    throw new Error("Rollback failed");
                });

            let rollbackFailedEmitted = false;

            step
                .once("rollback-failed", () => {
                    rollbackFailedEmitted = true;
                })
                .once("failed", () => {
                    expect(rollbackFailedEmitted).toBe(true);
                    expect(step.rollbackStatus).toBe(RollbackStatus.FAILED);
                    done();
                })
                .run();
        });
    });

    describe("execution task", () => {
        test("should resolve to a fulfilled promise on success", async () => {
            const runnable = new MockPassingStep();
            await runnable.run();
            await expect(runnable.executionTask).resolves.toEqual(expect.objectContaining({status: "fulfilled"}));
        });

        test("should resolve to a rejected promise on fail", async () => {
            const runnable = new MockReaderFailingStep();
            await runnable.run();
            await expect(runnable.executionTask).resolves.toEqual(expect.objectContaining({status: "rejected", reason: expect.any(Error)}));
        });

        test("should resolve to a rejected promise on cancel", async () => {
            const runnable = new MockPassingStep();
            await runnable.run().then(()=>runnable.cancel());
            await expect(runnable.executionTask).resolves.toEqual(expect.objectContaining({status: "rejected", reason: expect.any(StepCancelledError)}));
        });
    });
});
