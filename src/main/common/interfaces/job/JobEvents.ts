import { RunnableStatus, ExtendableRunnableEventMap } from "../runnable/_index";
import { Step } from "../step/Step";

/**
 * JobEventMap defines the events that a Job can emit.
 * Extends base runnable events with step-specific events.
 */
export type JobEventMap = ExtendableRunnableEventMap<{
  /** Emitted when a step starts */
  stepStarted: { step: Step };
  /** Emitted when a step completes successfully */
  stepCompleted: { step: Step };
  /** Emitted when a step is cancelled */
  stepCancelled: { step: Step };
  /** Emitted when a step fails */
  stepFailed: { step: Step; error: Error };
  /** Emitted when a step finishes (any terminal state) */
  stepFinished: { step: Step; status: RunnableStatus };
}>;