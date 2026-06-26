import { EventEmitter } from "node:events";
import { Logger } from "../Logger";
import { Step } from "../step/Step";
import { JobEventEmitters, JobEventHandlers } from "./JobEvents";
import { JobListener } from "./JobListener";
import { RunnableStatus } from "../RunnableStatus";
import { JobMetrics } from "./JobMeter";

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
 * @extends {@link EventEmitter}
 * ```typescript
 * export class JobImplementation extends Job {
 *     protected _steps() {
 *         return [new PassingStepFirst(), new PassingStepSecond()];
 *     }
 * }
 * 
 * const job = new JobImplementation("My job");
 * job.on("stepStart", (step:step) => {
 *     console.log(`Starting step ${step.name}`);
 * })
 * job.run()
 *     .then(() => {
 *         console.log("Job completed successfully");
 *     })
 *     .catch((error) => {
 *         console.log("Job completed with errors");
 *     });
 * ```
 * ```shell
 * >> Starting step PassingStepFirst
 * >> Starting step PassingStepSecond
 * >> Job completed successfully
 * ```
 */
export abstract class Job extends EventEmitter {
    public readonly name:string;
    protected _status:RunnableStatus;
    public readonly params:object;
    protected readonly options?:JobOptions;
    private readonly JobListener:JobListener;

    /**
     * @param {string} name - The name to assign to the Step.
     * @param {object} params - The parameters to pass to the job.
     * @param {JobOptions} options - An optional options object.
     */
    constructor(name:string, params:object={}, options?:JobOptions) {
        super();
        this._status = RunnableStatus.CREATED;
        this.name = name;
        this.params = params;
        if (options) this.options = options;
        this.JobListener = new JobListener(this, options?.logger);
    }

    /**
     * The current status of the job.
     * @readonly
     * @type {RunnableStatus}
     */
    get status():RunnableStatus {
        return this._status;
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
     * Asynchronously runs the job by executing each step in sequence.
     * @return {Promise<void>} A Promise that resolves when all steps are successfully executed or rejects if an error occurs.
     */
    public async run():Promise<void>{
        this._status = RunnableStatus.RUNNING;
        this.emit("start");
        const plan = this._steps();
        try {
            for (const element of plan) {
                if (Array.isArray(element)) {
                    await this._runParallel(element);
                } else {
                    await this._runSequential(element);
                }
            }
            this._status = RunnableStatus.COMPLETED;
            this.emit("end");
            return ;
        } catch (e) {
            const error = e as Error;
            this._status = RunnableStatus.FAILED;
            this.emit("error", error );
            throw error;
        }
    }

    /**
     * Runs a single step sequentially.
     * @param step The step to run.
     * @returns {Promise<void>}
     * @private
     */
    private _runSequential(step: Step): Promise<void> {
        this.emit("stepStart", step);
        return step.run()
            .then(() => {
                this.emit("stepEnd", step);
            })
            .catch((e) => { 
                const error = e as Error;
                this.emit("stepError",{step, error});
                throw error;
            });
    }

    /**
     * Runs an array of steps in parallel with fail-fast behavior.
     * If any step fails, all other steps are cancelled immediately.
     * @param steps The steps to run in parallel.
     * @returns {Promise<void>}
     * @private
     */
    private _runParallel(steps: Step[]): Promise<void[]> {
        steps.forEach((step) => this.emit("stepStart", step));
        
        let cancelled = false;

        return Promise.all(
            steps.map((step) => step.run()
                .then(() => {
                    if (!cancelled) {
                        this.emit("stepEnd", step);
                    }
                })
                .catch((e) => {
                    const error = e as Error;
                    if (!cancelled) {
                        cancelled = true;
                        this.emit("stepError", { step, error });

                        steps.filter((s) => s !== step && s.isRunning)
                            .forEach((s) => {
                                s.cancel();
                                this.emit("stepCancelled", s);
                            });
                    }
                    throw error;
                })
            )
        );
    }

    /**
     * Adds an event listener to the specified event type.
     * @template U Type of the event. Should be one of `start`, `end`, `stepStart` or `stepEnd`.
     * @param {U} event Event type
     * @param {(...args: Array<JobEventEmitters[U]>) => void} listener Event listener
     * @returns {this} allowing to chain
     */
    addListener<U extends keyof JobEventHandlers>(event: U, listener: JobEventHandlers[U]): this {
        return super.addListener(event, listener);
    }

    /**
     * Emits an event of the specified type to the listeners.
     * @template U Type of the event. Should be one of `start`, `end`, `stepStart` or `stepEnd`.
     * @param {U} event Event type
     * @param {...Array<JobEventEmitters[U]>} args Additional arguments to pass to the listeners
     * @returns  {boolean}
     */
    emit<U extends keyof JobEventEmitters>(event: U, ...args: Array<JobEventEmitters[U]>): boolean {
        return super.emit(event, ...args);
    }

    /**
     * Adds an event listener to the specified event type.
     * @template U Type of the event. Should be one of `start`, `end`, `stepStart` or `stepEnd`.
     * @param {U} event Event type
     * @param {(...args: Array<JobEventEmitters[U]>) => void} listener Event listener
     * @returns {this} allowing to chain
     */
    on<U extends keyof JobEventHandlers>(event: U, listener: JobEventHandlers[U]): this {
        return super.on(event, listener);
    }

    /**
     * Adds a one time event listener to the specified event type.
     * @template U Type of the event. Should be one of `start`, `end`, `stepStart` or `stepEnd`.
     * @param {U} event Event type
     * @param {(...args: Array<JobEventEmitters[U]>) => void} listener Event listener
     * @returns {this} allowing to chain
     */
    once<U extends keyof JobEventHandlers>(event: U, listener: JobEventHandlers[U]): this {
        return super.once(event, listener);
    }

    /**
     * Adds an event listener to the specified event type to the beginning of the listeners array.
     * @template U Type of the event. Should be one of `start`, `end`, `stepStart` or `stepEnd`.
     * @param {U} event Event type
     * @param {(...args: Array<JobEventEmitters[U]>) => void} listener Event listener
     * @returns {this} allowing to chain
     */
    prependListener<U extends keyof JobEventHandlers>(event: U, listener: JobEventHandlers[U]): this {
        return super.prependListener(event, listener);
    }

    /**
     * Adds a one time event listener to the specified event type to the beginning of the listeners array.
     * @template U Type of the event. Should be one of `start`, `end`, `stepStart` or `stepEnd`.
     * @param {U} event Event type
     * @param {(...args: Array<JobEventEmitters[U]>) => void} listener Event listener
     * @returns {this} allowing to chain
     */
    prependOnceListener<U extends keyof JobEventHandlers>(event: U, listener: JobEventHandlers[U]): this {
        return super.prependOnceListener(event, listener);
    }

    /**
     * Removes an event listener to the specified event type.
     * @template U Type of the event. Should be one of `start`, `end`, `stepStart` or `stepEnd`.
     * @param {U} event Event type
     * @param {(...args: Array<JobEventEmitters[U]>) => void} listener Event listener
     * @returns {this} allowing to chain
     */
    removeListener<U extends keyof JobEventHandlers>(event: U, listener: JobEventHandlers[U]): this {
        return super.removeListener(event, listener);
    }
}