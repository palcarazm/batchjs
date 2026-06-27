import { EventEmitter } from "node:events";
import { RunnableStatus } from "./RunnableStatus";
import { BaseRunnableEventMap } from "./RunnableEvents";

/**
 * Valid state transitions for Runnable.
 * CREATED -> RUNNING -> COMPLETED|FAILED|CANCELLED (terminal)
 */
const VALID_TRANSITIONS: Record<RunnableStatus, RunnableStatus[]> = {
    [RunnableStatus.CREATED]: [RunnableStatus.RUNNING],
    [RunnableStatus.RUNNING]: [RunnableStatus.COMPLETED, RunnableStatus.FAILED, RunnableStatus.CANCELLED],
    [RunnableStatus.COMPLETED]: [],
    [RunnableStatus.FAILED]: [],
    [RunnableStatus.CANCELLED]: []
};

/**
 * @abstract
 * @class
 * Abstract base class for all runnable entities (Job, Step, etc.).
 * Provides state machine, lifecycle hooks, and typed events.
 * 
 * @template TEventMap - The event map for this runnable. Extends BaseRunnableEventMap.
 * @since 2.0.0
 * @example
 * ```typescript
 * class MyRunnable extends Runnable<MyEventMap> {
 *   protected async doRun(): Promise<{ cancelled: boolean; reason?: string }> {
 *     // Perform work here
 *     return { cancelled: false };
 *   }
 *   
 *   protected async doComplete(): Promise<{ cancelled: boolean; reason?: string }> {
 *     // Cleanup on success
 *     return { cancelled: false };
 *   }
 *   
 *   protected async doFail(error: Error): Promise<{ cancelled: boolean; reason?: string }> {
 *     // Cleanup on failure
 *     return { cancelled: false };
 *   }
 *   
 *   protected async doCancel(): Promise<{ cancelled: boolean; reason?: string }> {
 *     // Cleanup on cancellation
 *     return { cancelled: false };
 *   }
 * }
 * 
 * const runnable = new MyRunnable();
 * runnable.on("started", () => console.log("Started"));
 * runnable.on("completed", () => console.log("Completed"));
 * runnable.run(); // Returns immediately, work runs in background
 * ```
 */
export abstract class Runnable<
  TEventMap extends BaseRunnableEventMap = BaseRunnableEventMap
> extends EventEmitter {
    private _status: RunnableStatus = RunnableStatus.CREATED;
    private _transitioningTo?: RunnableStatus;
    private _executionTask?: Promise<PromiseSettledResult<void>>;
    public readonly name: string;
    public readonly params: object;

    /**
     * @param {string} name - The name to assign to this runnable.
     * @param {object} params - The parameters to pass to this runnable.
     */
    constructor(name: string, params: object = {}) {
        super();
        this.name = name;
        this.params = params;
    }

    /**
     * The current status of the runnable.
     * @readonly
     * @type {RunnableStatus}
     */
    get status(): RunnableStatus {
        return this._status;
    }

    /**
     * The state the runnable is transitioning to, or undefined if not transitioning.
     * @readonly
     * @type {RunnableStatus | undefined}
     */
    get transitioningTo(): RunnableStatus | undefined {
        return this._transitioningTo;
    }

    /**
     * Whether the runnable is currently running.
     * @readonly
     * @type {boolean}
     */
    get isRunning(): boolean {
        return this._status === RunnableStatus.RUNNING;
    }

    /**
     * Whether the runnable is in the CREATED state.
     * @readonly
     * @type {boolean
     */
    get isCreated(): boolean {
        return this._status === RunnableStatus.CREATED;
    }

    /**
     * Whether the runnable is in the COMPLETED state.
     * @readonly
     * @type {boolean
     */
    get isCompleted(): boolean {
        return this._status === RunnableStatus.COMPLETED;
    }

    /**
     * Whether the runnable is in the FAILED state.
     * @readonly
     * @type {boolean
     */
    get isFailed(): boolean {
        return this._status === RunnableStatus.FAILED;
    }

    /**
     * Whether the runnable is in the CANCELLED state.
     * @readonly
     * @type {boolean
     */
    get isCancelled(): boolean {
        return this._status === RunnableStatus.CANCELLED;
    }

    /**
     * Sets the execution task promise as a settled promise.
     * @param executionTask Promise to be settled as execution task.
     * @returns {void}
     */
    private setExecutionTask(executionTask: Promise<void> | undefined) {
        if (executionTask === undefined) return;
        this._executionTask = Promise.allSettled([executionTask]).then((results) => results[0]);
    }

    /**
     * The execution task promise.
     * @readonly
     * @type {Promise<PromiseSettledResult<void>> | undefined}
     */
    get executionTask(): Promise<PromiseSettledResult<void>> | undefined {
        return this._executionTask;
    }

    /**
     * Checks if a transition from current state to a given state is valid.
     * @param {RunnableStatus} to - The target state.
     * @returns {boolean} Whether the transition is valid.
     */
    protected canTransition(to: RunnableStatus): boolean {
        return VALID_TRANSITIONS[this._status]?.includes(to) ?? false;
    }

    /**
     * Transitions to the given state using the provided hook.
     * @param {RunnableStatus} next - The target state.
     * @param {Error} error - Error to pass to the events if the transition fails.
     * @returns {Promise<void>}
     * @throws {Error} If the transition is invalid.
     */
    protected async transitionTo(
        next: RunnableStatus,
        error?: Error
    ): Promise<void> {
        if (!this.canTransition(next)) {
            this.emit("transition-invalid", {
                from: this._status,
                to: next
            });
            return;
        }

        this._transitioningTo = next;

        switch (next) {
        case RunnableStatus.RUNNING:{
            const result =  await this.executeTransition(RunnableStatus.RUNNING, () => this.doRun(), "started", {name: this.name});
            this.setExecutionTask(result.executionPromise);
            break;
        }
        case RunnableStatus.COMPLETED:
            await this.executeTransition(RunnableStatus.COMPLETED, () => this.doComplete(), "completed", {name: this.name});
            this.emit("finished", { name: this.name, status: this._status });
            break;
        case RunnableStatus.FAILED:{ 
            const e = error ?? new Error("Unknown error");
            await this.executeTransition(RunnableStatus.FAILED, () => this.doFail(e), "failed", {name: this.name, error: e });
            this.emit("finished", { name: this.name, status: this._status });
            break; 
        }
        case RunnableStatus.CANCELLED:
            await this.executeTransition(RunnableStatus.CANCELLED, () => this.doCancel(), "cancelled", {name: this.name});
            this.emit("finished", { name: this.name, status: this._status });
            break;
        }

        this._transitioningTo = undefined;
    }

    /**
     * Executes a transition, running the associated hook and emitting the corresponding event if the transition succeeds.
     *
     * @internal Internal helper: it is **not** a generic event emitter wrapper.
     * @template K The event name to emit after a successful transition.
     * @param to The target status to move into.
     * @param hook The transition hook to execute before committing the transition.
     *   If the hook returns `{ cancelled: true }`, the transition is aborted
     *   and a `"transition-cancelled"` event is emitted instead.
     * @param eventName The event to emit when the transition completes successfully.
     * @returns A promise that resolves once the transition have completed.
     */
    private async executeTransition<K extends keyof TEventMap & string>(
        to: RunnableStatus,
        hook: () => Promise<{ cancelled: boolean; reason?: string; executionPromise?: Promise<void> }>,
        eventName: K,
        eventArgs: TEventMap[K]
    ): Promise<{ cancelled: boolean; reason?: string, executionPromise?: Promise<void> }> {
        const hookResult = await hook();
        if (hookResult.cancelled) {
            this.emit("transition-cancelled", {
                from: this._status,
                to: to,
                reason: hookResult.reason
            });
            return hookResult;
        }
        this._status = to;
        this.emit(eventName, eventArgs);
        return hookResult;
    }

  /**
   * Abstract hook called during transition to RUNNING.
   * Must return { cancelled: boolean; reason?: string; executionPromise: Promise<void> }.
   * If cancelled: true, transition is aborted.
   * @returns {Promise<{ cancelled: boolean; reason?: string; executionPromise: Promise<void> }>}
   */
  protected abstract doRun(): Promise<{ cancelled: true; reason?: string} | { cancelled: false; reason?: string, executionPromise: Promise<void> }>;

  /**
   * Abstract hook called during transition to COMPLETED.
   * Must return { cancelled: boolean; reason?: string }.
   * If cancelled: true, transition is aborted.
   * @returns {Promise<{ cancelled: boolean; reason?: string }>}
   */
  protected abstract doComplete(): Promise<{ cancelled: boolean; reason?: string }>;

  /**
   * Abstract hook called during transition to FAILED.
   * Must return { cancelled: boolean; reason?: string }.
   * If cancelled: true, transition is aborted.
   * @param {Error} error - The error that caused the failure.
   * @returns {Promise<{ cancelled: boolean; reason?: string }>}
   */
  protected abstract doFail(error: Error): Promise<{ cancelled: boolean; reason?: string }>;

  /**
   * Abstract hook called during transition to CANCELLED.
   * Must return { cancelled: boolean; reason?: string }.
   * If cancelled: true, transition is aborted.
   * @returns {Promise<{ cancelled: boolean; reason?: string }>}
   */
  protected abstract doCancel(): Promise<{ cancelled: boolean; reason?: string }>;

  /**
   * Launches the runnable and returns a promise that resolves when it finishes.
   * @returns {Promise<void>}
   */
  public run(): Promise<void> {
      return this.transitionTo(RunnableStatus.RUNNING);
  }

  /**
   * Cancels the runnable if it is currently running.
   * @returns {Promise<void>}
   */
  public cancel(): Promise<void> {
      return this.transitionTo(RunnableStatus.CANCELLED);
  }

  /**
   * Completes the runnable if it is currently running.
   * @returns {Promise<void>}
   */
  public complete(): Promise<void> {
      return this.transitionTo(RunnableStatus.COMPLETED);
  }

  /**
   * Fails the runnable if it is currently running.
   * @param {Error} error - The error that caused the failure.
   * @returns {Promise<void>}
   */
  public fail(error: Error): Promise<void> {
      return this.transitionTo(RunnableStatus.FAILED, error);
  }

  /**
   * Emits an event of the specified type to the listeners.
   * @template U Type of the event.
   * @param {U} event Event type
   * @param {...Array<TEventMap[U]>} args Additional arguments
   * @returns {boolean}
   */
  emit<U extends keyof TEventMap & string>(
      event: U,
      ...args: Array<TEventMap[U]>
  ): boolean {
      return super.emit(event, ...args);
  }

  /**
   * Adds an event listener to the specified event type.
   * @template U Type of the event.
   * @param {U} event Event type
   * @param {(...args:Array<TEventMap[U]>) => void} listener Event listener
   * @returns {this} allowing to chain
   */
  addListener<U extends keyof TEventMap & string>(
      event: U,
      listener: (...args:Array<TEventMap[U]>) => void
  ): this {
      return super.addListener(event, listener);
  }

  /**
   * Adds an event listener to the specified event type.
   * @template U Type of the event.
   * @param {U} event Event type
   * @param {(...args:Array<TEventMap[U]>) => void} listener Event listener
   * @returns {this} allowing to chain
   */
  on<U extends keyof TEventMap & string>(
      event: U,
      listener: (...args:Array<TEventMap[U]>) => void
  ): this {
      return super.on(event, listener);
  }

  /**
   * Adds a one-time event listener to the specified event type.
   * @template U Type of the event.
   * @param {U} event Event type
   * @param {(...args:Array<TEventMap[U]>) => void} listener Event listener
   * @returns {this} allowing to chain
   */
  once<U extends keyof TEventMap & string>(
      event: U,
      listener:  (...args:Array<TEventMap[U]>) => void
  ): this {
      return super.once(event, listener);
  }

  /**
   * Adds an event listener to the beginning of the listeners array.
   * @template U Type of the event.
   * @param {U} event Event type
   * @param { (...args:Array<TEventMap[U]>) => void} listener Event listener
   * @returns {this} allowing to chain
   */
  prependListener<U extends keyof TEventMap & string>(
      event: U,
      listener:  (...args:Array<TEventMap[U]>) => void
  ): this {
      return super.prependListener(event, listener);
  }

  /**
   * Adds a one-time event listener to the beginning of the listeners array.
   * @template U Type of the event.
   * @param {U} event Event type
   * @param { (...args:Array<TEventMap[U]>) => void} listener Event listener
   * @returns {this} allowing to chain
   */
  prependOnceListener<U extends keyof TEventMap & string>(
      event: U,
      listener:  (...args:Array<TEventMap[U]>) => void
  ): this {
      return super.prependOnceListener(event, listener);
  }

  /**
   * Removes an event listener from the specified event type.
   * @template U Type of the event.
   * @param {U} event Event type
   * @param { (...args:Array<TEventMap[U]>) => void} listener Event listener
   * @returns {this} allowing to chain
   */
  removeListener<U extends keyof TEventMap & string>(
      event: U,
      listener:  (...args:Array<TEventMap[U]>) => void
  ): this {
      return super.removeListener(event, listener);
  }

  /**
   * Alias for removeListener.
   * @template U Type of the event.
   * @param {U} event Event type
   * @param { (...args:Array<TEventMap[U]>) => void} listener Event listener
   * @returns {this} allowing to chain
   */
  off<U extends keyof TEventMap & string>(
      event: U,
      listener:  (...args:Array<TEventMap[U]>) => void
  ): this {
      return this.removeListener(event, listener);
  }

  /**
   * Removes all listeners for the specified event type.
   * @template U Type of the event.
   * @param {U} event Event type
   * @returns {this} allowing to chain
   */
  removeAllListeners<U extends keyof TEventMap & string>(event?: U): this {
      return super.removeAllListeners(event);
  }

  /**
   * Returns an array of listeners for the specified event type.
   * @template U Type of the event.
   * @param {U} event Event type
   * @returns {((...args:Array<TEventMap[U]>) => void)[]} Array of listeners for the specified event
   */
  listeners<U extends keyof TEventMap & string>(event: U): ((...args:Array<TEventMap[U]>) => void)[] {
      return super.listeners(event);
  }

  /**
   * Returns the number of listeners for the specified event type.
   * @template U Type of the event.
   * @param {U} event Event type
   * @returns {number}
   */
  listenerCount<U extends keyof TEventMap & string>(event: U): number {
      return super.listenerCount(event);
  }
}