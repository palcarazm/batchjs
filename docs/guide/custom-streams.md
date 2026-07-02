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

## Event System

BatchJS introduces a **typed event system** using the `TypedEventEmitter<TEventMap>` interface. All stream base classes implement this interface, providing type-safe event handling.

### How It Works

Each stream class accepts a `TEventMap` generic parameter:

```typescript
export abstract class ObjectDuplex<
    Tin = any,
    Tout = any,
    TEventMap extends DuplexEventMap<Tout> = DuplexEventMap<Tout>
> extends Duplex implements TypedEventEmitter<TEventMap>
```

The `TEventMap` defines which events the stream can emit and their payload types:

```typescript
interface DuplexEventMap<Tout> {
    close: void;
    error: Error;
    data: Tout;
    end: void;
    pause: void;
    readable: void;
    resume: void;
    drain: void;
    finish: void;
    pipe: Readable;
    unpipe: Readable;
}
```

### Extending with Custom Events

Use `ExtendableDuplexEventMap`, `ExtendableReadableEventMap`, or `ExtendableWritableEventMap` to add custom events:

```typescript
import { ExtendableDuplexEventMap } from 'batchjs';

// Add a "discard" event to a duplex stream
type MyEventMap = ExtendableDuplexEventMap<string, {
    discard: string;
}>;

class MyStream extends ObjectDuplex<string, string, MyEventMap> {
    _write(chunk: string, encoding: BufferEncoding, callback: TransformCallback): void {
        this.emit("discard", chunk); // ✅ Type-safe!
        callback();
    }
}
```

### Event Key Conflicts

The `Extendable*` types **prevent** overriding built-in event keys. If you try to use a reserved key, you'll get a TypeScript error:

```typescript
// ❌ This will produce a type error
type Invalid = ExtendableDuplexEventMap<{ data: string }>;
// Type '{ data: string; }' does not satisfy the constraint 'NoConflict<...>'
```

### All Event Methods Are Typed

All event methods (`on`, `once`, `emit`, `addListener`, `removeListener`, etc.) are fully typed:

```typescript
stream.on("discard", (chunk: string) => {
    console.log(`Discarded: ${chunk}`); // ✅ chunk is typed as string
});

stream.emit("discard", "some-data"); // ✅ Type-safe emit
```
