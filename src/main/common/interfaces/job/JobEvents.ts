import { Step } from "../step/Step";

/**
 * The data associated with the stepError event.
 * @interface
 */
export interface StepErrorData { 
    /**
     * The step that failed.
     * @type {Step}
     */
    step:Step, 

    /**
     * The error that occurred.
     * @type {Error}
     */
    error:Error
};

/**
 * Defines the events that can be emitted by a job and the data associated with each event.
 * @interface
 */
export interface JobEventEmitters {
    /**
     * Emitted when the job starts.
     * @type {void}
     */
    start: void

    /**
     * Emitted when the job ends.
     * @type {void}
     */
    end: void

    /**
     * Emitted when the job fails.
     * @type {Error}
     */
    error: Error

    /**
     * Emitted when a step starts.
     * @type {Step}
     */
    stepStart: Step

    /**
     * Emitted when a step fails.
     * @type {StepErrorData}
     */
    stepError: StepErrorData

    /**
     * Emitted when a step ends.
     * @type {Step}
     */
    stepEnd: Step
}

/**
 * Defines the handlers for the events that can be emitted by a job.
 * @interface
 */
export interface JobEventHandlers {
    /**
     * Handler for the start event.
     * @type {() => void}
     */
    start: () => void

    /**
     * Handler for the error event.
     * @type {(Error) => void}
     */
    error: (error:Error) => void

    /**
     * Handler for the end event.
     * @type {() => void}
     */
    end: () => void

    /**
     * Handler for the stepStart event.
     * @type {(Step) => void}
     */
    stepStart: (step:Step) => void

    /**
     * Handler for the stepError event.
     * @type {(StepErrorData) => void}
     */
    stepError: (data:StepErrorData) => void

    /**
     * Handler for the stepEnd event.
     * @type {(Step) => void}
     */
    stepEnd: (step:Step) => void
}