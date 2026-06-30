import { RollbackStatus } from "../RollbackStatus";
import { RunnableStatus, ExtendableRunnableEventMap } from "../runnable/_index";
import { Step } from "../step/Step";

/**
 * JobEventMap defines the events that a Job can emit.
 * Extends base runnable events with step-specific events.
 */
export type JobEventMap = ExtendableRunnableEventMap<{
  /** Emitted when a step starts */
  "step-started": { step: Step };
  /** Emitted when a step completes successfully */
  "step-completed": { step: Step };
  /** Emitted when a step is cancelled */
  "step-cancelled": { step: Step; rollback: RollbackStatus };
  /** Emitted when a step fails */
  "step-failed": { step: Step; error: Error; rollback: RollbackStatus };
  /** Emitted when a step finishes (any terminal state) */
  "step-finished": { step: Step; status: RunnableStatus; rollback: RollbackStatus };
  /** Emitted when a step's rollback succeeds */
  "step-rollback-succeed": {step: Step;};
  /** Emitted when a step's rollback fails */
  "step-rollback-failed": { step: Step; error: Error };
}>;