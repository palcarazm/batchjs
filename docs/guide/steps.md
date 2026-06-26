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

The step's status is available via the `status` getter, which returns a `RunnableStatus` enum value: `CREATED`, `RUNNING`, `COMPLETED`, or `FAILED`.

## Error Handling

If any stream emits an error, the step fails and the error is propagated to the job. You can listen to stream errors directly if you need custom handling.
