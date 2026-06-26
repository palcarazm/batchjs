import { RunnableStatus } from "../RunnableStatus";

/**
 * The metrics of a job.
 * @interface
 * @extends RunnableMetric
 */
export interface JobMetrics extends RunnableMetric{
    /**
     * The metrics of the steps in the job.
     * @type {RunnableMetric[]}
     */
    steps: RunnableMetric[];
}

/**
 * The metrics of a runnable.
 * @interface
 */
export interface RunnableMetric {
    /**
     * The name of the runnable.
     * @type {string}
     */
    name: string;

    /**
     * The status of the runnable.
     * @type {RunnableStatus}
     */
    status: RunnableStatus;

    /**
     * The duration of the runnable.
     * @type {object}
     */
    duration?: {
        /**
         * The duration of the runnable in milliseconds.
         * @type {number}
         */
        ms: number
    };
  }

/**
 * @class
 * Class responsible for keeping track of the metrics of a job.
 */
export class JobMeter{
    protected readonly _metrics: JobMetrics;

    /**
     * @param {string} jobName - The name to assign to the Job.
     * @param {RunnableStatus} jobStatus - The status to assign to the Job.
     */
    constructor(jobName: string, jobStatus: RunnableStatus){
        this._metrics ={name: jobName, status: jobStatus, steps: []}; 
    }

    
    /**
     * Start a job by setting its status to the given jobStatus.
     * @param jobStatus The status to set the job to.
     */
    public start(jobStatus: RunnableStatus){
        this._metrics.status = jobStatus;
    }


    /**
     * Finish a job by setting its status to the given jobStatus and its duration to the given duration.
     * @param jobStatus The status to set the job to.
     * @param duration The duration of the job in milliseconds.
     */
    public finish(jobStatus: RunnableStatus, duration: number){
        this._metrics.status = jobStatus;
        this._metrics.duration = { ms: duration };
    }

    /**
     * Start a step by adding a new entry to the list of steps with the given stepName and stepStatus.
     * @param stepName The name to assign to the step.
     * @param stepStatus The status to assign to the step.
     */
    public StepStart(stepName:string,stepStatus: RunnableStatus){
        this._metrics.steps.push({name: stepName, status: stepStatus});
    }
    /**
     * Finish a step by finding the entry in the list of steps with the given stepName and setting its status to the given stepStatus and its duration to the given duration.
     * @param stepName The name of the step to finish.
     * @param stepStatus The status to set the step to.
     * @param duration The duration of the step in milliseconds.
     */
    public StepFinish(stepName:string,stepStatus: RunnableStatus, duration: number){
        const metric = this._metrics.steps.find(s => s.name === stepName);
        if (metric) {
            metric.status = stepStatus;
            metric.duration = { ms: duration };
        }
    }

    /**
     * The metrics of the job.
     * @readonly
     * @type {JobMetrics}
     */
    get metrics():JobMetrics {
        return this._metrics;
    }
}
