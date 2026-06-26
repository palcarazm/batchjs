# Jobs

A `Job` is the top‑level container that orchestrates the execution of a sequence of steps. It manages the overall state, timing, and metrics.

## Creating a Job

To define a job, extend the abstract `Job` class and implement the `_steps()` method:

```typescript
import { Job, Step } from 'batchjs';

class MyJob extends Job {
  protected _steps(): (Step | Step[])[] {
    return [
      // ... array of steps or groups of steps
    ];
  }
}
```

The `_steps()` method supports two types of elements:

- **A single `Step`** – runs sequentially.
- **An array of `Step[]`** – runs all steps in parallel (as a group).

```typescript
protected _steps(): (Step | Step[])[] {
  return [
    new StepA(),                              // runs sequentially
    [new StepB(), new StepC(), new StepD()],  // runs in parallel
    new StepE(),                              // only runs if all parallel steps succeed
  ];
}
```

### Parallel Execution Behavior

When a group of steps is defined as an array:

1. All steps in the group start simultaneously.
2. If **all** steps complete successfully, the job proceeds to the next element.
3. If **any** step fails, the job immediately:
   - Cancels all other running steps in the group.
   - Emits a `stepCancelled` event for each cancelled step.
   - Sets the job status to `FAILED`.
   - Halts execution (does NOT proceed to subsequent steps).

### Error Handling

- If a sequential step fails, the job halts immediately.
- If a parallel step fails, all other steps in that group are cancelled.
- The job does **not** proceed to the next sequential step or group after a failure.

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

The job will execute each step according to the plan. If any step fails, the job stops and throws the error.

## Events

Jobs extend `EventEmitter` and emit the following events:

- `start` – when the job begins.
- `end` – when the job completes successfully.
- `error` – when the job fails (emitted with the error).
- `stepStart` – when a step starts (emitted with the step instance).
- `stepEnd` – when a step ends (emitted with the step instance).
- `stepError` – when a step fails (emitted with `{ step, error }`).
- `stepCancelled` – when a step is cancelled (emitted with the step instance).

Use them to add logging or custom monitoring:

```typescript
job.on('stepStart', (step) => console.log(`Starting ${step.name}`));
job.on('stepCancelled', (step) => console.log(`Step ${step.name} was cancelled`));
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

## Example: Mixed Sequential and Parallel Steps

```typescript
import { Job, Step, StepBuilder, Readable, Writable, Transform } from 'batchjs';

class DataProcessingJob extends Job {
  protected _steps(): (Step | Step[])[] {
    // Step 1: Load data (sequential)
    const loadStep = new StepBuilder('load')
      .reader(() => Readable.from([1, 2, 3, 4, 5, 6], { objectMode: true }))
      .processors(() => [])
      .writer(() => new Writable({ objectMode: true, write(chunk, enc, cb) { cb(); } }))
      .build();

    // Step 2a: Process even numbers (parallel)
    const evenStep = new StepBuilder('even')
      .reader(() => Readable.from([1, 2, 3, 4, 5, 6], { objectMode: true }))
      .processors(() => [
        new Transform({
          objectMode: true,
          transform(chunk, enc, cb) {
            if (chunk % 2 === 0) this.push(chunk);
            cb();
          },
        }),
      ])
      .writer(() => new Writable({ objectMode: true, write(chunk, enc, cb) { cb(); } }))
      .build();

    // Step 2b: Process odd numbers (parallel)
    const oddStep = new StepBuilder('odd')
      .reader(() => Readable.from([1, 2, 3, 4, 5, 6], { objectMode: true }))
      .processors(() => [
        new Transform({
          objectMode: true,
          transform(chunk, enc, cb) {
            if (chunk % 2 !== 0) this.push(chunk);
            cb();
          },
        }),
      ])
      .writer(() => new Writable({ objectMode: true, write(chunk, enc, cb) { cb(); } }))
      .build();

    // Step 3: Aggregate results (sequential)
    const aggregateStep = new StepBuilder('aggregate')
      .reader(() => Readable.from([], { objectMode: true }))
      .processors(() => [])
      .writer(() => new Writable({ objectMode: true, write(chunk, enc, cb) { cb(); } }))
      .build();

    return [
      loadStep,
      [evenStep, oddStep], // runs in parallel
      aggregateStep,       // runs after both complete
    ];
  }
}
```
