/**
 * @enum
 * Enum for the status of a Runnable.
 */
export enum RunnableStatus {
    CREATED = "CREATED",        // Runnable has been created but not started
    RUNNING = "RUNNING",        // Runnable is running
    COMPLETED = "COMPLETED",    // Runnable has completed
    FAILED = "FAILED",          // Runnable has failed
  }