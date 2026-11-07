import { ExtendableRunnableEventMap } from "../runnable/_index";

/**
 * StepEventMap defines the events that a Step can emit.
 */
export type StepEventMap = ExtendableRunnableEventMap<{
    /** Emitted when rollback succeeds */
    "rollback-succeed": void;
    /** Emitted when rollback fails */
    "rollback-failed": { error: Error };
    /** Emitted when a retry is scheduled (before delay) */
    "retry-created": { attempt: number; maxRetries: number; delayMs: number, cause: Error };
    /** Emitted when a retry actually starts (after delay, before run) */
    "retry-started": { attempt: number; maxRetries: number };
    /** Emitted when all retry attempts are exhausted */
    "retry-exhausted": { attempt: number; maxRetries: number; cause: Error };
}>;