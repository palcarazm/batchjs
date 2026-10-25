import { Logger } from "../Logger";
import { Step } from "../step/Step";
import { Runnable, RunnableStatus } from "../runnable/_index";
import { JobEventMap } from "./JobEvents";
import { JobListener } from "./JobListener";
import { JobMetrics } from "./JobMeter";
import { JobCancelledError } from "../../errors/JobCancelledError";
import { CheckpointStore, JobCheckpointManager } from "./checkpoint/_index";

/**
 * @interface
 * Options for the Job constructor.
 */
export interface JobOptions {
   /** The logger to use for logging */ 
   logger?: Logger;

   /** The checkpoint store to use for resumable jobs */
   checkpointStore?: CheckpointStore;
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
 * job.on("step-started", ({ step }) => {
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
    private readonly checkpointManager?: JobCheckpointManager;
    private _plan?: (Step | Step[])[];

    /**
     * @param {string} name - The name to assign to the Step.
     * @param {Record<string, unknown>} params - The parameters to pass to the job.
     * @param {JobOptions} options - An optional options object.
     */
    constructor(name:string, params:Record<string, unknown> ={}, options?:JobOptions) {
        super(name, params);
        if (options) this.options = options;
        this.JobListener = new JobListener(this, options?.logger);
        if (options?.checkpointStore){
            this.checkpointManager =  new JobCheckpointManager(this, options.checkpointStore);
        }
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
     * The ordered array of steps or groups of steps that make up the job.
     * @readonly
     * @type {(Step | Step[])[]}
     */
    get plan(): (Step | Step[])[] {
        this._plan ??= this._steps();
        return this._plan;
    }

    /**
     * @abstract
     * Abstract method that most be implemented by the job in order to returns an ordered array of steps or groups of steps that make up the job.
     * Groups of steps run in parallel.
     * @returns {(Step | Step[])[]} An ordered array of steps or groups of steps that make up the job. Groups of steps run in parallel.
     * @protected
     */
    protected abstract _steps(): (Step | Step[])[];

    /**
     * Hook called during transition to RUNNING.
     * Builds the execution plan and returns a function that, when invoked,
     * executes the plan asynchronously.
     * @returns {Promise<{ cancelled: true; reason?: string} | { cancelled: false; reason?: string, executionPromise: () => Promise<void> }>}
     */
    protected async doRun(): Promise<{ cancelled: true; reason?: string} | { cancelled: false; reason?: string, executionPromise: () => Promise<void> }> {
        try{
            await this.checkpointManager?.load();
        } catch (error) {
            return {cancelled: true, reason: `Failed to load checkpoints: ${(error as Error).message}`};
        }
        
        return { cancelled: false, executionPromise : () => this._executePlan() };
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
        return Promise.all(this.plan.flat().filter(s => s.isRunning).map(s => s.cancel()))
            .then(() => ({cancelled: false}))
            .catch((error) => ({cancelled: true, reason: error.message}));
    }

    /**
     * Asynchronously executes the plan. This runs in the background
     * after doRun() returns and the RUNNING state is set.
     * @returns {Promise<void>}
     * @private
     */
    private async _executePlan(): Promise<void> {
        try {
            if( this.checkpointManager?.isAllStepsCompleted()) return this.transitionTo(RunnableStatus.COMPLETED);

            await this._executePlanSteps();
            
            if (this.isRunning) return this.transitionTo(RunnableStatus.COMPLETED);
        } catch (error) {
            if (this.isRunning && this.transitioningTo === undefined) {
                await this.transitionTo(RunnableStatus.FAILED, error as Error);
            }

            throw error;
        }
    }


    /**
     * Executes all steps in the plan. It handles:
     * - Parallel execution of groups of steps.
     * - Sequential execution of steps.
     * - Checkpoints saving.
     * @returns {Promise<void>}
     */
    private async _executePlanSteps(): Promise<void> {
        for (const element of this.plan) {
            if (this.isCancelled || this.transitioningTo === RunnableStatus.CANCELLED) break;
            if (Array.isArray(element)) {
                const stepsToRun = this.checkpointManager === undefined ? element : element.filter(e => this.checkpointManager!.shouldRun(e));
                if (stepsToRun.length === 0) continue;
                await this._runParallel(stepsToRun)
                    .finally(() =>  this.checkpointManager?.saveStepsCheckpoints(stepsToRun));
            } else {
                if(this.checkpointManager?.shouldRun(element) === false) continue;
                await this._runSequential(element)
                    .finally(() =>  this.checkpointManager?.saveStepCheckpoint(element));
            }
        }
    }

    /**
     * Runs a single step sequentially and blinks an event dispatcher to re-emit events.
     * @param step The step to run.
     * @returns {Promise<void>}
     * @private
     */
    private _runSequential(step: Step): Promise<void> {
        this._blinkStepEventDispatcher(step);
        return new Promise<void>((resolve, reject) => {
            step
                .once("completed", () => {
                    resolve();
                })
                .once("failed", (payload) => {
                    reject(payload.error);
                })
                .once("cancelled", () => {
                    reject(new JobCancelledError([step.name]));
                })
                .run();
        });
    }

    /**
     * Runs an array of steps in parallel with fail-fast behavior
     * and blinks an event dispatcher to re-emit events.
     * If any step fails, all other steps are cancelled immediately.
     * @param steps The steps to run in parallel.
     * @returns {Promise<void>}
     * @private
     */
    private _runParallel(steps: Step[]): Promise<void> {
        if (steps.length === 0) return Promise.resolve();
        let cancelled = false;

        return new Promise<void>((resolve, reject) => {
            let completedCount = 0;
            let hasRejected = false;

            for (const step of steps) {
                this._blinkStepEventDispatcher(step);
                step
                    .once("completed", () => {
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
                        completedCount++;
                        if (completedCount === steps.length && !hasRejected) {
                            reject(new JobCancelledError(steps.filter((s) => s.isCancelled).map((s) => s.name)));
                        }
                    })
                    .run();
            }
        });
    }

    /**
     * Adds event dispatchers to each step event
     * that will re-emit events to the job.
     * @param step Step to blink event dispatcher
     */
    private _blinkStepEventDispatcher(step: Step) {
        step
            .once("started", () => {
                this.emit("step-started", { step });
            })
            .once("completed", () => {
                this.emit("step-completed", { step });
            })
            .once("failed", (payload) => {
                this.emit("step-failed", { step, error: payload.error, rollback: step.rollbackStatus });
            })
            .once("cancelled", () => {
                this.emit("step-cancelled", { step, rollback: step.rollbackStatus });
            })
            .once("finished", (payload) => {
                this.emit("step-finished", { step, status: payload.status, rollback: step.rollbackStatus });
            })
            .on("rollback-succeed", () => {
                this.emit("step-rollback-succeed", { step });
            })
            .once("rollback-failed", (payload) => {
                this.emit("step-rollback-failed", { step, error: payload.error });
            })
            .on("retry-created", ({ attempt, maxRetries, delayMs, cause }) => {
                this.emit("step-retry-created", { step, attempt, maxRetries, delayMs, cause });
            })
            .on("retry-started", ({ attempt, maxRetries }) => {
                this.emit("step-retry-started", { step, attempt, maxRetries });
            })
            .once("retry-exhausted", ({ attempt, maxRetries, cause }) => {
                this.emit("step-retry-exhausted", { step, attempt, maxRetries, cause });
            });
    }
}