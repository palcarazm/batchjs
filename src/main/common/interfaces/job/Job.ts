import { Logger } from "../Logger";
import { Step } from "../step/Step";
import { Runnable, RunnableStatus } from "../runnable/_index";
import { JobEventMap } from "./JobEvents";
import { JobListener } from "./JobListener";
import { JobMetrics } from "./JobMeter";
import { JobCancelledError } from "../../errors/JobCancelledError";

/**
 * @interface
 * Options for the Job constructor.
 */
export interface JobOptions {
   /**
    * The logger to use for logging
    * @type {Logger}
    */ 
   logger?: Logger;
}

/**
 * @abstract
 * @class
 * Abstract base class for all jobs.
 * @extends {@link Runnable<JobEventMap>}
 * 
 * ```typescript
 * export class JobImplementation extends Job {
 *     protected _steps() {
 *         return [new PassingStepFirst(), new PassingStepSecond()];
 *     }
 * }
 * 
 * const job = new JobImplementation("My job");
 * job.on("stepStarted", ({ step }) => {
 *     console.log(`Starting step ${step.name}`);
 * })
 * job.on("finished", ({ name, status }) => {
 *     console.log(`Job ${name} finished with status ${status}`);
 * });
 * job.run();
 * ```
 * ```shell
 * >> Starting step PassingStepFirst
 * >> Starting step PassingStepSecond
 * >> Job My job finished with status COMPLETED
 * ```
 */
export abstract class Job extends Runnable<JobEventMap> {
    protected readonly options?:JobOptions;
    private readonly JobListener:JobListener;
    private _plan?: (Step | Step[])[];

    /**
     * @param {string} name - The name to assign to the Step.
     * @param {object} params - The parameters to pass to the job.
     * @param {JobOptions} options - An optional options object.
     */
    constructor(name:string, params:object={}, options?:JobOptions) {
        super(name, params);
        if (options) this.options = options;
        this.JobListener = new JobListener(this, options?.logger);
    }

    /**
     * The current metrics of the job.
     * @readonly
     * @type {JobMetrics}
     */
    get metrics():JobMetrics {
        return this.JobListener.metrics;
    }

    /**
     * @abstract
     * Abstract method that most be implemented by the job in order to returns an ordered array of steps or groups of steps that make up the job.
     * @returns {(Step | Step[])[]} An ordered array of steps or groups of steps that make up the job. Groups of steps run in parallel.
     * @protected
     */
    protected abstract _steps(): (Step | Step[])[];

    /**
     * Hook called during transition to RUNNING.
     * Builds the execution plan and launches it asynchronously.
     * @returns {Promise<{ cancelled: boolean; reason?: string; executionPromise: Promise<void> }>}
     */
    protected async doRun(): Promise<{ cancelled: boolean; reason?: string, executionPromise: Promise<void> }> {
        this._plan = this._steps();
        const executionPromise = this._executePlan(this._plan);
        return { cancelled: false, executionPromise };
    }

    /**
     * Hook called during transition to COMPLETED.
     * @returns {Promise<{ cancelled: boolean; reason?: string }>}
     */
    protected async doComplete(): Promise<{ cancelled: boolean; reason?: string }> {
        return { cancelled: false };
    }

    /**
     * Hook called during transition to FAILED.
     * @param {Error} _error - The error that caused the failure.
     * @returns {Promise<{ cancelled: boolean; reason?: string }>}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected async doFail(_error: Error): Promise<{ cancelled: boolean; reason?: string }> {
        return { cancelled: false };
    }

    /**
     * Hook called during transition to CANCELLED.
     * Cancels all running steps.
     * @returns {Promise<{ cancelled: boolean; reason?: string }>}
     */
    protected async doCancel(): Promise<{ cancelled: boolean; reason?: string }> {
        if(!this._plan) return { cancelled: false };

        return Promise.all(this._plan.flat().filter(s => s.isRunning).map(s => s.cancel()))
            .then(() => ({cancelled: false}))
            .catch((error) => ({cancelled: true, reason: error.message}));
    }

    /**
     * Asynchronously executes the plan. This runs in the background
     * after doRun() returns and the RUNNING state is set.
     * @param plan - The execution plan.
     * @returns {Promise<void>}
     * @private
     */
    private async _executePlan(plan: (Step | Step[])[]): Promise<void> {
        try {
            for (const element of plan) {
                if (this.isCancelled || this.transitioningTo === RunnableStatus.CANCELLED) break;
                if (Array.isArray(element)) {
                    await this._runParallel(element);
                } else {
                    await this._runSequential(element);
                }
            }
            
            if (this.isRunning) {
                await this.transitionTo(RunnableStatus.COMPLETED);
            }
        } catch (error) {
            if (this.isRunning && this.transitioningTo === undefined) {
                return this.transitionTo(RunnableStatus.FAILED,error as Error)
                    .finally(() => { throw error; });
            }

            throw error;
        }
    }

    /**
     * Runs a single step sequentially and re-emits its events.
     * @param step The step to run.
     * @returns {Promise<void>}
     * @private
     */
    private _runSequential(step: Step): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            step
                .once("started", () => {
                    this.emit("stepStarted", { step });
                })
                .once("completed", () => {
                    this.emit("stepCompleted", { step });
                    resolve();
                })
                .once("failed", (payload) => {
                    this.emit("stepFailed", { step, error: payload.error });
                    reject(payload.error);
                })
                .once("cancelled", () => {
                    this.emit("stepCancelled", { step });
                    reject(new JobCancelledError([step.name]));
                })
                .once("finished", (payload) => {
                    this.emit("stepFinished", { step, status: payload.status });
                })
                .run();
        });
    }

    /**
     * Runs an array of steps in parallel with fail-fast behavior.
     * If any step fails, all other steps are cancelled immediately.
     * @param steps The steps to run in parallel.
     * @returns {Promise<void>}
     * @private
     */
    private _runParallel(steps: Step[]): Promise<void> {
        let cancelled = false;

        return new Promise<void>((resolve, reject) => {
            let completedCount = 0;
            let hasRejected = false;

            for (const step of steps) {
                step
                    .once("started", () => {
                        this.emit("stepStarted", { step });
                    })
                    .once("completed", () => {
                        this.emit("stepCompleted", { step });
                        completedCount++;
                        if (completedCount === steps.length && !hasRejected) {
                            if (cancelled) {
                                reject(new JobCancelledError(steps.filter((s) => s.isCancelled).map((s) => s.name))); 
                            } else {
                                resolve();
                            }
                        }
                    })
                    .once("failed", ({ error }) => {
                        this.emit("stepFailed", { step, error });
                        if (!cancelled && !hasRejected) {
                            hasRejected = true;
                            cancelled = true;

                            steps
                                .filter((s) => s !== step && s.isRunning)
                                .forEach((s) => s.cancel());
                            
                            reject(error);
                        }
                    })
                    .once("cancelled", () => {
                        cancelled = true;
                        this.emit("stepCancelled", { step });
                        completedCount++;
                        if (completedCount === steps.length && !hasRejected) {
                            reject(new JobCancelledError(steps.filter((s) => s.isCancelled).map((s) => s.name)));
                        }
                    })
                    .once("finished", ({status}) => {
                        this.emit("stepFinished", { step, status });
                    })
                    .run();
            }
        });
    }
}