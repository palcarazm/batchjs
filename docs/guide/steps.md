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
| `transition-cancelled`  | `{ from: RunnableStatus; to: RunnableStatus; reason?: string }` | Emitted when a hook cancels a transition  |
| `transition-invalid`    | `{ from: RunnableStatus; to: RunnableStatus }`                  | Emitted on invalid state transition       |

```typescript
step.on('started', () => console.log('Step started'));
step.on('completed', () => console.log('Step completed'));
step.on('failed', ({ error }) => console.error('Step failed', error));
step.on('cancelled', () => console.log('Step cancelled'));
step.on('finished', ({ status }) => console.log(`Step finished with ${status}`));
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

> **Note:** Manual cancellation is typically not needed when using Jobs, as the Job handles cancellation of parallel groups automatically.

## Error Handling

If any stream emits an error, the step fails and the error is propagated to the job. You can listen to stream errors directly if you need custom handling.

When a step is cancelled (either manually or by the job), the `run()` promise rejects with a `StepCancelledError`. This allows the job to distinguish between a step that failed and one that was cancelled.
