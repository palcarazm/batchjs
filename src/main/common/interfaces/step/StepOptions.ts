/**
 * @interface
 * Options for the Step constructor.
 */
export interface StepOptions {
  /**
   * Whether to automatically call `_rollback()` when the step fails or is cancelled.
   * @default false
   */
  autoRollback: boolean;

  /**
   * Maximum number of retry attempts after a failure.
   * Set to 0 to disable retries (default).
   * @default 0
   */
  maxRetries: number;

  /**
   * Function that returns the delay in milliseconds before a retry attempt.
   * The function receives the retry attempt number (1-based for first retry).
   * @default () => 100
   */
  retryDelay: (attempt: number) => number;
}