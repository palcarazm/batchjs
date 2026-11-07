import { BatchJSError } from "./BatchJSError";

/**
 * Error thrown when the Job is cancelled or has steps that are cancelled.
 * @extends BatchJSError
 */
export class JobCancelledError extends BatchJSError {

    /**
     * Creates a new JobCancelledError.
     * @param {string[]} stepsName - The name of the cancelled Steps.
     */
    constructor(stepsName: string[]) {
        super(`Steps ${stepsName.join(", ")} were cancelled.`);
        this.name = "JobCancelledError";
    }
}