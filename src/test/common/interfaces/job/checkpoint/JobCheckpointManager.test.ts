/// <reference types="jest" />
import { Job, JobCheckpointManager, CheckpointStore, JobCheckpoint,RunnableStatus, Step } from "../../../../../main/common/index";
import { MockPassingStep, MockPassingJob } from "../../../mocks/_index";

describe("JobCheckpointManager", () => {
    let mockStore: jest.Mocked<CheckpointStore>;
    let job: Job;
    let manager: JobCheckpointManager;
    let step:Step;

    beforeEach(() => {
        mockStore = {
            load: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
        };
        step = new MockPassingStep();
        job = new MockPassingJob();
        manager = new JobCheckpointManager(job, mockStore);
    });

    describe("load", () => {
        it("should load checkpoint from store", async () => {
            const checkpoint: JobCheckpoint = {
                jobName: "testJob",
                params: {},
                stepStatus: { "step-1-id": RunnableStatus.COMPLETED },
                updatedAt: new Date(),
            };
            mockStore.load.mockResolvedValue(checkpoint);

            expect((manager as unknown as { loadStatus: string }).loadStatus).toBe("NONE");
            await manager.load();

            expect(mockStore.load).toHaveBeenCalledWith(job.id);
            expect((manager as unknown as { loadStatus: string }).loadStatus).toBe("LOADED");
        });

        it("should handle null checkpoint from store", async () => {
            mockStore.load.mockResolvedValue(null);

            expect((manager as unknown as { loadStatus: string }).loadStatus).toBe("NONE");
            await manager.load();

            expect(mockStore.load).toHaveBeenCalledWith(job.id);
            expect((manager as unknown as { loadStatus: string }).loadStatus).toBe("LOADED");
        });

        it("should propagate store errors", async () => {
            const error = new Error("Store connection failed");
            mockStore.load.mockRejectedValue(error);

            expect((manager as unknown as { loadStatus: string }).loadStatus).toBe("NONE");
            await expect(manager.load()).rejects.toThrow("Store connection failed");
            expect((manager as unknown as { loadStatus: string }).loadStatus).toBe("LOADED");
        });
    });

    describe("shouldRun", () => {
        it("should throw if checkpoint is not loaded", async () => {
            expect(() => manager.shouldRun(step)).toThrow("Checkpoint not loaded. Call load() first.");
        });

        it("should throw if checkpoint is loading", async () => {
            (manager as unknown as { loadStatus: string }).loadStatus = "LOADING";
            expect(() => manager.shouldRun(step)).toThrow("Checkpoint is still loading. Wait for load() to complete.");
        });

        it("should return true for steps not in checkpoint", async () => {
            const checkpoint: JobCheckpoint = {
                jobName: "testJob",
                params: {},
                stepStatus: {},
                updatedAt: new Date(),
            };
            mockStore.load.mockResolvedValue(checkpoint);
            await manager.load();

            expect(manager.shouldRun(step)).toBe(true);
        });

        it("should return false for COMPLETED steps", async () => {
            const checkpoint: JobCheckpoint = {
                jobName: "testJob",
                params: {},
                stepStatus: {[step.id]: RunnableStatus.COMPLETED},
                updatedAt: new Date(),
            };
            mockStore.load.mockResolvedValue(checkpoint);
            await manager.load();

            expect(manager.shouldRun(step)).toBe(false);
        });

        it.each([
            RunnableStatus.CREATED,
            RunnableStatus.RUNNING,
            RunnableStatus.FAILED,
            RunnableStatus.CANCELLED
        ])("should return true for %s steps", async (status) => {
            const checkpoint: JobCheckpoint = {
                jobName: "testJob",
                params: {},
                stepStatus: {[step.id]: status},
                updatedAt: new Date(),
            };
            mockStore.load.mockResolvedValue(checkpoint);
            await manager.load();

            expect(manager.shouldRun(step)).toBe(true);
        });
    });

    describe("saveStepCheckpoint", () => {
        it("should throw if checkpoint is not loaded", async () => {
            await expect(manager.saveStepCheckpoint(step)).rejects.toThrow("Checkpoint not loaded. Call load() first.");
        });

        it("should throw if checkpoint is loading", async () => {
            (manager as unknown as { loadStatus: string }).loadStatus = "LOADING";
            await expect(manager.saveStepCheckpoint(step)).rejects.toThrow("Checkpoint is still loading. Wait for load() to complete.");
        });

        it("should save step status to checkpoint", async () => {
            const checkpoint: JobCheckpoint = {
                jobName: "testJob",
                params: {},
                stepStatus: {},
                updatedAt: new Date(),
            };
            mockStore.load.mockResolvedValue(checkpoint);
            await manager.load();

            await manager.saveStepCheckpoint(step);

            expect(mockStore.save).toHaveBeenCalledWith(job.id, expect.objectContaining({
                stepStatus: expect.objectContaining({
                    [step.id]: RunnableStatus.CREATED,
                }),
            }));
        });

        it("should update updatedAt timestamp", async () => {
            const checkpoint: JobCheckpoint = {
                jobName: "testJob",
                params: {},
                stepStatus: {},
                updatedAt: new Date(2024, 0, 1),
            };
            mockStore.load.mockResolvedValue(checkpoint);
            await manager.load();

            const preSave = Date.now();
            mockStore.save.mockImplementationOnce((_jobId: string, checkpoint: JobCheckpoint) => {
                const postSave = Date.now();
                expect(checkpoint.updatedAt.getTime()).toBeGreaterThanOrEqual(preSave);
                expect(checkpoint.updatedAt.getTime()).toBeLessThanOrEqual(postSave);
                return Promise.resolve();
            });

            await manager.saveStepCheckpoint(step);

            expect(mockStore.save).toHaveBeenCalledTimes(1);
            expect(mockStore.save).toHaveBeenCalledWith(job.id, expect.objectContaining({
                jobName: "testJob",
                params: {},
                stepStatus: expect.objectContaining({
                    [step.id]: RunnableStatus.CREATED,
                }),
                updatedAt: expect.any(Date),
            }));
        });
    });

    describe("saveStepsCheckpoints", () => {
        it("should throw if checkpoint is not loaded", async () => {
            await expect(manager.saveStepsCheckpoints([step])).rejects.toThrow("Checkpoint not loaded. Call load() first.");
        });

        it("should throw if checkpoint is loading", async () => {
            (manager as unknown as { loadStatus: string }).loadStatus = "LOADING";
            await expect(manager.saveStepsCheckpoints([step])).rejects.toThrow("Checkpoint is still loading. Wait for load() to complete.");
        });

        it("should save step status to checkpoint", async () => {
            const checkpoint: JobCheckpoint = {
                jobName: "testJob",
                params: {},
                stepStatus: {},
                updatedAt: new Date(),
            };
            mockStore.load.mockResolvedValue(checkpoint);
            await manager.load();

            await manager.saveStepsCheckpoints([step]);

            expect(mockStore.save).toHaveBeenCalledWith(job.id, expect.objectContaining({
                stepStatus: expect.objectContaining({
                    [step.id]: RunnableStatus.CREATED,
                }),
            }));
        });

        it("should update updatedAt timestamp", async () => {
            const checkpoint: JobCheckpoint = {
                jobName: "testJob",
                params: {},
                stepStatus: {},
                updatedAt: new Date(2024, 0, 1),
            };
            mockStore.load.mockResolvedValue(checkpoint);
            await manager.load();

            const preSave = Date.now();

            mockStore.save.mockImplementationOnce((_jobId: string, checkpoint: JobCheckpoint) => {
                const postSave = Date.now();
                expect(checkpoint.updatedAt.getTime()).toBeGreaterThanOrEqual(preSave);
                expect(checkpoint.updatedAt.getTime()).toBeLessThanOrEqual(postSave);
                return Promise.resolve();
            });

            await manager.saveStepsCheckpoints([step]);

            expect(mockStore.save).toHaveBeenCalledTimes(1);
            expect(mockStore.save).toHaveBeenCalledWith(job.id, expect.objectContaining({
                jobName: "testJob",
                params: {},
                stepStatus: expect.objectContaining({
                    [step.id]: RunnableStatus.CREATED,
                }),
                updatedAt: expect.any(Date),
            }));
        });
    });

    describe("isAllStepsCompleted", () => {
        it("should throw if checkpoint is not loaded", () => {
            expect(() => manager.isAllStepsCompleted()).toThrow("Checkpoint not loaded. Call load() first.");
        });

        it("should throw if checkpoint is loading", async () => {
            (manager as unknown as { loadStatus: string }).loadStatus = "LOADING";
            expect(() => manager.isAllStepsCompleted()).toThrow("Checkpoint is still loading. Wait for load() to complete.");
        });

        it("should return false if not all steps are completed", async () => {
            const checkpoint: JobCheckpoint = {
                jobName: "testJob",
                params: {},
                stepStatus: {},
                updatedAt: new Date(),
            };
            const steps = job.plan.flat();
            checkpoint.stepStatus[steps.at(0)!.id] = RunnableStatus.COMPLETED;
            checkpoint.stepStatus[steps.at(1)!.id] = RunnableStatus.CREATED;
            mockStore.load.mockResolvedValue(checkpoint);
            await manager.load();

            expect(manager.isAllStepsCompleted()).toBe(false);
        });

        it("should return true if all steps are completed", async () => {
            const checkpoint: JobCheckpoint = {
                jobName: "testJob",
                params: {},
                stepStatus: {},
                updatedAt: new Date(),
            };
            const steps = job.plan.flat();
            for (const step of steps) {
                checkpoint.stepStatus[step.id] = RunnableStatus.COMPLETED;
            }
            mockStore.load.mockResolvedValue(checkpoint);
            await manager.load();

            expect(manager.isAllStepsCompleted()).toBe(true);
        });
    });
});