/**
 * @enum
 * Enum for the status of a Runnable.
 */
export enum RunnableStatus {
  /**
   *  Runnable has been created but not started
   */  
  CREATED = "CREATED",

  /**
   *  Runnable is running
   */
  RUNNING = "RUNNING",

  /**
   *  Runnable has completed
   */
  COMPLETED = "COMPLETED",

  /**
   *  Runnable has been cancelled
   */
  CANCELLED = "CANCELLED",

  /**
   *  Runnable has failed
   */
  FAILED = "FAILED",
}