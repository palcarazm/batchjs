# Custom Streams

You can extend the stream classes provided by BatchJS to create your own transformations. The library offers abstract base classes that simplify implementing streams with common patterns.

## Base Classes

All custom streams should extend one of the following:

- **`ObjectDuplex<Tin, Tout>`** – The base for any duplex stream operating in object mode.
- **`InternalBufferDuplex<Tin, Tout>`** – Adds an internal buffer and automatic flushing; handles backpressure.
- **`DiscardingInternalBufferDuplex<Tin, Tout>`** – Extends `InternalBufferDuplex` and adds `discard` event support.
- **`SingleObjectDuplex<Tin, Tout>`** – For streams that produce a single result (e.g., `CountStream`).
- **`DiscardingSingleObjectDuplex<Tin, Tout>`** – Adds `discard` events to `SingleObjectDuplex`.

## Example: A Custom Transform that Adds a Timestamp

```typescript
import { ObjectDuplex, ObjectDuplexOptions, TransformCallback } from 'batchjs';

interface Timestamped<T> {
  value: T;
  timestamp: number;
}

class TimestampStream<T> extends InternalBufferDuplex<T, Timestamped<T>> {
  constructor(options: ObjectDuplexOptions) {
    super(options);
  }

  _write(chunk: T, encoding: BufferEncoding, callback: TransformCallback): void {
    const result: Timestamped<T> = { value: chunk, timestamp: Date.now() };
    this.push(result);
    callback();
  }
}
```

## Best Practices

- Always call `callback()` after processing each chunk.
- Handle errors by emitting an `error` event or calling `callback(error)`.
- Use `this.push(null)` in `_final` to signal the end of the stream.
- If your stream buffers data, consider extending `InternalBufferDuplex` to get automatic flushing and backpressure handling.

Refer to the source code of existing streams (e.g., `FilterStream`, `BufferStream`) for more advanced patterns.