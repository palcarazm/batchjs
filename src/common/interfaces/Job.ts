import { Step } from "./Step";

/**
 * The base class for all jobs.
 */
export abstract class Job {
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
        const steps = this._steps();
        try {
            for (const step of steps) {
                await step.run();
            }
            return Promise.resolve();
        } catch (error) {
            return Promise.reject(error);
        }
    }
}