import { BatchJSError } from "./BatchJSError";

/**
 * Error thrown when the StepBuilder is used incorrectly.
 * @extends BatchJSError
 */
export class StepBuilderError extends BatchJSError {

    /**
     * Creates a new StepBuilderError.
     * @param {string} name - The name of the Step.
     * @param {string} missingMethod - The name of the missing method.
     */
    constructor(name: string, missingMethod:string) {
        super(`Step "${name}" is missing a ${missingMethod}. Call .${missingMethod}() before .build().`);
        this.name = "StepBuilderError";
    }
}