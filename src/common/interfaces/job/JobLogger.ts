import { Logger } from "../Logger";
import { RunnableStatus } from "../RunnableStatus";

/**
 * @class
 * Class responsible for logging the events of a job.
 */
export class JobLogger {
    protected readonly logger: Logger;
    protected readonly jobName: string;

    /**
     * @constructor
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
            `JOB::${
                this.jobName
            } launched with the following parameters: [${JSON.stringify(jobParams)}]`
        );
    }

    /**
   * Log the end of a job.
   * @param jobStatus The final status of the job.
   * @param duration The duration of the job in milliseconds.
   */
    public finish(jobStatus: RunnableStatus, duration: number) {
        this.logger.info(
            `JOB::${
                this.jobName
            } completed with status [${jobStatus}] in ${duration.toFixed(2)}ms`
        );
    }

    /**
   * Log the start of a step.
   * @param stepName The name of the step that started.
   * @param stepParams The parameters passed to the step.
   */
    public StepStart(stepName: string, stepParams: object) {
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
    public StepError(stepName: string, stepStatus: RunnableStatus, error: Error) {
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
    public StepFinish(
        stepName: string,
        stepStatus: RunnableStatus,
        duration: number
    ) {
        this.logger.info(
            `STEP::${stepName} completed with status [${stepStatus}] in ${duration.toFixed(2)}ms`
        );
    }
}
