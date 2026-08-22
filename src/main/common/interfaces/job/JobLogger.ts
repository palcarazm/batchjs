import { Logger } from "../Logger";
import { RunnableStatus } from "../runnable/_index";

/**
 * @class
 * Class responsible for logging the events of a job.
 */
export class JobLogger {
    protected readonly logger: Logger;
    protected readonly jobName: string;

    /**
     * @param {Logger} logger - The logger to use for logging.
     * @param {string} jobName - The name of the job to log.
     */
    constructor(logger: Logger, jobName: string) {
        this.logger = logger;
        this.jobName = jobName;
    }

    /**
     * Log the start of a job.
     * @param jobParams The parameters passed to the job.
     */
    public start(jobParams: object) {
        this.logger.info(
            `JOB::${this.jobName} launched with the following parameters: [${JSON.stringify(jobParams)}]`
        );
    }

    /**
     * Log the end of a job.
     * @param jobStatus The final status of the job.
     * @param duration The duration of the job in milliseconds.
     */
    public finish(jobStatus: RunnableStatus, duration: number) {
        this.logger.info(
            `JOB::${this.jobName} completed with status [${jobStatus}] in ${duration.toFixed(2)}ms`
        );
    }

    /**
     * Log the start of a step.
     * @param stepName The name of the step that started.
     * @param stepParams The parameters passed to the step.
     */
    public stepStart(stepName: string, stepParams: object) {
        this.logger.info(
            `STEP::${stepName} launched with the following parameters: [${JSON.stringify(stepParams)}]`
        );
    }

    /**
     * Log an error that occurred in a step.
     * @param stepName The name of the step that produced the error.
     * @param stepStatus The status of the step that produced the error.
     * @param error The error that occurred.
     */
    public stepError(stepName: string, stepStatus: RunnableStatus, error: Error) {
        this.logger.error(
            `Error in STEP::${stepName}: [${error.message}]\n${error.stack}`
        );
    }

    /**
     * Log the end of a step.
     * @param stepName The name of the step that finished.
     * @param stepStatus The status of the step that finished.
     * @param duration The duration of the step in milliseconds.
     */
    public stepFinish(
        stepName: string,
        stepStatus: RunnableStatus,
        duration: number
    ) {
        this.logger.info(
            `STEP::${stepName} completed with status [${stepStatus}] in ${duration.toFixed(2)}ms`
        );
    }

    /**
     * Log a rollback success that occurred in a step.
     * @param stepName The name of the step that rollback.
     */
    public stepRollbackSucceed(stepName: string) {
        this.logger.info(
            `STEP::${stepName} rollback succeeded`
        );
    }

    /**
     * Log a rollback error that occurred in a step.
     * @param stepName The name of the step that attempt to rollback.
     * @param error The rollback error.
     */
    public stepRollbackFailed(stepName: string, error: Error) {
        this.logger.error(
            `STEP::${stepName} rollback failed: [${error.message}]\n${error.stack}`
        );
    }

    /**
     * Log the schedule of a retry in a step.
     * @since 2.0.0
     * @param stepName The name of the step that will be retried
     * @param attempt The attempt number
     * @param maxRetries The maximum retries allowed by this step
     * @param delayMs The delay in milliseconds to wait until retry starts
     * @param cause The cause of the retry
     */
    public stepRetry(stepName: string, attempt: number, maxRetries: number, delayMs: number, cause: Error) {
        this.logger.warn(
            `STEP::${stepName} retry created with attempt ${attempt} of ${maxRetries}. Will start on ${delayMs} ms. Cause: [${cause.message}]\n${cause.stack}`
        );
    }

    /**
     * Log the start of a retry in a step.
     * @since 2.0.0
     * @param stepName The name of the step that will be retried
     * @param attempt The attempt number
     * @param maxRetries The maximum retries allowed by this step
     */
    public stepRetryStarted(stepName: string, attempt: number, maxRetries: number) {
        this.logger.debug(
            `STEP::${stepName} retry started with attempt ${attempt} of ${maxRetries}`
        );
    }

    /**
     * Log the exhaustion of a retry in a step.
     * @since 2.0.0
     * @param stepName The name of the step that will be retried
     * @param attempt The attempt number
     * @param maxRetries The maximum retries allowed by this step
     * @param cause The cause of the retry
     */
    public stepRetryExhausted(stepName: string, attempt: number, maxRetries: number, cause: Error) {
        this.logger.warn(
            `STEP::${stepName} retry exhausted with attempt ${attempt} of ${maxRetries}. Cause: [${cause.message}]\n${cause.stack}`
        );
    }
}