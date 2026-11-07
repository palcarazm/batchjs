import { promises as fs } from "node:fs";
import { join } from "node:path";
import { CheckpointStore, JobCheckpoint } from "./CheckpointStore";
import { RunnableStatus } from "../../runnable/_index";

type CheckpointData = {
    jobName: string;
    params: Record<string, unknown>;
    stepStatus: Record<string, RunnableStatus>;
    metadata?: Record<string, unknown>;
    updatedAt: string;
};

/**
 * @class
 * File-based implementation of CheckpointStore.
 * Stores checkpoints as JSON files in a directory.
 * 
 * @example
 * ```typescript
 * const store = new FileCheckpointStore('./.checkpoints');
 * const checkpoint = await store.load('myJob', 'abc123');
 * ```
 * @since 2.0.0
 */
export class FileCheckpointStore implements CheckpointStore {
    private readonly dir: string;

    /**
     * Creates a new FileCheckpointStore.
     * @param dir - Directory to store checkpoint files.
     * @default './.checkpoints'
     */
    constructor(dir: string = "./.batchjs/checkpoints") {
        this.dir = dir;
    }

    /**
     * Ensures the checkpoint directory exists.
     * If not exists, creates it.
     * @private
     */
    private async ensureDir(): Promise<void> {
        try {
            await fs.mkdir(this.dir, { recursive: true });
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
                throw error;
            }
        }
    }

    /**
     * Gets the file path for a given job identifier.
     * @private
     * @param jobId - The job identifier.
     * @returns The file path.
     */
    private getFilePath(jobId:string): string {
        const sanitizedJobId = jobId.replaceAll(/[^a-zA-Z0-9_-]/g, "_");
        return join(this.dir, `${sanitizedJobId}.json`);
    }

    /**
     * Load a checkpoint from disk for a given the job identifier.
     * @param jobId - The job identifier.
     * @returns The checkpoint state, or null if not found.
     */
    async load(jobId:string): Promise<JobCheckpoint | null> {
        const filePath = this.getFilePath(jobId);

        try {
            const data = await fs.readFile(filePath, "utf-8");
            const parsed = JSON.parse(data) as CheckpointData;
            return {
                ...parsed,
                updatedAt: new Date(parsed.updatedAt),
            };

        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                return null;
            }
            throw error;
        }
    }

    /**
     * Save a checkpoint to disk for a given the job identifier.
     * @param jobId - The job identifier.
     * @param checkpoint - The checkpoint state to save.
     */
    async save(jobId:string, checkpoint: JobCheckpoint): Promise<void> {
        await this.ensureDir();
        const filePath = this.getFilePath(jobId);
        const data = JSON.stringify(checkpoint, null, 2);
        await fs.writeFile(filePath, data, "utf-8");
    }

    /**
     * Delete a checkpoint from disk for a given the job identifier.
     * @param jobId - The job identifier.
     */
    async delete(jobId:string): Promise<void> {
        const filePath = this.getFilePath(jobId);

        try {
            await fs.unlink(filePath);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
                throw error;
            }
        }
    }
}