import { Logger } from "../Logger";
import { Job } from "./Job";
import { JobLogger } from "./JobLogger";
import { JobMeter, JobMetrics } from "./JobMeter";
import { JobTimer, TimerType } from "./JobTimer";

/**
 * @class
 * Class responsible for listening to the events of a job and dispatching them to handle timers, metrics and logging.
 */
export class JobListener {
    protected readonly timer: JobTimer;
    protected readonly meter: JobMeter;
    protected readonly logger?: JobLogger;

    /**
     * Creates a new JobListener for the given job.
     * @param job The job to listen to.
     * @param logger The logger to use for logging. If not given, no logging will be done.
     */
    constructor(job: Job, logger?: Logger) {
        this.timer = new JobTimer(job.name);
        this.meter = new JobMeter(job.name);
        if (logger) this.logger = new JobLogger(logger, job.name);

        job.once("started", () => {
            this.timer.start(TimerType.JOB, job.name);
            this.meter.start();
            this.logger?.start(job.params);
        });

        job.once("finished", (payload) => {
            const duration = this.timer.stop(TimerType.JOB, job.name);
            this.meter.finish(payload.status, duration);
            this.logger?.finish(payload.status, duration);
        });


        job.on("stepStarted", ({ step }) => {
            this.timer.start(TimerType.STEP, step.name);
            this.meter.stepStart(step.name);
            this.logger?.stepStart(step.name, step.params);
        });

        job.once("stepFailed", ({ step, error }) => {
            const duration = this.timer.stop(TimerType.STEP, step.name);
            this.meter.stepFinish(step.name, step.status, duration);
            this.logger?.stepError(step.name, step.status, error);
            this.logger?.stepFinish(step.name, step.status, duration);
        });

        job.on("stepCompleted", ({ step }) => {
            const duration = this.timer.stop(TimerType.STEP, step.name);
            this.meter.stepFinish(step.name, step.status, duration);
            this.logger?.stepFinish(step.name, step.status, duration);
        });

        job.on("stepCancelled", ({ step }) => {
            const duration = this.timer.stop(TimerType.STEP, step.name);
            this.meter.stepFinish(step.name, step.status, duration);
            this.logger?.stepFinish(step.name, step.status, duration);
        });

        job.on("stepRollbackSucceed", ({ step }) => {
            this.logger?.stepRollbackSucceed(step.name);
        });

        job.on("stepRollbackFailed", ({ step, error }) => {
            this.logger?.stepRollbackFailed(step.name, error);
        });
    }

    /**
     * The metrics of the job.
     * @readonly
     * @type {JobMetrics}
     */
    get metrics(): JobMetrics {
        return this.meter.metrics;
    }
}