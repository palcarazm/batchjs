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
}