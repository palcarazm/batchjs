# Retry & Resilience

BatchJS supports configurable retry logic for steps to handle transient failures (network timeouts, database locks, temporary resource unavailability). When a step fails, it can be retried a configurable number of times with automatic rollback before each retry if `autoRollback` is enabled.

## How Retry Works

When a step run execution fails prior to set the step as failed, it will attempted to retry:

1. **Rollback**
   - If rollback is disabled → retry is skipped, step transitions to `FAILED`.
   - If rollback succeeds → proceed to retry logic.
   - If rollback fails → retry is skipped, step transitions to `FAILED`.

2. **Retry check** – If `maxRetries > 0` and `attempt < maxRetries`:
   - Emit `retry-created` event (before delay).
   - Wait for `retryDelay(attempt)` milliseconds.
   - Emit `retry-started` event.
   - Recreate streams and call `run()` again .

3. **Retry exhausted** – If `attempt >= maxRetries`:
   - Emit `retry-exhausted` event.
   - Step transitions to `FAILED`.

## Retry Options

Configure retry behavior via `StepOptions`:

| Option         | Type                              | Default        | Description                                                                 |
|----------------|-----------------------------------|----------------|-----------------------------------------------------------------------------|
| `maxRetries`   | `number`                          | `0`            | Maximum number of retry attempts (0 = disabled)                             |
| `retryDelay`   | `(attempt: number) => number`     | `() => 100`    | Function returning delay in milliseconds for a given attempt (1-based)      |

## Example with StepBuilder

```typescript
import { StepBuilder, Readable, Writable, Transform } from 'batchjs';

const step = new StepBuilder('resilient-step')
  .reader(() => Readable.from([1, 2, 3, 4, 5], { objectMode: true }))
  .processors(() => [
    new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        // Simulate a transient failure
        if (Math.random() < 0.3) {
          callback(new Error('Temporary database lock'));
          return;
        }
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
  .autoRollback(true)
  .rollback(async () => {
    // Clean up partial writes before retry
    await cleanupTemporaryData();
  })
  .maxRetries(3)
  .retryDelay((attempt) => Math.min(100 * Math.pow(2, attempt - 1), 5000)) // Exponential backoff
  .build();
```

## Example by Extending Step

```typescript
import { Step, Readable, Writable, Duplex, Transform } from 'batchjs';

class ResilientStep extends Step {
  constructor() {
    super('resilient-step', {}, {
      autoRollback: true,
      maxRetries: 3,
      retryDelay: (attempt) => Math.min(100 * Math.pow(2, attempt - 1), 5000),
    });
  }

  protected _reader(): Readable {
    return Readable.from([1, 2, 3, 4, 5], { objectMode: true });
  }

  protected _processors(): Duplex[] {
    return [
      new Transform({
        objectMode: true,
        transform(chunk, encoding, callback) {
          if (Math.random() < 0.3) {
            callback(new Error('Temporary database lock'));
            return;
          }
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

  protected async _rollback(): Promise<void> {
    await cleanupTemporaryData();
  }
}
```

## Retry Events

Steps emit the following retry-specific events:

| Event               | Payload                                                                  | Description                                          |
|---------------------|--------------------------------------------------------------------------|------------------------------------------------------|
| `retry-created`     | `{ attempt: number; maxRetries: number; delayMs: number; cause: Error }` | Emitted when a retry is scheduled (before delay)     |
| `retry-started`     | `{ attempt: number; maxRetries: number }`                                | Emitted when a retry actually starts (after delay)   |
| `retry-exhausted`   | `{ attempt: number; maxRetries: number; cause: Error }`                  | Emitted when all retry attempts are exhausted        |

Jobs re-emit these events as `step-retry-created`, `step-retry-started`, and `step-retry-exhausted` with the step instance included in the payload.

### Event Flow Example

```typescript
step.on('retry-created', ({ attempt, maxRetries, delayMs, cause }) => {
  console.log(`Retry ${attempt}/${maxRetries} scheduled in ${delayMs}ms due to: ${cause.message}`);
});

step.on('retry-started', ({ attempt, maxRetries }) => {
  console.log(`Retry ${attempt}/${maxRetries} started`);
});

step.on('retry-exhausted', ({ attempt, maxRetries, cause }) => {
  console.log(`All ${maxRetries} retries exhausted after attempt ${attempt}. Cause: ${cause.message}`);
});

// Job-level events
job.on('step-retry-created', ({ step, attempt, maxRetries, delayMs, cause }) => {
  console.log(`Step ${step.name} retry ${attempt}/${maxRetries} scheduled`);
});

job.on('step-retry-started', ({ step, attempt, maxRetries }) => {
  console.log(`Step ${step.name} retry ${attempt}/${maxRetries} started`);
});

job.on('step-retry-exhausted', ({ step, attempt, maxRetries, cause }) => {
  console.log(`Step ${step.name} retry ${attempt}/${maxRetries} exhausted: ${cause.message}`);
});
```

## Retry Patterns

### Constant Backoff

```typescript
.retryDelay(() => 250)
// Attempt 1: 250ms
// Attempt 2: 250ms
// Attempt 3: 250ms
// Attempt 4: 250ms
```

### Exponential Backoff

```typescript
.retryDelay((attempt) => Math.min(100 * Math.pow(2, attempt - 1), 10000))
// Attempt 1: 100ms
// Attempt 2: 200ms
// Attempt 3: 400ms
// Attempt 4: 800ms
// Attempt 5: 1600ms (capped at 10000ms)
```

### Custom Delay with Jitter

```typescript
.retryDelay((attempt) => {
  const base = Math.min(100 * Math.pow(2, attempt - 1), 10000);
  const jitter = Math.random() * 100;
  return base + jitter;
})
```

### Immediate Retry (No Delay)

```typescript
.retryDelay(() => 0)
```

### Progressive Backoff with Max Attempts

```typescript
.maxRetries(5)
.retryDelay((attempt) => {
  const delays = [100, 200, 500, 1000, 5000];
  return delays[attempt - 1] || 5000;
})
```

### Fibonacci Backoff

```typescript
.retryDelay((attempt) => {
  const fib = [0, 100, 100, 200, 300, 500, 800, 1300];
  return fib[attempt] || 2000;
})
```

## Important Notes

| Note                          | Description                                                                                                                                 |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| **Rollback required**         | When `autoRollback: true` is used with retries, you **must** provide a rollback function. Without it, retries may cause data duplication.   |
| **Retry delay function**      | The `retryDelay` function receives the retry attempt number (1-based for first retry). Return `0` for immediate retry.                      |
| **State persistence**         | Retries reuse the same Step instance. Streams are recreated on each retry.                                                                  |
| **Parallel execution**        | In parallel step groups, each step retries independently. If one step exhausts retries, the entire group fails (fail-fast).                 |
| **Cancellation during retry** | If a step is cancelled while a retry is pending, the timeout is cleared and the step transitions to `CANCELLED`.                            |
| **Attempt numbering**         | The initial run is attempt `0`. The first retry is attempt `1`.                                                                             |
| **Duration metrics**          | Step duration includes the time of all retry attempts. This provides an accurate measure of total execution time.                           |
| **Terminal states**           | Once a step reaches `COMPLETED`, `FAILED`, or `CANCELLED`, it cannot be retried. Retries only occur during the failure transition.          |

## When to Use Retries

| Scenario                              | Recommended | Example                                                      |
|---------------------------------------|-------------|--------------------------------------------------------------|
| Network timeouts                      | ✅ Yes      | API calls, database connections                              |
| Temporary database locks              | ✅ Yes      | Row locking, deadlock detection                              |
| Rate limiting / throttling            | ✅ Yes      | API rate limits, service quotas                              |
| Idempotent operations                 | ✅ Yes      | Writing to a database with idempotent keys                   |
| Non-idempotent operations             | ⚠️ Caution  | Appending to a file without checking for duplicates          |
| User input validation errors          | ❌ No       | Invalid data will fail every time                            |
| Logic errors / bugs                   | ❌ No       | Fix the code, don't retry                                    |
| Resource exhaustion (disk full, OOM)  | ❌ No       | Retry won't free resources                                   |
