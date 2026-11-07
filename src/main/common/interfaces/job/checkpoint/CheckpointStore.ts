import { RunnableStatus } from "../..//runnable/RunnableStatus";

/**
 * Represents the checkpoint state of a job.
 * @interface
 * @since 2.0.0
 */
export interface JobCheckpoint {
  /** The name of the job */
  jobName: string;
  /** Job parameters */
  params: Record<string, unknown>;
  /** Status of each step (keyed by step identifier) */
  stepStatus: Record<string, RunnableStatus>;
  /** Optional metadata for future extensions (e.g., offsets, cursors) */
  metadata?: Record<string, unknown>;
  /** Timestamp when the checkpoint was last updated */
  updatedAt: Date;
}

/**
 * @interface
 * Interface for checkpoint storage backends.
 * Implementations can persist to files, databases, Redis, etc.
 * @since 2.0.0
 */
export interface CheckpointStore {
  /**
   * Load a checkpoint for a given the job identifier.
   * @param jobId - The job identifier.
   * @returns The checkpoint state, or null if none exists.
   */
  load(jobId: string): Promise<JobCheckpoint | null>;

  /**
   * Save or update a checkpoint state for a given the job identifier.
   * @param jobId - The job identifier.
   * @param checkpoint - The checkpoint state to save.
   */
  save(jobId: string, checkpoint: JobCheckpoint): Promise<void>;

  /**
   * Delete a checkpoint for a given the job identifier.
   * @param jobId - The job identifier.
   */
  delete?(jobId: string): Promise<void>;
}