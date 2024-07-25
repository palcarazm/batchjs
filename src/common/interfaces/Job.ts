import { EventEmitter } from "events";
import { Step } from "./Step";
import { JobEventEmitters, JobEventHandlers } from "./JobEvents";

/**
 * @abstract
 * @class
 * Abstract base class for all jobs.
 * @extends EventEmitter
 * @example
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
    readonly name:string;

    /**
     * @constructor
     * @param {string} name - The name to assign to the Step.
     */
    constructor(name:string) {
        super();
        this.name = name;
    }

    /**
     * @abstract
     * The steps that make up the job.
     * @function _steps
     * @memberof Job
     * @returns {Array<Step>}
     * @protected
     */
    protected abstract _steps(): Array<Step>;

    /**
     * Asynchronously runs the job by executing each step in sequence.
     * @return {Promise<void>} A Promise that resolves when all steps are successfully executed or rejects if an error occurs.
     */
    public async run():Promise<void>{
        this.emit("start");
        const steps = this._steps();
        try {
            for (const step of steps) {
                this.emit("stepStart", step);
                await step.run();
                this.emit("stepEnd", step);
            }
            this.emit("end");
            return Promise.resolve();
        } catch (e) {
            const error = e as Error;
            return Promise.reject(error);
        }
    }

    /**
     * Adds an event listener to the specified event type.
     * @param event {start | end | stepStart | stepEnd}
     * @param listener {Function}
     * @returns {this} allowing to chain
     */
    addListener<U extends keyof JobEventHandlers>(event: U, listener: JobEventHandlers[U]): this {
        return super.addListener(event, listener);
    }

    /**
     * Emits an event of the specified type to the listeners.
     * @param event {start | end | stepStart | stepEnd}
     * @param args {Array<JobEventEmitters>} Data to sent to the listeners depending on the event type
     * @returns  {boolean}
     */
    emit<U extends keyof JobEventEmitters>(event: U, ...args: Array<JobEventEmitters[U]>): boolean {
        return super.emit(event, ...args);
    }

    /**
     * Adds an event listener to the specified event type.
     * @param event {start | end | stepStart | stepEnd}
     * @param listener {Function}
     * @returns {this} allowing to chain
     */
    on<U extends keyof JobEventHandlers>(event: U, listener: JobEventHandlers[U]): this {
        return super.on(event, listener);
    }

    /**
     * Adds a one time event listener to the specified event type.
     * @param event {start | end | stepStart | stepEnd}
     * @param listener {Function}
     * @returns {this} allowing to chain
     */
    once<U extends keyof JobEventHandlers>(event: U, listener: JobEventHandlers[U]): this {
        return super.once(event, listener);
    }

    /**
     * Adds an event listener to the specified event type to the beginning of the listeners array.
     * @param event {start | end | stepStart | stepEnd}
     * @param listener {Function}
     * @returns {this} allowing to chain
     */
    prependListener<U extends keyof JobEventHandlers>(event: U, listener: JobEventHandlers[U]): this {
        return super.prependListener(event, listener);
    }

    /**
     * Adds a one time event listener to the specified event type to the beginning of the listeners array.
     * @param event {start | end | stepStart | stepEnd}
     * @param listener {Function}
     * @returns {this} allowing to chain
     */
    prependOnceListener<U extends keyof JobEventHandlers>(event: U, listener: JobEventHandlers[U]): this {
        return super.prependOnceListener(event, listener);
    }

    /**
     * Removes an event listener to the specified event type.
     * @param event {start | end | stepStart | stepEnd}
     * @param listener {Function}
     * @returns {this} allowing to chain
     */
    removeListener<U extends keyof JobEventHandlers>(event: U, listener: JobEventHandlers[U]): this {
        return super.removeListener(event, listener);
    }
}