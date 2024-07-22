import { EventEmitter } from "events";
import { Step } from "./Step";
import { JobEventEmitters, JobEventHandlers } from "./JobEvents";

/**
 * The base class for all jobs.
 */
export abstract class Job extends EventEmitter {
    /**
     * The steps that make up the job.
     * @returns {Array<Step>}
     */
    protected abstract _steps(): Array<Step>;

    /**
     * Asynchronously runs the job by executing each step in sequence.
     *
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

    addListener<U extends keyof JobEventHandlers>(event: U, listener: JobEventHandlers[U]): this {
        return super.addListener(event, listener);
    }

    emit<U extends keyof JobEventEmitters>(event: U, ...args: Array<JobEventEmitters[U]>): boolean {
        return super.emit(event, ...args);
    }

    on<U extends keyof JobEventHandlers>(event: U, listener: JobEventHandlers[U]): this {
        return super.on(event, listener);
    }

    once<U extends keyof JobEventHandlers>(event: U, listener: JobEventHandlers[U]): this {
        return super.once(event, listener);
    }

    prependListener<U extends keyof JobEventHandlers>(event: U, listener: JobEventHandlers[U]): this {
        return super.prependListener(event, listener);
    }

    prependOnceListener<U extends keyof JobEventHandlers>(event: U, listener: JobEventHandlers[U]): this {
        return super.prependOnceListener(event, listener);
    }

    removeListener<U extends keyof JobEventHandlers>(event: U, listener: JobEventHandlers[U]): this {
        return super.removeListener(event, listener);
    }
}