/// <reference types="jest" />
/// <reference types="node" />
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FileCheckpointStore, RunnableStatus } from "../../../../../main/common/index";

describe("FileCheckpointStore", () => {
    const testDir = join(tmpdir(), "batchjs-test-checkpoints");
    let store: FileCheckpointStore;

    beforeEach(async () => {
        store = new FileCheckpointStore(testDir);
        await fs.rm(testDir, { recursive: true, force: true });
    });

    afterEach(async () => {
        await fs.rm(testDir, { recursive: true, force: true });
    });

    describe("load", () => {
        it("should return null when checkpoint does not exist", async () => {
            const result = await store.load("non-existent-id");
            expect(result).toBeNull();
        });

        it("should load a saved checkpoint", async () => {
            const checkpoint = {
                jobName: "testJob",
                params: { userId: 123 },
                stepStatus: { "step-1": RunnableStatus.COMPLETED },
                updatedAt: new Date(),
            };
            const jobId = "job-123";

            await store.save(jobId, checkpoint);
            const result = await store.load(jobId);

            expect(result).toEqual(checkpoint);
        });

        it("should load a saved checkpoint with metadata", async () => {
            const checkpoint = {
                jobName: "testJob",
                params: { userId: 123 },
                stepStatus: { "step-1": RunnableStatus.COMPLETED },
                metadata: { foo: "bar" },
                updatedAt: new Date(),
            };
            const jobId = "job-123";

            await store.save(jobId, checkpoint);
            const result = await store.load(jobId);

            expect(result).toEqual(checkpoint);
        });

        it("should handle special characters in job ID", async () => {
            const jobId = "job/with:special?chars*";
            const checkpoint = {
                jobName: "testJob",
                params: {},
                stepStatus: {},
                updatedAt: new Date(),
            };

            await store.save(jobId, checkpoint);
            const result = await store.load(jobId);

            expect(result).toEqual(checkpoint);
        });
    });

    describe("save", () => {
        it("should create directory if it does not exist", async () => {
            const jobId = "test-job";
            const checkpoint = {
                jobName: "testJob",
                params: {},
                stepStatus: {},
                updatedAt: new Date(),
            };

            await store.save(jobId, checkpoint);

            const dirExists = await fs
                .access(testDir)
                .then(() => true)
                .catch(() => false);
            expect(dirExists).toBe(true);
        });

        it("should overwrite existing checkpoint", async () => {
            const jobId = "test-job";
            const checkpoint1 = {
                jobName: "testJob",
                params: {},
                stepStatus: { "step-1": RunnableStatus.COMPLETED },
                updatedAt: new Date(),
            };
            const checkpoint2 = {
                jobName: "testJob",
                params: {},
                stepStatus: { "step-1": RunnableStatus.COMPLETED, "step-2": RunnableStatus.COMPLETED },
                updatedAt: new Date(),
            };

            await store.save(jobId, checkpoint1);
            await store.save(jobId, checkpoint2);

            const result = await store.load(jobId);
            expect(result?.stepStatus).toEqual(checkpoint2.stepStatus);
        });
    });

    describe("delete", () => {
        it("should delete a checkpoint", async () => {
            const jobId = "test-job";
            const checkpoint = {
                jobName: "testJob",
                params: {},
                stepStatus: {},
                updatedAt: new Date(),
            };

            await store.save(jobId, checkpoint);
            await store.delete(jobId);

            const result = await store.load(jobId);
            expect(result).toBeNull();
        });

        it("should not throw if checkpoint does not exist", async () => {
            await expect(store.delete("non-existent-id")).resolves.not.toThrow();
        });
    });
});