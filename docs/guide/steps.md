# Steps

A `Step` is the building block of a job. It defines a pipeline of streams: a reader, zero or more processors (transforms), and a writer.

## The Anatomy of a Step

Every step consists of three parts:

- **Reader** – a `Readable` stream that produces data.
- **Processors** – an array of `Duplex` streams (commonly `Transform`) that process the data.
- **Writer** – a `Writable` stream that consumes the data.

The data flows: `reader → processor1 → processor2 → … → writer`.

## Creating a Step

You can create a step either by extending the abstract `Step` class or using the `StepBuilder` fluent API.

### StepBuilder

If the step won't be reused by others Job, you can define an `AnonymousStep`  with the `StepBuilder`.

```typescript
import { StepBuilder, Readable, Writable, Transform } from 'batchjs';

const step = new StepBuilder('my-step')
  .reader(() => Readable.from([1, 2, 3], { objectMode: true }))
  .processors(() => [
    new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        this.push(chunk * 2);
        callback();
      },
    }),
  ])
  .writer(() => new Writable({
    objectMode: true,
    write(chunk, encoding, callback) {
      console.log(chunk);
      callback();
    },
  }))
  .build();
```

### Extending Step

However, for reusable step you can extend the `Step` class.

```typescript
import { Step, Readable, Writable, Duplex } from 'batchjs';

class MyStep extends Step {
  protected _reader(): Readable {
    return Readable.from([1, 2, 3], { objectMode: true });
  }

  protected _processors(): Duplex[] {
    return [
      new Transform({
        objectMode: true,
        transform(chunk, encoding, callback) {
          this.push(chunk * 2);
          callback();
        },
      }),
    ];
  }

  protected _writer(): Writable {
    return new Writable({
      objectMode: true,
      write(chunk, encoding, callback) {
        console.log(chunk);
        callback();
      },
    });
  }
}
```

## Parameters

Steps can receive parameters via the constructor (or `StepBuilder`). These are accessible via `this.params`.

```typescript
const step = new StepBuilder('filter', { maxNumber: 10 })
  .reader(() => Readable.from(...Array(this.maxNumber).keys(), { objectMode: true }))
  // ...
  .build();
```

## StepOptions

Steps accept an optional `StepOptions` object in the constructor (or via `StepBuilder`) to configure behavior:

| Option         | Type      | Default | Description                                                                     |
|----------------|-----------|---------|---------------------------------------------------------------------------------|
| `autoRollback` | `boolean` | `false` | Whether to automatically call `_rollback()` when the step fails or is cancelled |

## Rollback

Steps can implement rollback logic to clean up side effects when a step fails or is cancelled. This is useful for:

- Deleting partially written files
- Reverting database transactions
- Cleaning up temporary resources
- Ensuring idempotent retries

### How Rollback Works

1. **Define rollback logic** – Override the `_rollback()` method in your step subclass or provide a rollback function via `StepBuilder.rollback()`.
2. **Enable auto-rollback** – Set `autoRollback: true` in `StepOptions`.
3. **Automatic execution** – When the step fails or is cancelled, `_rollback()` is called automatically.

### Example with StepBuilder

```typescript
import { StepBuilder, Readable, Writable, Transform } from 'batchjs';
import { promises as fs } from 'node:fs';

const step = new StepBuilder('file-writer')
  .reader(() => Readable.from(['data'], { objectMode: true }))
  .processors(() => [])
  .writer(() => {
    const filePath = '/tmp/output.txt';
    return createWriteStream(filePath);
  })
  .autoRollback(true)
  .rollback(async () => {
    // Delete the partially written file if the step fails
    await fs.unlink('/tmp/output.txt').catch(() => {});
  })
  .build();
```

### Example by Extending Step

```typescript
import { Step, Readable, Writable, Duplex } from 'batchjs';
import { promises as fs } from 'node:fs';

class FileWriterStep extends Step {
  private readonly filePath: string;

  constructor(filePath: string) {
    super('file-writer', { filePath }, { autoRollback: true });
    this.filePath = filePath;
  }

  protected _reader(): Readable {
    return Readable.from(['data'], { objectMode: true });
  }

  protected _processors(): Duplex[] {
    return [];
  }

  protected _writer(): Writable {
    return createWriteStream(this.filePath);
  }

  protected async _rollback(): Promise<void> {
    // Clean up the partial file if the step fails
    await fs.unlink(this.filePath).catch(() => {});
  }
}
```

### Rollback Status

After a rollback attempt, the rollback status is available via `step.rollbackStatus`:

| Status          | Description                                                         |
|-----------------|---------------------------------------------------------------------|
| `UNATTEMPTED`   | No rollback was attempted (autoRollback is false or step succeeded) |
| `SUCCEED`       | Rollback completed successfully                                     |
| `FAILED`        | Rollback failed with an error                                       |

The rollback status is also included in job events (`stepFailed`, `stepCancelled`, `stepFinished`).

### Rollback Events

Steps emit the following rollback-specific events:

| Event               | Payload             | Description                                   |
|---------------------|---------------------|-----------------------------------------------|
| `rollback-succeed`  | `void`              | Emitted when rollback completes successfully  |
| `rollback-failed`   | `{ error: Error }`  | Emitted when rollback fails                   |

Jobs re-emit these events as `stepRollbackSucceed` and `stepRollbackFailed` with the step instance included in the payload.

### Important Notes

| Note                        | Description                                                                                                                                 |
|-----------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| **Default implementation**  | `_rollback()` throws by default. You **must** override it or provide a rollback function when `autoRollback` is enabled.                    |
| **Builder validation**      | `StepBuilder` will throw an error if `autoRollback: true` is set without a rollback function.                                               |
| **Error preservation**      | If rollback fails, the original error (from the step failure) is preserved. The rollback error is emitted via the `rollback-failed` event.  |
| **Order of operations**     | When a step fails or is cancelled: 1) Streams are destroyed, 2) Rollback is attempted (if enabled).                                         |

## Running a Step

You don't usually run a step manually – it's executed by the job. However, you can run it directly by calling `step.run()` (returns a `Promise<void>`).

## Status

The step's status is available via the `status` getter, which returns a `RunnableStatus` enum value:

| Status      | Description                                   |
|-------------|-----------------------------------------------|
| `CREATED`   | Step has been instantiated but not started    |
| `RUNNING`   | Step is currently executing                   |
| `COMPLETED` | Step finished successfully                    |
| `CANCELLED` | Step was cancelled                            |
| `FAILED`    | Step failed with an error                     |

Convenience getters are also available:

- `isCreated`, `isRunning`, `isCompleted`, `isFailed`, `isCancelled`

## Events

Steps extend `Runnable` and emit the following lifecycle events:

| Event                   | Payload                                                         | Description                               |
|-------------------------|-----------------------------------------------------------------|-------------------------------------------|
| `started`               | `{ name: string }`                                              | Emitted when transitioning to `RUNNING`   |
| `completed`             | `{ name: string }`                                              | Emitted when transitioning to `COMPLETED` |
| `failed`                | `{ name: string; error: Error }`                                | Emitted when transitioning to `FAILED`    |
| `cancelled`             | `{ name: string }`                                              | Emitted when transitioning to `CANCELLED` |
| `finished`              | `{ name: string; status: RunnableStatus }`                      | Emitted on any terminal state             |
| `rollback-succeed`      | `void`                                                          | Emitted when rollback succeeds            |
| `rollback-failed`       | `{ error: Error }`                                              | Emitted when rollback fails               |
| `transition-cancelled`  | `{ from: RunnableStatus; to: RunnableStatus; reason?: string }` | Emitted when a hook cancels a transition  |
| `transition-invalid`    | `{ from: RunnableStatus; to: RunnableStatus }`                  | Emitted on invalid state transition       |

```typescript
step.on('started', () => console.log('Step started'));
step.on('completed', () => console.log('Step completed'));
step.on('failed', ({ error }) => console.error('Step failed', error));
step.on('cancelled', () => console.log('Step cancelled'));
step.on('finished', ({ status }) => console.log(`Step finished with ${status}`));
step.on('rollback-succeed', () => console.log('Rollback succeeded'));
step.on('rollback-failed', ({ error }) => console.error('Rollback failed', error));
```

## Cancelling a Step

When a step is running as part of a parallel group and another step in that group fails, the step is automatically cancelled. You can also manually cancel a step by calling `step.cancel()` (which now returns a `Promise<void>`).

```typescript
const step = new MyStep();
step.run(); // Returns immediately

// Cancel the step (async)
await step.cancel(); // Sets status to CANCELLED and destroys streams
```

When a step is cancelled:

- Its status becomes `CANCELLED`.
- The `finished` and `cancelled` events are emitted.
- Any pending streams are destroyed.
- If `autoRollback` is enabled, `_rollback()` is called.

> **Note:** Manual cancellation is typically not needed when using Jobs, as the Job handles cancellation of parallel groups automatically.

## Error Handling

If any stream emits an error, the step fails and the error is propagated to the job. You can listen to stream errors directly if you need custom handling.

When a step is cancelled (either manually or by the job), the `run()` promise rejects with a `StepCancelledError`. This allows the job to distinguish between a step that failed and one that was cancelled.
