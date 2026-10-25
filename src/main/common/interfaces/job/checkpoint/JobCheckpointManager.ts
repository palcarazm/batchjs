import { Step } from "../../step/Step";
import { RunnableStatus } from "../../runnable/RunnableStatus";
import { CheckpointStore, JobCheckpoint } from "./CheckpointStore";
import { Job } from "../Job";

/**
 * @class
 * Manages checkpoint operations for a job.
 * Handles loading checkpoints, computing step identifiers, determining which steps to run,
 * and saving checkpoint updates.
 * 
 * @since 2.0.0
 */
export class JobCheckpointManager {
    private readonly job: Job;
    private readonly store: CheckpointStore;
    private _checkpoint: JobCheckpoint | null = null;
    private loadStatus: "NONE" | "LOADING" | "LOADED" = "NONE";

    /**
     * Creates a new JobCheckpointManager.
     * @param job - The job to manage checkpoints for.
     * @param store - The checkpoint store to use.
     */
    constructor(job:Job, store: CheckpointStore) {
        this.job = job;
        this.store = store;
    }

    /**
     * Gets the current checkpoint object.
     * @returns The checkpoint, or null if none loaded.
     * @throws {Error} If the checkpoint is not loaded.
     */
    protected get checkpoint(): JobCheckpoint {
        if (this.loadStatus === "NONE") {
            throw new Error("Checkpoint not loaded. Call load() first.");
        }
        if (this.loadStatus === "LOADING") {
            throw new Error("Checkpoint is still loading. Wait for load() to complete.");
        }

        this._checkpoint ??= {
            jobName: this.job.name,
            params: structuredClone(this.job.params),
            stepStatus: {},
            updatedAt: new Date(),
        };
        return this._checkpoint;
    }

    /**
     * Loads the checkpoint from the store.
     * Should be called once when the job starts.
     */
    async load(): Promise<void> {
        this.loadStatus = "LOADING";
        this._checkpoint = await this.store.load(this.job.id)
            .finally(() => this.loadStatus = "LOADED");
    }

    /**
     * Determines if a step should be run based on the checkpoint.
     * @param step - The step to check.
     * @returns True if the step should run, false if it's already completed.
     * @throws {Error} If the checkpoint is not loaded.
     */
    shouldRun(step: Step): boolean {
        if (this.checkpoint.stepStatus[step.id] === RunnableStatus.COMPLETED) {
            return false;
        }

        return true;
    }

    /**
     * Saves a checkpoint for a step.
     * @param step - The step to updated.
     * @throws {Error} If the checkpoint is not loaded.
     */
    async saveStepCheckpoint(step: Step): Promise<void> {
        this.checkpoint.stepStatus[step.id] = step.status;
        this.checkpoint.updatedAt = new Date();

        await this.store.save(this.job.id, this.checkpoint);
    }

    /**
     * Saves a checkpoint for a step group.
     * @param steps - The steps to updated.
     * @throws {Error} If the checkpoint is not loaded.
     */
    async saveStepsCheckpoints(steps: Step[]): Promise<void> {
        for (const step of steps) {
            this.checkpoint.stepStatus[step.id] = step.status;
        }
        this.checkpoint.updatedAt = new Date();

        await this.store.save(this.job.id, this.checkpoint);
    }

    /**
     * Checks if all steps are completed.
     * @returns True if all steps are completed.
     * @throws {Error} If the checkpoint is not loaded.
     */
    isAllStepsCompleted(): boolean {
        for (const step of this.job.plan.flat()) {
            if (this.checkpoint.stepStatus[step.id] !== RunnableStatus.COMPLETED) {
                return false;
            }
        }

        return true;
    }
}