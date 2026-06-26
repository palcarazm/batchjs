import { BatchJSError } from "./BatchJSError";

/**
 * Error thrown when the StepBuilder is used incorrectly.
 * @extends BatchJSError
 */
export class StepCancelledError extends BatchJSError {

    /**
     * Creates a new StepCancelledError.
     * @param {string} name - The name of the Step.
     */
    constructor(name: string) {
        super(`Step ${name} was cancelled.`);
        this.name = "StepCancelledError";
    }
}