/// <reference types="jest" />
/// <reference types="node" />
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { RunnableStatus, FileCheckpointStore } from "../../../../../main/common/index";
import { MockPassingStep, MockProcessorFailingStep, MockCustomStepsJob } from "../../../mocks/_index";



describe("Job Checkpoint Integration", () => {
    const testDir = join(tmpdir(), "batchjs-integration-test");
    let store: FileCheckpointStore;

    beforeEach(async () => {
        store = new FileCheckpointStore(testDir);
        await fs.rm(testDir, { recursive: true, force: true });
    });

    afterEach(async () => {
        await fs.rm(testDir, { recursive: true, force: true });
    });

    describe("resume after completion", () => {
        it("should skip completed steps when job is rerun with checkpoint", (done) => {
            const step1 = new MockPassingStep("step1", 10);
            const step2 = new MockPassingStep("step2", 10);

            const checkPoint = {
                jobName: "testJob",
                params: {},
                stepStatus: {
                    [step1.id]: RunnableStatus.COMPLETED,
                    [step2.id]: RunnableStatus.COMPLETED
                },
                updatedAt: new Date(),
            };

            const job1 = new MockCustomStepsJob("testJob", [step1, step2], { checkpointStore: store })
                .once("finished", ({ status }) => {
                    expect(status).toBe(RunnableStatus.COMPLETED);
                    expect(step1.isCreated).toBe(true); // step1 should be skipped
                    expect(step2.isCreated).toBe(true); // step2 should be skipped
                    done();
                });

            store.save(job1.id, checkPoint).then(() => job1.run());
        });

        it("should resume from first uncompleted step", (done) => {
            const step1 = new MockPassingStep("step1", 10);
            const step2 = new MockPassingStep("step2", 10);

            const checkPoint = {
                jobName: "testJob",
                params: {},
                stepStatus: {
                    [step1.id]: RunnableStatus.COMPLETED,
                    [step2.id]: RunnableStatus.CANCELLED
                },
                updatedAt: new Date(),
            };

            const job1 = new MockCustomStepsJob("testJob", [step1, step2], { checkpointStore: store })
                .once("finished", ({ status }) => {
                    expect(status).toBe(RunnableStatus.COMPLETED);
                    expect(step1.isCreated).toBe(true); // step1 should be skipped
                    expect(step2.isCompleted).toBe(true); // step2 should be executed
                    done();
                });

            store.save(job1.id, checkPoint).then(() => job1.run());
        });
    });

    describe("parallel steps", () => {
        it("should resume from first uncompleted step of the group", (done) => {
            const step1 = new MockPassingStep("step1", 10);
            const step2 = new MockPassingStep("step2", 10);

            const checkPoint = {
                jobName: "testJob",
                params: {},
                stepStatus: {
                    [step1.id]: RunnableStatus.COMPLETED,
                    [step2.id]: RunnableStatus.CANCELLED
                },
                updatedAt: new Date(),
            };

            const job1 = new MockCustomStepsJob("testJob", [[step1, step2]], { checkpointStore: store })
                .once("finished", ({ status }) => {
                    expect(status).toBe(RunnableStatus.COMPLETED);
                    expect(step1.isCreated).toBe(true); // step1 should be skipped
                    expect(step2.isCompleted).toBe(true); // step2 should be executed
                    done();
                });

            store.save(job1.id, checkPoint).then(() => job1.run());
        });
    });

    describe("checkpoint persistence", () => {
        it("should save checkpoint after each step completion", (done) => {
            const step1 = new MockPassingStep("step1", 10);
            const step2 = new MockPassingStep("step2", 10);
            const job = new MockCustomStepsJob("testJob", [step1, step2], { checkpointStore: store })
                .once("finished", ({ status }) => {
                    setTimeout(async () => {
                        const checkpoint = await store.load(job.id);
                        expect(checkpoint?.stepStatus[step1.id]).toBe(RunnableStatus.COMPLETED);
                        expect(checkpoint?.stepStatus[step2.id]).toBe(RunnableStatus.COMPLETED);
                        expect(status).toBe(RunnableStatus.COMPLETED);
                        done();
                    }, 250);
                });

            job.run();
        });

        it("should save checkpoint when step fails", (done) => {
            const step = new MockProcessorFailingStep("failingStep");
            const job = new MockCustomStepsJob("testJob", [step], { checkpointStore: store })
                .once("finished", ({ status }) => {
                    setTimeout(async () => {
                        const checkpoint = await store.load(job.id);
                        expect(checkpoint?.stepStatus[step.id]).toBe(RunnableStatus.FAILED);
                        expect(status).toBe(RunnableStatus.FAILED);
                        done();
                    }, 250);
                });

            job.run();
        });
    });

    describe("job run transition cancellation", () => {
        it("should cancel run transition if checkpoint manager fails", (done) => {
            jest.spyOn(store, "load").mockRejectedValueOnce(new Error("filesystem error"));
            const step1 = new MockPassingStep("step1", 10);
            const step2 = new MockPassingStep("step1", 25);
            const job = new MockCustomStepsJob("parallel",[step1, step2], { checkpointStore: store })
                .once("transition-cancelled", ({ from, to, reason }) => {
                    expect(from).toBe(RunnableStatus.CREATED);
                    expect(to).toBe(RunnableStatus.RUNNING);
                    expect(reason).toBe("Failed to load checkpoints: filesystem error");
                    done();
                });

            job.run();
        });
    });
});