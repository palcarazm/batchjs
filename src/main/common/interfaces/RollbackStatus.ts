/**
 * @enum
 * Status of a rollback attempt.
 */
export enum RollbackStatus {
  /** No rollback was attempted */
  UNATTEMPTED = "UNATTEMPTED",
  /** Rollback completed successfully */
  SUCCEED = "SUCCEED",
  /** Rollback failed with an error */
  FAILED = "FAILED",
}