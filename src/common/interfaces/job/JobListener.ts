import { Logger } from "../Logger";
import { Step } from "../Step";
import { Job } from "./Job";
import { JobLogger } from "./JobLogger";
import { JobMeter, JobMetrics } from "./JobMeter";
import { JobTimer } from "./JobTimer";

/**
 * @class
 * Class responsible for listening to the events of a job and dispatching them to handle timers, metrics and logging.
 */
export class JobListener {
    protected readonly timer:JobTimer;
    protected readonly meter: JobMeter;
    protected readonly logger?: JobLogger;

    /**
     * Creates a new JobListener for the given job.
     * @param job The job to listen to.
     * @param logger The logger to use for logging. If not given, no logging will be done.
     */
    constructor(job: Job,logger?: Logger) {
        this.timer = new JobTimer(job.name);
        this.meter = new JobMeter(job.name, job.status);
        if(logger) this.logger = new JobLogger(logger,job.name);

        job.once("start", () => {
            this.timer.start("JOB", job.name);
            this.meter.start(job.status);
            this.logger?.start(job.params);
           
        });

        job.once("end", () => {
            const duration = this.timer.stop("JOB", job.name);
            this.meter.finish(job.status, duration);
            this.logger?.finish(job.status, duration);
        });

        job.once("error", () => {
            const duration = this.timer.stop("JOB", job.name);
            this.meter.finish(job.status, duration);
            this.logger?.finish(job.status, duration);
        });

        job.on("stepStart", (step: Step) => {
            this.timer.start("STEP", step.name);
            this.meter.StepStart(step.name, step.status);
            this.logger?.StepStart(step.name, step.params);
        });

        job.once("stepError", ({step, error}) => {
            const duration = this.timer.stop("STEP", step.name);
            this.meter.StepFinish(step.name, step.status, duration);
            this.logger?.StepError(step.name, step.status, error);
            this.logger?.StepFinish(step.name, step.status, duration);
        });

        job.on("stepEnd", (step: Step) => {
            const duration = this.timer.stop("STEP", step.name);
            this.meter.StepFinish(step.name, step.status, duration);
            this.logger?.StepFinish(step.name, step.status, duration);
        });
    }

    /**
     * The metrics of the job.
     * @readonly
     * @type {JobMetrics}
     * @memberof JobListener
     */
    get metrics():JobMetrics {
        return this.meter.metrics;
    }
}
