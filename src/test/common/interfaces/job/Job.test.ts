/// <reference types="jest" />
import { JobCancelledError, RollbackStatus, RunnableStatus, Step } from "../../../../main/common";
import { MockPassingStep, MockProcessorFailingStep } from "../../mocks/_index";
import { MockProcessorFailingStepJob,MockPassingJob, MockParallelAllPassingJob, MockParallelWithFailureJob, MockSequentialFailingBeforeParallelJob, MockCustomStepsJob } from "../../mocks/jobs/_index";

describe("Job", () => {
    describe("run()", () => { 
        test("should run all steps successfully", (done) => {
            new MockPassingJob()
                .once("finished", ({ status }) => {
                    expect(status).toBe(RunnableStatus.COMPLETED);
                    done();
                }).run();
        });
        
        test("should reject if a step fails", (done) => {
            new MockProcessorFailingStepJob()
                .once("failed", ({ error }) => {
                    expect(error).toBeDefined();
                    expect(error?.message).toBe("Processor error");
                })
                .once("finished", ({ status }) => {
                    expect(status).toBe(RunnableStatus.FAILED);
                    done();
                }).run();
        });

        test("should run parallel steps successfully", (done) => {
            const job = new MockParallelAllPassingJob()
                .once("finished", ({status}) => {
                    expect(status).toBe(RunnableStatus.COMPLETED);
                    
                    const metrics = job.metrics;
                    expect(metrics.status).toBe(RunnableStatus.COMPLETED);
                    // sequential1, parallel1, parallel2, sequential2
                    expect(metrics.steps).toHaveLength(4);
                    
                    const stepNames = metrics.steps.map(s => s.name);
                    expect(stepNames).toContain("sequential1");
                    expect(stepNames).toContain("parallel1");
                    expect(stepNames).toContain("parallel2");
                    expect(stepNames).toContain("sequential2");

                    done();
                });
            job.run();
        });

        test("should skip empty parallel groups", (done) => {
            const job = new MockCustomStepsJob("parallel", [[]])
                .once("finished", ({status}) => {
                    expect(status).toBe(RunnableStatus.COMPLETED);
                    const metrics = job.metrics;
                    expect(metrics.status).toBe(RunnableStatus.COMPLETED);
                    expect(metrics.steps).toHaveLength(0);
                    done();
                });
            job.run();
        });

        test("should cancel parallel steps on failure", (done) => {
            const job = new MockParallelWithFailureJob()
                .once("finished", ({status}) => {
                    expect(status).toBe(RunnableStatus.FAILED);
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

                    done();
                });
            job.run();
        });

        test("should not run subsequent steps after parallel failure", (done) => {
            const job = new MockParallelWithFailureJob()
                .once("finished", ({status}) => {
                    expect(status).toBe(RunnableStatus.FAILED);

                    const metrics = job.metrics;
                    expect(metrics.status).toBe(RunnableStatus.FAILED);

                    const stepNames = metrics.steps.map(s => s.name);

                    // Only sequential1 and the parallel group steps should exist
                    expect(stepNames).toContain("sequential1");
                    expect(stepNames).toContain("parallel1");
                    expect(stepNames).toContain("parallel2_failing");
                    expect(stepNames).toContain("parallel3");

                    // sequential2 should NOT be in metrics
                    expect(stepNames).not.toContain("sequential2");

                    done();
                });
            job.run();
        });

        test("should run mixed sequential and parallel steps in correct order", (done) => {
            const job = new MockParallelAllPassingJob()
                .once("finished", ({status}) => {
                    expect(status).toBe(RunnableStatus.COMPLETED);

                    const metrics = job.metrics;
                    expect(metrics.status).toBe(RunnableStatus.COMPLETED);

                    const stepNames = metrics.steps.map(s => s.name);
                    expect(stepNames).toEqual(["sequential1", "parallel1", "parallel2", "sequential2"]);

                    done();
                });
            
            job.run();
        });

        test("should halt job when sequential step fails before parallel group", (done) => {
            const job = new MockSequentialFailingBeforeParallelJob()
                .once("finished", ({status}) => {
                    expect(status).toBe(RunnableStatus.FAILED);

                    const metrics = job.metrics;
                    expect(metrics.status).toBe(RunnableStatus.FAILED);
                    
                    expect(metrics.steps).toHaveLength(1);
                    expect(metrics.steps[0].name).toBe("sequential1_failing");
                    expect(metrics.steps[0].status).toBe(RunnableStatus.FAILED);

                    done();
                });
            job.run();
        });
    });

    describe("cancel()", () => {
        test("should handle cancelling a job with a step running", (done) => {
            const step1 = new MockPassingStep("step1", 10);
            const step2 = new MockPassingStep("step1", 25);
            const job = new MockCustomStepsJob("parallel",[step1, step2])
                .once("finished", ({ status }) => {
                    expect(status).toBe(RunnableStatus.CANCELLED);
                    const metrics = job.metrics;
                    expect(metrics.status).toBe(RunnableStatus.CANCELLED);
                    expect(metrics.steps).toHaveLength(1);
                    expect(metrics.steps[0].status).toBe(RunnableStatus.CANCELLED);
                    done();
                });

            job.run().then(()=>job.cancel());
        });
        
        test("should handle cancelling a job with a parallel group running", (done) => {
            const step1 = new MockPassingStep("step1", 10);
            const step2 = new MockPassingStep("step2", 25);
            const job = new MockCustomStepsJob("parallel",[[step1, step2]])
                .once("finished", ({ status }) => {
                    expect(status).toBe(RunnableStatus.CANCELLED);
                    const metrics = job.metrics;
                    expect(metrics.status).toBe(RunnableStatus.CANCELLED);
                    expect(metrics.steps).toHaveLength(2);
                    expect(metrics.steps).toEqual(expect.arrayContaining([
                        {"name":"step1","status":RunnableStatus.CANCELLED,"duration":{ms: expect.any(Number)}},
                        {"name":"step2","status":RunnableStatus.CANCELLED,"duration":{ms: expect.any(Number)}}]));
                    done();
                });

            job.run().then(()=>job.cancel());
        });

        test("should do nothing when cancel() called on non-running job", async () => {
            const job = new MockPassingJob();

            await job.cancel();

            expect(job.status).toBe(RunnableStatus.CREATED);
            expect(job.isRunning).toBe(false);
        });

        
        test("should cancel multiple times without side effects", (done) => {
            const job = new MockPassingJob()
                .on("finished", ({ status }) => {
                    expect(status).toBe(RunnableStatus.CANCELLED);
                    done();
                });
            
            job.run()
                .then(()=>job.cancel())
                .then(()=>job.cancel()); // No side effects on second call
        });
    });

    describe("step events", () => {
        test("should emit step STARTED events", (done) => {
            let stepStartedCount = 0;

            const job = new MockPassingJob()
                .on("stepStarted",({ step }: { step: Step }) => {
                    expect(step).toBeInstanceOf(Step);
                    stepStartedCount++;
                })
                .once("finished", () => {
                    expect(stepStartedCount).toBe(2);
                    done();
                });
            job.run();
        });

        test("should emit step COMPLETED and step FINISHED events", (done) => {
            let stepCompletedCount = 0;
            let stepFinishedCount = 0;

            const job = new MockPassingJob()
                .on("stepCompleted", ({ step }: { step: Step }) => {
                    expect(step).toBeInstanceOf(Step);
                    stepCompletedCount++;
                })
                .on("stepFinished", ({ step, status }) => {
                    expect(step).toBeInstanceOf(Step);
                    expect(status).toBe(RunnableStatus.COMPLETED);
                    stepFinishedCount++;
                })
                .once("finished", () => {
                    expect(stepCompletedCount).toBe(2);
                    expect(stepFinishedCount).toBe(2);
                    done();
                });
            job.run();
        });

        test("should emit step FAILED and step FINISHED event if step fails", (done) => {
            let stepFailedCount = 0;
            let stepFinishedCount = 0;

            const job = new MockSequentialFailingBeforeParallelJob()
                .on("stepFailed", ({ step }: { step: Step }) => {
                    expect(step).toBeInstanceOf(Step);
                    stepFailedCount++;
                })
                .on("stepFinished", ({ step, status }) => {
                    expect(step).toBeInstanceOf(Step);
                    expect(status).toBe(RunnableStatus.FAILED);
                    stepFinishedCount++;
                })
                .once("finished", () => {
                    expect(stepFailedCount).toBe(1);
                    expect(stepFinishedCount).toBe(1);
                    done();
                });
            job.run();
        });

        test("should emit step CANCELLED and step FINISHED event if step fails", (done) => {
            let stepCancelledCount = 0;
            let stepFinishedCount = 0;

            const job = new MockParallelWithFailureJob()
                .on("stepCancelled", ({ step }: { step: Step }) => {
                    expect(step).toBeInstanceOf(Step);
                    stepCancelledCount++;
                })
                .on("stepFinished", ({ step, status }) => {
                    expect(step).toBeInstanceOf(Step);
                    expect(status).toBeDefined();
                    stepFinishedCount++;
                })
                .once("finished", () => {
                    expect(stepCancelledCount).toBe(2);
                    expect(stepFinishedCount).toBe(4);
                    done();
                });
            job.run();
        });

        describe("rollback events", () => {
            test("should emit stepRollbackSucceed when step rollback succeeds", (done) => {
                let stepRollbackSucceedCount = 0;

                const step = new MockProcessorFailingStep("rollback-step", 0, { autoRollback: true });
                jest.spyOn(step as unknown as { _rollback: () => Promise<void> }, "_rollback")
                    .mockImplementationOnce(() => Promise.resolve());

                const job = new MockCustomStepsJob("test-job", [step])
                    .on("stepRollbackSucceed", ({ step }) => {
                        expect(step.name).toBe("rollback-step");
                        stepRollbackSucceedCount++;
                    })
                    .once("finished", () => {
                        expect(stepRollbackSucceedCount).toBe(1);
                        done();
                    });

                job.run();
            });

            test("should emit stepRollbackFailed when step rollback fails", (done) => {
                let stepRollbackFailedCount = 0;

                const step = new MockProcessorFailingStep("rollback-step", 0, { autoRollback: true });
                jest.spyOn(step as unknown as { _rollback: () => Promise<void> }, "_rollback")
                    .mockImplementationOnce(() => Promise.reject(new Error("Rollback failed")));

                const job = new MockCustomStepsJob("test-job", [step])
                    .on("stepRollbackFailed", ({ step, error }) => {
                        expect(step.name).toBe("rollback-step");
                        expect(error.message).toBe("Rollback failed");
                        stepRollbackFailedCount++;
                    })
                    .once("finished", () => {
                        expect(stepRollbackFailedCount).toBe(1);
                        done();
                    });

                job.run();
            });

            test("should emit stepRollbackSucceed when step rollback succeeds in parallel group", (done) => {
                let stepRollbackSucceedCount = 0;

                const step1 = new MockProcessorFailingStep("rollback-step", 0, { autoRollback: true });
                jest.spyOn(step1 as unknown as { _rollback: () => Promise<void> }, "_rollback")
                    .mockImplementationOnce(() => Promise.resolve());

                const step2 = new MockProcessorFailingStep("rollback-step", 0, { autoRollback: true });
                jest.spyOn(step2 as unknown as { _rollback: () => Promise<void> }, "_rollback")
                    .mockImplementationOnce(() => Promise.resolve());

                const job = new MockCustomStepsJob("test-job", [[step1, step2]])
                    .on("stepRollbackSucceed", ({ step }) => {
                        expect(step.name).toBe("rollback-step");
                        stepRollbackSucceedCount++;
                    })
                    .once("finished", () => {
                        expect(stepRollbackSucceedCount).toBe(2);
                        done();
                    });

                job.run();
            });

            test("should emit stepRollbackFailed when step rollback fails in parallel group", (done) => {
                let stepRollbackFailedCount = 0;

                const step1 = new MockProcessorFailingStep("rollback-step", 0, { autoRollback: true });
                jest.spyOn(step1 as unknown as { _rollback: () => Promise<void> }, "_rollback")
                    .mockImplementationOnce(() => Promise.reject(new Error("Rollback failed")));

                const step2 = new MockProcessorFailingStep("rollback-step", 0, { autoRollback: true });
                jest.spyOn(step2 as unknown as { _rollback: () => Promise<void> }, "_rollback")
                    .mockImplementationOnce(() => Promise.reject(new Error("Rollback failed")));

                const job = new MockCustomStepsJob("test-job", [[step1, step2]])
                    .on("stepRollbackFailed", ({ step, error }) => {
                        expect(step.name).toBe("rollback-step");
                        expect(error.message).toBe("Rollback failed");
                        stepRollbackFailedCount++;
                    })
                    .once("finished", () => {
                        expect(stepRollbackFailedCount).toBe(2);
                        done();
                    });

                job.run();
            });

            test("should include rollback status in stepFailed event", (done) => {
                const step = new MockProcessorFailingStep("rollback-step", 0, { autoRollback: true });
                jest.spyOn(step as unknown as { _rollback: () => Promise<void> }, "_rollback")
                    .mockImplementationOnce(() => Promise.resolve());

                const job = new MockCustomStepsJob("test-job", [step])
                    .on("stepFailed", ({ step, rollback }) => {
                        expect(step.name).toBe("rollback-step");
                        expect(rollback).toBe(RollbackStatus.SUCCEED);
                    })
                    .once("finished", ({ status }) => {
                        expect(status).toBe(RunnableStatus.FAILED);
                        done();
                    });

                job.run();
            });

            test("should include rollback status in stepCancelled event", (done) => {
                const step = new MockPassingStep("rollback-step", 0, { autoRollback: true });
                jest.spyOn(step as unknown as { _rollback: () => Promise<void> }, "_rollback")
                    .mockImplementationOnce(() => Promise.resolve());

                const job = new MockCustomStepsJob("test-job", [step])
                    .on("stepCancelled", ({ step, rollback }) => {
                        expect(step.name).toBe("rollback-step");
                        expect(rollback).toBe(RollbackStatus.SUCCEED);
                    })
                    .once("finished", ({ status }) => {
                        expect(status).toBe(RunnableStatus.CANCELLED);
                        done();
                    });

                job.run().then(() => job.cancel());
            });

            test("should include rollback status in stepFinished event", (done) => {
                const step = new MockPassingStep("rollback-step", 0, { autoRollback: true });
                jest.spyOn(step as unknown as { _rollback: () => Promise<void> }, "_rollback")
                    .mockImplementationOnce(() => Promise.reject(new Error("Rollback failed")));

                const job = new MockCustomStepsJob("test-job", [step])
                    .on("stepFinished", ({ step, status, rollback }) => {
                        expect(step.name).toBe("rollback-step");
                        expect(status).toBe(RunnableStatus.FAILED);
                        expect(rollback).toBe(RollbackStatus.FAILED);
                    })
                    .once("finished", () => {
                        done();
                    });

                job.run();
            });
        });
    });

    describe("execution task", () => {
        test("should resolve to a fulfilled promise on success", async () => {
            const runnable = new MockPassingJob();
            await runnable.run();
            await expect(runnable.executionTask).resolves.toEqual(expect.objectContaining({status: "fulfilled"}));
        });

        test("should resolve to a rejected promise on fail", async () => {
            const runnable = new MockParallelWithFailureJob();
            await runnable.run();
            await expect(runnable.executionTask).resolves.toEqual(expect.objectContaining({status: "rejected", reason: expect.any(Error)}));
        });

        test("should resolve to a rejected promise on cancel", async () => {
            const runnable = new MockPassingJob();
            await runnable.run().then(()=>runnable.cancel());
            await expect(runnable.executionTask).resolves.toEqual(expect.objectContaining({status: "rejected", reason: expect.any(JobCancelledError)}));
        });
    });
});
