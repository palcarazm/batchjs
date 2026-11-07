---
layout: home

hero:
  name: BatchJS
  text: Stream-based batch processing for Node.js
  tagline: Build robust, composable pipelines with Jobs, Steps, and Streams.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /api

features:
  - title: Simple Job Abstraction
    details: Define jobs as ordered sequences of steps. Each step can read, process, and write data using Node.js streams.
  - title: Dependency free
    details: This framework relay only on Node.js streams.
  - title: Rich Stream Utilities
    details: Built‑in stream transforms for batching, filtering, grouping, deduplication, matching, and more.
  - title: Fully Typed
    details: Written in TypeScript with complete type definitions – get autocompletion and intellisense in your IDE.
---

## What is BatchJS?

BatchJS is a lightweight Node.js library that helps you build batch processing pipelines using a job‑step‑stream model. It leverages native Node.js streams under the hood, providing a highly composable and memory‑efficient way to process data in chunks.

## Quick Example

```typescript
import { Job, StepBuilder, Readable } from 'batchjs';

// Create a simple step using the builder
const step = new StepBuilder('transform')
  .reader(() => Readable.from(['a', 'b', 'c'], { objectMode: true }))
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

// Run the job
const job = new MyJob('my-job');
job.run().then(() => console.log('Done!'));
```

Check out the [Guide](/guide/getting-started) to learn more.