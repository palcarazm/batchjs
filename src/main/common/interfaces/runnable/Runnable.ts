import { EventEmitter } from "node:events";
import { RunnableStatus } from "./RunnableStatus";
import { BaseRunnableEventMap } from "./RunnableEvents";
import { createHash } from "node:crypto";

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
 * Abstract base class for all runnable entities (Job, Step, etc.).
 * Provides state machine, lifecycle hooks, and typed events.
 * 
 * @template TEventMap - The event map for this runnable. Extends BaseRunnableEventMap.
 * @since 2.0.0
 * 
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
    protected readonly NAMESPACE_UUID = "019f0ed5-f93b-762f-ac65-b9f826d2b5d5";
    private _status: RunnableStatus = RunnableStatus.CREATED;
    private _transitioningTo?: RunnableStatus;
    private _executionTask?: Promise<PromiseSettledResult<void>>;
    public readonly name: string;
    public readonly params: Record<string, unknown>;

    /**
     * @param name - The name to assign to this runnable.
     * @param params - The parameters to pass to this runnable.
     */
    constructor(name: string, params: Record<string, unknown> = {}) {
        super();
        this.name = name;
        this.params = params;
    }

    /**
     * A unique identifier for this runnable.
     * Uses: name + params (UUID v5 approach)
     * Uses SHA-1 for consistency.
     */
    get id(): string {
        const hash = createHash("sha1")
            .update(Buffer.from(this.NAMESPACE_UUID.replaceAll("-", ""), "hex"))
            .update(`${this.name}:${JSON.stringify(this.params, null, 0)}`)
            .digest();
        hash[6] = (hash[6] & 0x0f) | 0x50; // Set uuid version 5
        hash[8] = (hash[8] & 0x3f) | 0x80; // Set uuid variant RFC 4122
        const hex = hash.toString("hex");
        return (
            hex.slice(0, 8) + "-" +
            hex.slice(8, 12) + "-" +
            hex.slice(12, 16) + "-" +
            hex.slice(16, 20) + "-" +
            hex.slice(20, 32)
        );
    }

    /**
     * The current status of the runnable.
     */
    get status(): RunnableStatus {
        return this._status;
    }

    /**
     * The state the runnable is transitioning to, or undefined if not transitioning.
     */
    get transitioningTo(): RunnableStatus | undefined {
        return this._transitioningTo;
    }

    /**
     * Whether the runnable is currently running.
     */
    get isRunning(): boolean {
        return this._status === RunnableStatus.RUNNING;
    }

    /**
     * Whether the runnable is in the CREATED state.
     */
    get isCreated(): boolean {
        return this._status === RunnableStatus.CREATED;
    }

    /**
     * Whether the runnable is in the COMPLETED state.
     */
    get isCompleted(): boolean {
        return this._status === RunnableStatus.COMPLETED;
    }

    /**
     * Whether the runnable is in the FAILED state.
     */
    get isFailed(): boolean {
        return this._status === RunnableStatus.FAILED;
    }

    /**
     * Whether the runnable is in the CANCELLED state.
     */
    get isCancelled(): boolean {
        return this._status === RunnableStatus.CANCELLED;
    }

    /**
     * Sets the execution task promise as a settled promise.
     * 
     * @param executionTask - Promise to be settled as execution task.
     */
    private setExecutionTask(executionTask: Promise<void> | undefined) {
        if (executionTask === undefined) return;
        this._executionTask = Promise.allSettled([executionTask]).then((results) => results[0]);
    }

    /**
     * The execution task promise.
     */
    get executionTask(): Promise<PromiseSettledResult<void>> | undefined {
        return this._executionTask;
    }

    /**
     * Checks if a transition from current state to a given state is valid.
     * 
     * @param to - The target state.
     * @returns Whether the transition is valid.
     */
    protected canTransition(to: RunnableStatus): boolean {
        return VALID_TRANSITIONS[this._status]?.includes(to) ?? false;
    }

    /**
     * Transitions to the given state using the provided hook.
     * 
     * @param next - The target state.
     * @param error - Error to pass to the events if the transition fails.
     * 
     * @throws If the transition is invalid.
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
     * 
     * @template K - The event name to emit after a successful transition.
     * @param to - The target status to move into.
     * @param hook - The transition hook to execute before committing the transition.
     *   If the hook returns `{ cancelled: true }`, the transition is aborted
     *   and a `"transition-cancelled"` event is emitted instead.
     * @param eventName - The event to emit when the transition completes successfully.
     * 
     * @returns A promise that resolves once the transition has completed.
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
     * 
     * If cancelled: true, transition is aborted.
     * 
     * @returns An object containing:
     *   - cancelled: Whether the transition was cancelled.
     *   - reason: Optional reason for cancellation.
     *   - executionPromise: The promise that runs the main work.
     */
    protected abstract doRun(): Promise<{ cancelled: true; reason?: string} | { cancelled: false; reason?: string, executionPromise: Promise<void> }>;

    /**
     * Abstract hook called during transition to COMPLETED.
     * 
     * If cancelled: true, transition is aborted.
     * 
     * @returns An object containing cancelled status and optional reason.
     */
    protected abstract doComplete(): Promise<{ cancelled: boolean; reason?: string }>;

    /**
     * Abstract hook called during transition to FAILED.
     * 
     * If cancelled: true, transition is aborted.
     * 
     * @param error - The error that caused the failure.
     * @returns An object containing cancelled status and optional reason.
     */
    protected abstract doFail(error: Error): Promise<{ cancelled: boolean; reason?: string }>;

    /**
     * Abstract hook called during transition to CANCELLED.
     * 
     * If cancelled: true, transition is aborted.
     * 
     * @returns An object containing cancelled status and optional reason.
     */
    protected abstract doCancel(): Promise<{ cancelled: boolean; reason?: string }>;

    /**
     * Launches the runnable and returns a promise that resolves when it finishes.
     * 
     * @returns A promise that resolves when the runnable finishes.
     */
    public run(): Promise<void> {
        return this.transitionTo(RunnableStatus.RUNNING);
    }

    /**
     * Cancels the runnable if it is currently running.
     * 
     * @returns A promise that resolves when the cancellation completes.
     */
    public cancel(): Promise<void> {
        return this.transitionTo(RunnableStatus.CANCELLED);
    }

    /**
     * Completes the runnable if it is currently running.
     * 
     * @returns A promise that resolves when the completion completes.
     */
    public complete(): Promise<void> {
        return this.transitionTo(RunnableStatus.COMPLETED);
    }

    /**
     * Fails the runnable if it is currently running.
     * 
     * @param error - The error that caused the failure.
     * @returns A promise that resolves when the failure completes.
     */
    public fail(error: Error): Promise<void> {
        return this.transitionTo(RunnableStatus.FAILED, error);
    }

    /**
     * Emits an event of the specified type to the listeners.
     * 
     * @typeParam U - The event type.
     * @param event - The event type.
     * @param args - Additional arguments.
     * @returns Whether the event had listeners.
     */
    emit<U extends keyof TEventMap & string>(
        event: U,
        ...args: Array<TEventMap[U]>
    ): boolean {
        return super.emit(event, ...args);
    }

    /**
     * Adds an event listener to the specified event type.
     * 
     * @typeParam U - The event type.
     * @param event - The event type.
     * @param listener - The event listener.
     * @returns This instance for chaining.
     */
    addListener<U extends keyof TEventMap & string>(
        event: U,
        listener: (...args:Array<TEventMap[U]>) => void
    ): this {
        return super.addListener(event, listener);
    }

    /**
     * Adds an event listener to the specified event type.
     * 
     * @typeParam U - The event type.
     * @param event - The event type.
     * @param listener - The event listener.
     * @returns This instance for chaining.
     */
    on<U extends keyof TEventMap & string>(
        event: U,
        listener: (...args:Array<TEventMap[U]>) => void
    ): this {
        return super.on(event, listener);
    }

    /**
     * Adds a one-time event listener to the specified event type.
     * 
     * @typeParam U - The event type.
     * @param event - The event type.
     * @param listener - The event listener.
     * @returns This instance for chaining.
     */
    once<U extends keyof TEventMap & string>(
        event: U,
        listener:  (...args:Array<TEventMap[U]>) => void
    ): this {
        return super.once(event, listener);
    }

    /**
     * Adds an event listener to the beginning of the listeners array.
     * 
     * @typeParam U - The event type.
     * @param event - The event type.
     * @param listener - The event listener.
     * @returns This instance for chaining.
     */
    prependListener<U extends keyof TEventMap & string>(
        event: U,
        listener:  (...args:Array<TEventMap[U]>) => void
    ): this {
        return super.prependListener(event, listener);
    }

    /**
     * Adds a one-time event listener to the beginning of the listeners array.
     * 
     * @typeParam U - The event type.
     * @param event - The event type.
     * @param listener - The event listener.
     * @returns This instance for chaining.
     */
    prependOnceListener<U extends keyof TEventMap & string>(
        event: U,
        listener:  (...args:Array<TEventMap[U]>) => void
    ): this {
        return super.prependOnceListener(event, listener);
    }

    /**
     * Removes an event listener from the specified event type.
     * 
     * @typeParam U - The event type.
     * @param event - The event type.
     * @param listener - The event listener.
     * @returns This instance for chaining.
     */
    removeListener<U extends keyof TEventMap & string>(
        event: U,
        listener:  (...args:Array<TEventMap[U]>) => void
    ): this {
        return super.removeListener(event, listener);
    }

    /**
     * Alias for removeListener.
     * 
     * @typeParam U - The event type.
     * @param event - The event type.
     * @param listener - The event listener.
     * @returns This instance for chaining.
     */
    off<U extends keyof TEventMap & string>(
        event: U,
        listener:  (...args:Array<TEventMap[U]>) => void
    ): this {
        return this.removeListener(event, listener);
    }

    /**
     * Removes all listeners for the specified event type.
     * 
     * @typeParam U - The event type.
     * @param event - The event type.
     * @returns This instance for chaining.
     */
    removeAllListeners<U extends keyof TEventMap & string>(event?: U): this {
        return super.removeAllListeners(event);
    }

    /**
     * Returns an array of listeners for the specified event type.
     * 
     * @typeParam U - The event type.
     * @param event - The event type.
     * @returns Array of listeners for the specified event.
     */
    listeners<U extends keyof TEventMap & string>(event: U): ((...args:Array<TEventMap[U]>) => void)[] {
        return super.listeners(event);
    }

    /**
     * Returns the number of listeners for the specified event type.
     * 
     * @typeParam U - The event type.
     * @param event - The event type.
     * @returns The number of listeners.
     */
    listenerCount<U extends keyof TEventMap & string>(event: U): number {
        return super.listenerCount(event);
    }
}