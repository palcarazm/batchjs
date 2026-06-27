import { RunnableStatus } from "./RunnableStatus";

/**
 * @interface
 * Base events that all Runnables emit.
 */
export interface BaseRunnableEventMap {
  /** Emitted when transitioning to RUNNING */
  started: { name: string };
  /** Emitted when transitioning to COMPLETED */
  completed: { name: string };
  /** Emitted when transitioning to FAILED */
  failed: { name: string; error: Error };
  /** Emitted when transitioning to CANCELLED */
  cancelled: { name: string };
  /** Emitted when transitioning to any terminal state (COMPLETED, FAILED, CANCELLED) */
  finished: { name: string; status: RunnableStatus };
  /** Emitted when a transition is cancelled by a hook */
  "transition-cancelled": { from: RunnableStatus; to: RunnableStatus; reason?: string };
  /** Emitted when an invalid transition is attempted */
  "transition-invalid": { from: RunnableStatus; to: RunnableStatus };
}

/**
 * Helper type to prevent conflicts with base event keys.
 * If a custom event key matches a base event key, it will be replaced with an error message.
 * 
 * @template TEventMap - Custom event map to merge with base events.
 */
export type NoBaseRunnableEventMap<TEventMap> =
  keyof TEventMap & keyof BaseRunnableEventMap extends never
    ? TEventMap
    : {
        [K in keyof TEventMap]: K extends keyof BaseRunnableEventMap
          ? `❌ Event key "${K & string}" conflicts with base event. Use a different name.`
          : TEventMap[K];
      };

/**
 * Extends the base event map with custom events.
 * Prevents key conflicts with base events.
 * 
 * @template TEventMap - Custom event map to merge with base events.
 * 
 * @example
 * ```typescript
 * type MyEvents = ExtendableRunnableEventMap<{
 *   "data-loaded": { records: number };
 * }>;
 * // Results in: BaseRunnableEventMap & { "data-loaded": { records: number } }
 * 
 * type InvalidEvents = ExtendableRunnableEventMap<{ started: {} }>;
 * // Results in: { started: "❌ Event key \"started\" conflicts with base event. Use a different name." }
 * ```
 */
export type ExtendableRunnableEventMap<TEventMap> =
  NoBaseRunnableEventMap<TEventMap> & Omit<BaseRunnableEventMap, keyof TEventMap>;