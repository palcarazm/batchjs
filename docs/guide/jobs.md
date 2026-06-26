# Jobs

A `Job` is the top‑level container that orchestrates the execution of a sequence of steps. It manages the overall state, timing, and metrics.

## Creating a Job

To define a job, extend the abstract `Job` class and implement the `_steps()` method:

```typescript
import { Job, Step } from 'batchjs';

class MyJob extends Job {
  protected _steps(): Step[] {
    return [
      // ... array of Step instances
    ];
  }
}
```

The constructor accepts:

- `name` – a human‑readable identifier.
- `params` – an optional object with parameters (accessible via `this.params`).
- `options` – an optional `JobOptions` object (e.g., to provide a custom logger).

## Running a Job

Call `run()` on your job instance:

```typescript
const job = new MyJob('my-job', { someParam: 42 });
await job.run();
```

The job will execute each step sequentially. If any step fails, the job stops and throws the error.

## Events

Jobs extend `EventEmitter` and emit the following events:

- `start` – when the job begins.
- `end` – when the job completes successfully.
- `error` – when the job fails (emitted with the error).
- `stepStart` – when a step starts (emitted with the step instance).
- `stepEnd` – when a step ends (emitted with the step instance).
- `stepError` – when a step fails (emitted with `{ step, error }`).

Use them to add logging or custom monitoring:

```typescript
job.on('stepStart', (step) => console.log(`Starting ${step.name}`));
```

## Metrics

The job provides a `metrics` property of type `JobMetrics` that contains timing and status information for the job and each step. Metrics are automatically collected.

```typescript
console.log(job.metrics); // { name, status, duration, steps: [...] }
```

## Logging

Pass a custom logger implementing the `Logger` interface to `JobOptions` to get integrated logging for job lifecycle events.

```typescript
const logger = console; // or any custom logger
const job = new MyJob('my-job', {}, { logger });
```