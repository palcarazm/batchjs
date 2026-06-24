type timerType = "JOB" | "STEP";

/**
 * @class
 * Class responsible for keeping track of the timers of a job.
 */
export class JobTimer {
    protected readonly jobName: string;
    protected readonly times: Map<string, bigint>;

    /**
     * Create a new JobTimer.
     * @param jobName The name of the job.
     */
    constructor(jobName: string) {
        this.jobName = jobName;
        this.times = new Map<string, bigint>();
    }

    /**
     * Convert a nanosecond duration to milliseconds.
     * @protected
     * @param start starting time in nanoseconds
     * @returns time in milliseconds
     */
    protected nsFrom(start: bigint) {
        const ns = process.hrtime.bigint() - start;
        return Number(ns) / 1_000_000;
    }

    /**
     * Generates a key for the timer Map.
     * @protected
     * @param type Is it a job or a step?
     * @param name The name of the job or step
     * @returns A key that can be used to identify the timer
     */
    protected getKey(type:timerType,name:string): string {
        switch (type) {
        case "JOB":
            return `${type}::${name}`;
        case "STEP":
            return `${type}::${this.jobName}::${name}`;
        }
    }

    /**
     * Start a timer for a job or step.
     * @param type Is it a job or a step?
     * @param name The name of the job or step
     */
    start(type:timerType,name:string): void {
        this.times.set(this.getKey(type,name), process.hrtime.bigint());
    }

    /**
     * Stop a timer for a job or step.
     * @param type Is it a job or a step?
     * @param name The name of the job or step
     * @returns The time taken to run the job or step in milliseconds, or 0 if the timer was not started.
     */
    stop(type:timerType,name:string): number {
        const start = this.times.get(this.getKey  (type,name));
        if (!start) return 0;
        this.times.delete(this.getKey (type,name));
        return this.nsFrom(start);
    }
}
