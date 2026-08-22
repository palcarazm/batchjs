# Stream Utilities

BatchJS includes a rich set of ready‑to‑use stream classes to handle common data processing patterns. All these classes operate in `objectMode` and are fully typed.

## Available Streams

### Transformation

- **`BufferStream<T>`** – Batches items into arrays of a fixed size.
- **`CountStream<T>`** – Counts the number of items; outputs a number.
- **`FlatStream<T>`** – Flattens arrays into individual items.
- **`GroupByStream<T>`** – Groups items by a key and outputs arrays per group.
- **`ParallelStream<TInput, TOutput>`** – Processes items concurrently with a limit.

### Filtering

- **`DistinctStream<T, TKey>`** – Removes duplicates based on a key extractor; discards duplicates (with `discard` events).
- **`FilterStream<T>`** – Passes only items that satisfy a predicate; discards others (emits `discard` events).
- **`FirstStream<T>`** – Emits only the first item; discards the rest (with `discard` events).
- **`LastStream<T>`** – Emits only the last item; discards previous ones (with `discard` events).

### Matching & Validation

- **`AllMatchStream<T>`** – Checks if all items satisfy a predicate; outputs a single boolean.
- **`AnyMatchStream<T>`** – Checks if any item satisfies a predicate; outputs a single boolean.
- **`EmptyStream<T>`** – Checks if the stream is empty; outputs a boolean.
- **`HasElementsStream<T>`** – Checks if the stream has at least one element; outputs a boolean.
- **`SingleStream<T>`** – Ensures the stream has exactly one item; emits an error otherwise.

### Utility

- **`ReplayStream<T>`** – Buffers all items and provides a `replay()` method to re‑emit them after the stream ends.

## Discard Events

Streams that extend `DiscardingInternalBufferDuplex` or `DiscardingSingleObjectDuplex` emit a `discard` event for each item that is filtered out, duplicated, or otherwise not passed through.

```typescript
const filter = new FilterStream<string>({ filter: (s) => s.length > 3 });
filter.on('discard', (chunk) => console.log(`Discarded: ${chunk}`));
```

## Combining Streams

The `StreamUtils` class provides two static helpers:

- **`mergeStreams(streams, options)`** – Merges multiple readable streams into one.
- **`splitStreams(streams, options)`** – Splits a single writable stream into multiple writers, broadcasting each chunk to all.

```typescript
import { StreamUtils, Readable, Writable } from 'batchjs';

const merged = StreamUtils.mergeStreams([stream1, stream2]);
const splitter = StreamUtils.splitStreams([writable1, writable2]);
source.pipe(splitter);
```

## Example: Filtering and Batching

```typescript
import { FilterStream, BufferStream, Readable, pipeline } from 'stream';

const source = Readable.from([1, 2, 3, 4, 5], { objectMode: true });
const filter = new FilterStream<number>({ filter: (x) => x % 2 === 0 });
const buffer = new BufferStream<number>({ batchSize: 2 });

pipeline(
  source,
  filter,
  buffer,
  new Writable({
    objectMode: true,
    write(chunk, enc, cb) {
      console.log(chunk);
      cb();
    },
  }),
  (err) => { if (err) console.error(err); }
);
```
```shell
>> [2, 4]
```


See the [API Reference](../api/streams/index.md) for detailed usage.