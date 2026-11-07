# Getting Started

This guide will walk you through installing BatchJS and building your first pipeline.

## Installation

```bash
npm install batchjs
```

## Basic Concepts

BatchJS is built around three core concepts:

- **Jobs** – A container for a series of steps. Jobs manage the lifecycle and execution order.
- **Steps** – A unit of work that reads data from a source, processes it through one or more transforms, and writes the result to a destination.
- **Streams** – Node.js streams are used for data flow. BatchJS provides many utility stream classes for common operations.

## Your First Job

Here's a complete example that reads some strings, converts them to uppercase, and prints them:

```typescript
import { Job, StepBuilder, Readable, Writable, Transform } from 'batchjs';

// Build a step
const step = new StepBuilder('uppercase')
  .reader(() => Readable.from(['hello', 'world'], { objectMode: true }))
  .processors(() => [
    new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        this.push(chunk.toUpperCase());
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

// Define a job
class MyJob extends Job {
  protected _steps() {
    return [step];
  }
}

// Run
const job = new MyJob('my-job');
job.on('finished', ({ status }) => {
  console.log(`Job finished with status ${status}`);
});
job.run();
```

## Next Steps

- Learn about [Jobs](/guide/jobs) in detail.
- Explore [Steps](/guide/steps) and the StepBuilder.
- Dive into the [Streams](/guide/streams) utilities.