import { ExtendableRunnableEventMap } from "../runnable/_index";

/**
 * StepEventMap defines the events that a Step can emit.
 */
export type StepEventMap = ExtendableRunnableEventMap<{
    /** Emitted when rollback succeeds */
    "rollback-succeed": void;
    /** Emitted when rollback fails */
    "rollback-failed": { error: Error };
}>;