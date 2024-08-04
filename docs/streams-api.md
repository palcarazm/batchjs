# Stream API

In this documentation, we will focus on the streams API. This module includes some useful utilities for working with streams to implements parts of your custom steps.

------------

<!--Auto generated Documentation PLEASE DO NOT MODIFY THIS FILE. MODIFY THE JSDOC INSTEAD-->

## Table of Contents

  - [AllMatchStream](#allmatchstream)
  - [AnyMatchStream](#anymatchstream)
  - [BufferStream](#bufferstream)
  - [CountStream](#countstream)
  - [DistinctStream](#distinctstream)
  - [EmptyStream](#emptystream)
  - [FilterStream](#filterstream)
  - [FirstStream](#firststream)
  - [FlatStream](#flatstream)
  - [GroupByStream](#groupbystream)
  - [HasElementsStream](#haselementsstream)
  - [LastStream](#laststream)
  - [ParallelStream](#parallelstream)
  - [ReplayStream](#replaystream)
  - [SingleStream](#singlestream)
  - [DiscardingStream](#discardingstream)
  - [ObjectDuplex](#objectduplex)
  - [StreamUtils](#streamutils)

## AllMatchStream

`extends DiscardingStream` 

Class that allows you to validate that all elements in a stream match a given condition.



### Examples

```typescriptconst stream:AllMatchStream<string> = new AllMatchStream({    objectMode: true,    matcher: (chunk: string) => chunk.length > 2});stream.write("first"); // matchstream.write("second"); // matchstream.write("3"); // not matchstream.end();stream.on("data", (chunk: boolean) => {    console.log(``Result: ${chunk}```);});``````shell>> Result: false```

  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **options** | The options for the AllMatchStream. | AllMatchStreamOptions |
  | **options.matcher** | The function that will be used to validate the chunk. | function |



### _write (function)



A method to write data to the stream, filter the chunk and push it to the buffer or discard it, and execute the callback.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **chunk** | The data chunk to write to the stream. | T |
  | **encoding** | The encoding of the data. | BufferEncoding |
  | **callback** | The callback function to be executed after writing the data. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


### _final (function)



Finalizes the stream by pushing the true if all chunks match the condition and false otherwise, if not already pushed.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **callback** | The callback function to be executed after finalizing the stream. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


### _read (function)



Push once false if at least one chunk has not matched.

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void |  |


## AnyMatchStream

`extends DiscardingStream` 

Class that allows you to validate that all elements in a stream match a given condition.



### Examples

```typescriptconst stream:AnyMatchStream<string> = new AnyMatchStream({    objectMode: true,    matcher: (chunk: string) => chunk.length > 2});stream.write("1"); // not matchstream.write("2"); // not matchstream.write("third"); // matchstream.end();stream.on("data", (chunk: boolean) => {    console.log(``Result: ${chunk}```);});``````shell>> Result: false```

  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **options** | The options for the AnyMatchStream. | AnyMatchStreamOptions |
  | **options.matcher** | The function that will be used to validate the chunk. | function |



### _write (function)



A method to write data to the stream, filter the chunk and push it to the buffer or discard it, and execute the callback.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **chunk** | The data chunk to write to the stream. | T |
  | **encoding** | The encoding of the data. | BufferEncoding |
  | **callback** | The callback function to be executed after writing the data. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


### _final (function)



Finalizes the stream by pushing the true if any chunk match the condition and false otherwise, if not already pushed.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **callback** | The callback function to be executed after finalizing the stream. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


### _read (function)



Push once false if at least one chunk has matched.

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void |  |


## BufferStream

`extends ObjectDuplex` 

Class that allows you  stream data in batches of a specified size.



### Examples

```typescriptconst stream:BufferStream<string> = new BufferStream({    objectMode: true,    batchSize: 2,});stream.write("data1");stream.write("data2");stream.write("data3");stream.end();stream.on("data", (chunk: Array<string>) => {    console.log(``Pushed chunk: ${JSON.stringify(chunk)}```);});``````shell>> Pushed chunk: ["data1", "data2"]>> Pushed chunk: ["data3"]```

  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **options** | The options for the BufferStream. | BufferStreamOptions |
  | **options.batchSize** | The maximum number of elements in a batch. | number |



### _write (function)



A method to write data to the stream, push the chunk to the buffer, and execute the callback.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **chunk** | The data chunk to write to the stream. | T |
  | **encoding** | The encoding of the data. | BufferEncoding |
  | **callback** | The callback function to be executed after writing the data. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


### _final (function)



Finalizes the stream by pushing remaining data batches, handling errors,
and executing the final callback.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **callback** | The callback function to be executed after finalizing the stream. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


### _read (function)



Pushes the ready chunks to the consumer stream since the buffer is empty or the size limit is reached.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **size** | The size parameter for controlling the read operation. | number |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


## CountStream

`extends ObjectDuplex` 

Class that allows you to count the number of chunks in a stream.



### Examples

```typescriptconst stream:CountStream<string> = new CountStream({    objectMode: true,});stream.write("data1");stream.write("data2");stream.write("data3");stream.end();stream.on("data", (chunk: number) => {    console.log(``Received chunks: ${chunk}```);});``````shell>> Received chunks: 3```

  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **options** | The options for the GroupBy. | ObjectDuplexOptions |



### _write (function)



Writes a chunk of data to the stream, groups it according to a specified function,
and executes the callback.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **chunk** | The data chunk to write to the stream. | T |
  | **encoding** | The encoding of the data. | BufferEncoding |
  | **callback** | The callback function to be executed after writing the data. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void |  |


### _final (function)



Finalize the stream by draining the buffer and pushing the count of chunks to the stream.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **callback** | The callback to be called when the stream is finalized. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void |  |


### _read (function)



Reading is not supported since writer finishes first.

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void |  |


## DistinctStream

`extends DiscardingStream` 

Class that allows you to discard repeated data in a stream in base on a key.
Data with duplicated key will be emitted through the discard event.



### Examples

```typescriptconst stream:DistinctStream<string,string> = new DistinctStream({    objectMode: true,    keyExtractor: (chunk: string) => chunk,});stream.write("data1");stream.write("data2");stream.write("data1"); //Duplicatedstream.end();stream.on("data", (chunk: string) => {    console.log(``Pushed chunk: ${chunk}```);});stream.on("discard", (chunk: string) => {    console.log(``Duplicated chunk: ${chunk}```);});``````shell>> Pushed chunk: data1>> Pushed chunk: data2>> Duplicated chunk: data1```

  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **options** | The options for the FilterStream. | DistinctStreamOptions |
  | **options.keyExtractor** | The key extractor function for determining the key of the data to be filtered. | function |



### _write (function)



A method to write data to the stream, get the key of the data, and if the key is not in the set, push the data to the buffer, otherwise discard it.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **chunk** | The data chunk to write to the stream. | TInput |
  | **encoding** | The encoding of the data. | BufferEncoding |
  | **callback** | The callback function to be executed after writing the data. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


### _final (function)



Finalizes the stream by pushing remaining data, handling errors,
and executing the final callback.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **callback** | The callback function to be executed after finalizing the stream. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


### _read (function)



Pushes the ready chunks to the consumer stream since the buffer is empty or the size limit is reached.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **size** | The size parameter for controlling the read operation. | number |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


## EmptyStream

`extends Duplex` 

Class that allows you to validate that a stream is empty.



### Examples

```typescriptconst stream:EmptyStream<string> = new EmptyStream({    objectMode: true,});stream.write("first"); // not emptystream.end();stream.on("data", (chunk: boolean) => {    console.log(``Result: ${chunk}```);});``````shell>> Result: false```

  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **options** | The options for the EmptyStream. | ObjectDuplexOptions |



### _write (function)



A method to write data to the stream, setting the hasChunks flag to true, and execute the callback.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **chunk** | The data chunk to write to the stream. | T |
  | **encoding** | The encoding of the data. | BufferEncoding |
  | **callback** | The callback function to be executed after writing the data. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


### _final (function)



Finalizes the stream by pushing the true if the stream is empty and false otherwise, if not already pushed.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **callback** | The callback function to be executed after finalizing the stream. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


### _read (function)



Push once false if at least one chunk has been received.

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void |  |


## FilterStream

`extends DiscardingStream` 

Class that allows you to filter data in a stream.



### Examples

```typescriptconst stream:FilterStream<string> = new FilterStream({    objectMode: true,    filter: (chunk: string) => chunk === "data1" || chunk === "data2",});stream.write("data1");stream.write("data2");stream.write("data3");// Discardedstream.end();stream.on("data", (chunk: string) => {    console.log(``Pushed chunk: ${chunk}```);});stream.on("discard", (chunk: string) => {    console.log(``Discarded chunk: ${chunk}```);});``````shell>> Pushed chunk: data1>> Pushed chunk: data2>> Discarded chunk: data3```

  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **options** | The options for the FilterStream. | FilterStreamOptions |
  | **options.filter** | The filter function for pushing data to the stream or discarding it. | function |



### _write (function)



A method to write data to the stream, filter the chunk and push it to the buffer or discard it, and execute the callback.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **chunk** | The data chunk to write to the stream. | T |
  | **encoding** | The encoding of the data. | BufferEncoding |
  | **callback** | The callback function to be executed after writing the data. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


### _final (function)



Finalizes the stream by pushing remaining data, handling errors,
and executing the final callback.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **callback** | The callback function to be executed after finalizing the stream. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


### _read (function)



Pushes the ready chunks to the consumer stream since the buffer is empty or the size limit is reached.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **size** | The size parameter for controlling the read operation. | number |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


## FirstStream

`extends DiscardingStream` 

Class that allows you to emit only the first chunk in a stream and discard the rest.



### Examples

```typescriptconst stream:FirstStream<string> = new FirstStream({    objectMode: true,    matcher: (chunk: string) => chunk.length > 2});stream.write("first");stream.write("second");// Discardedstream.write("third");// Discardedstream.end();stream.on("data", (chunk: string) => {    console.log(``Pushed chunk: ${chunk}```);});stream.on("discard", (chunk: string) => {    console.log(``Discarded chunk: ${chunk}```);});``````shell>> Pushed chunk: first>> Discarded chunk: second>> Discarded chunk: third```

  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **options** | The options for the FirstStream. | ObjectDuplexOptions |



### _write (function)



A method to write data to the stream, save first chunk and discard the rest, and execute the callback.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **chunk** | The data chunk to write to the stream. | T |
  | **encoding** | The encoding of the data. | BufferEncoding |
  | **callback** | The callback function to be executed after writing the data. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


### _final (function)



Finalizes the stream by pushing the first chunk if it exists and not pushed, handling errors,
and executing the final callback.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **callback** | The callback function to be executed after finalizing the stream. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


### _read (function)



Pushes the first chunk, if it exists and not pushed, to the consumer stream and marks it as pushed.

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


## FlatStream

`extends ObjectDuplex` 

Class that allows you to transform an array stream into a flat stream.



### Examples

```typescriptconst stream:FlatStream<string> = new FlatStream({    objectMode: true,    matcher: (chunk: string) => chunk.length > 2});stream.write(["data1", "data2"]);stream.write(["data3"]);stream.end();stream.on("data", (chunk: string) => {    console.log(``Pushed chunk: ${chunk}```);});``````shell>> Pushed chunk: data1>> Pushed chunk: data2>> Pushed chunk: data3```

  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **options** | The options for the FlatStream. | ObjectDuplexOptions |



### _write (function)



A method to write data to the stream, push the chunk to the buffer, and execute the callback.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **chunk** | The data chunk to write to the stream. | Array.&lt;T&gt; |
  | **encoding** | The encoding of the data. | BufferEncoding |
  | **callback** | The callback function to be executed after writing the data. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


### _final (function)



Finalizes the stream by pushing remaining data, handling errors,
and executing the final callback.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **callback** | The callback function to be executed after finalizing the stream. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


### _read (function)



Pushes the ready chunks to the consumer stream since the buffer is empty or the size limit is reached.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **size** | The size parameter for controlling the read operation. | number |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


## GroupByStream

`extends ObjectDuplex` 

Class that allows you to group data in a stream.



### Examples

```typescriptconst stream:GroupByStream<string> = new GroupByStream({    objectMode: true,    groupBy: (chunk: string) => chunk.split("").at(0) ?? "",});stream.write("DATA1"); //group : Dstream.write("DATA2"); //group : Dstream.write("data3"); //group : dstream.end();stream.on("data", (chunk: Array<string>) => {    console.log(``Pushed chunk: ${chunk}```);});``````shell>> Pushed chunk: ["DATA1", "DATA2"]>> Pushed chunk: ["data3"]```

  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **options** | The options for the GroupBy. | GroupByStreamOptions.&lt;T&gt; |
  | **options.groupBy** | The function used to get the grouping key from the chunk. | function |



### _write (function)



Writes a chunk of data to the stream, groups it according to a specified function,
and executes the callback.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **chunk** | The data chunk to write to the stream. | T |
  | **encoding** | The encoding of the data. | BufferEncoding |
  | **callback** | The callback function to be executed after writing the data. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void |  |


### _final (function)



Finalize the stream by draining the buffer and pushing any remaining chunks to the stream.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **callback** | The callback to be called when the stream is finalized. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void |  |


### _read (function)



Reading is not supported since writer finishes first.

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void |  |


### _groupBy (function)



Groups a chunk of data based on the provided groupBy function and stores it in the buffer.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **chunk** | The data chunk to be grouped. | T |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


## HasElementsStream

`extends ObjectDuplex` 

Class that allows you to validate that a stream has elements.



### Examples

```typescriptconst stream:HasElementsStream<string> = new HasElementsStream({    objectMode: true,});stream.write("first"); // not emptystream.end();stream.on("data", (chunk: boolean) => {    console.log(``Result: ${chunk}```);});``````shell>> Result: false```

  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **options** | The options for the HasElementsStream. | ObjectDuplexOptions |



### _write (function)



A method to write data to the stream, setting the hasChunks flag to true, and execute the callback.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **chunk** | The data chunk to write to the stream. | T |
  | **encoding** | The encoding of the data. | BufferEncoding |
  | **callback** | The callback function to be executed after writing the data. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


### _final (function)



Finalizes the stream by pushing the true if the stream has elements and false otherwise, if not already pushed.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **callback** | The callback function to be executed after finalizing the stream. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


### _read (function)



Push once true if at least one chunk has been received.

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void |  |


## LastStream

`extends DiscardingStream` 

Class that allows you to emit only the last chunk in a stream and discard the rest.



### Examples

```typescriptconst stream:LastStream<string> = new LastStream({    objectMode: true,});stream.write("first"); //Discardedstream.write("second"); //Discardedstream.write("third");stream.end();stream.on("data", (chunk: boolean) => {    console.log(``Pushed chunk: ${chunk}```);});stream.on("discard", (chunk: boolean) => {    console.log(``Discarded chunk: ${chunk}```);});``````shell>> Discarded chunk: first>> Discarded chunk: second>> Pushed chunk: third```

  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **options** | The options for the LastStream. | ObjectDuplexOptions |



### _write (function)



A method to write data to the stream, save last chunk and discard the rest, and execute the callback.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **chunk** | The data chunk to write to the stream. | T |
  | **encoding** | The encoding of the data. | BufferEncoding |
  | **callback** | The callback function to be executed after writing the data. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


### _final (function)



Finalizes the stream by pushing the last chunk if it exists, handling errors,
and executing the final callback.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **callback** | The callback function to be executed after finalizing the stream. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


### _read (function)



Reading is not supported since writer finishes first.

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void |  |


## ParallelStream

`extends ObjectDuplex` 

Class that allows you to transform and stream data in parallel.



### Examples

```typescriptconst stream:ParallelStream<string,string> = new ParallelStream({    objectMode: true,    maxConcurrent: 2,    transform(chunk: string) {        return Promise.resolve(chunk.toUpperCase());    },});stream.write("data1");stream.write("data2");stream.write("data3");stream.end();stream.on("data", (chunk: string) => {    console.log(``Pushed chunk: ${chunk}```);});``````shell>> Pushed chunk: DATA1>> Pushed chunk: DATA2>> Pushed chunk: DATA3```

  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **options** | The options for the ParallelStream. | ParallelStreamOptions.&lt;TInput, TOutput&gt; |
  | **options.maxConcurrent** | The maximum number of concurrent promises. | number |
  | **options.transform** | The function to transform the data returning a promise. | function |



### _write (function)



A method to write data to the stream, push the chunk to the queue, transform it, and then execute the callback.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **chunk** | The data chunk to write to the stream. | TInput |
  | **encoding** | The encoding of the data. | BufferEncoding |
  | **callback** | The callback function to be executed after writing the data. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


### _final (function)



Asynchronously finalizes the stream by draining the queue and buffer, pushing any remaining chunks to the stream,
and calling the provided callback when complete. If the stream is unable to push a chunk, the chunk is placed back
into the buffer and a PushError is passed to the callback.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **callback** | The callback to be called when the stream is finalized. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Promise.&lt;void&gt; | A promise that resolves when the stream is finalized. |


### _read (function)



Pushes the ready chunks to the consumer stream since the buffer is empty or the size limit is reached.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **size** | The size parameter for controlling the read operation. | number |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


### _transform (function)



Loop through the pool and queue to process chunks, adding promises to the pool.


## ReplayStream

`extends ObjectDuplex` 

Class that allows you to remit chunks from a stream when the source is finished.



### Examples

```typescriptconst stream:ReplayStream<string> = new ReplayStream({    objectMode: true,});stream.write("data1");stream.write("data2");stream.write("data3");stream.end();stream.on("data", (chunk: string) => {    console.log(``Pushed chunk: ${chunk}```);}).on("close", () => {    stream.replay().on("data", (chunk: string) => {        console.log(`Replayed chunk: ${chunk}`);    });});``````shell>> Pushed chunk: data1>> Pushed chunk: data2>> Pushed chunk: data3>> Replayed chunk: data1>> Replayed chunk: data2>> Replayed chunk: data3```

  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **options** | The options for the ReplayStream. | ObjectDuplexOptions |
  | **options.objectMode** | Whether the stream should operate in object mode. | true |



### _write (function)



A method to write data to the stream, push the chunk to the buffer, and execute the callback.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **chunk** | The data chunk to write to the stream. | T |
  | **encoding** | The encoding of the data. | BufferEncoding |
  | **callback** | The callback function to be executed after writing the data. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


### _final (function)



Finalizes the stream by pushing remaining data, handling errors,
and executing the final callback.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **callback** | The callback function to be executed after finalizing the stream. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


### _read (function)



Pushes the ready chunks to the consumer stream since all the buffer is pushed or the size limit is reached.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **size** | The size parameter for controlling the read operation. | number |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


### replay (function)



Creates a readable stream from the buffer to replay the data that have been pushed.

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Readable | The replay stream. |


## SingleStream

`extends ObjectDuplex` 

Class that allows you to verify that a stream contains only one chunk.



### Examples

```typescriptconst stream:SingleStream<string> = new SingleStream({    objectMode: true,});stream.write("data1");stream.write("data2"); // This should launch errorstream.end();stream.on("data", (chunk: string) => {    console.log(``Pushed chunk: ${chunk}```);});stream.once("error", (err: SingleStreamError) => {    console.log(``Error: ${err.message}```);});``````shell>> Pushed chunk: data1>> Error: Expected only one chunk in the stream```

  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **options** | The options for the SingleStream. | ObjectDuplexOptions |



### _write (function)



A method to write data to the stream, push the chunk to the buffer if its the first chunk, otherwise discard it, and execute the callback.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **chunk** | The data chunk to write to the stream. | T |
  | **encoding** | The encoding of the data. | BufferEncoding |
  | **callback** | The callback function to be executed after writing the data. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


### _final (function)



Finalizes the stream by pushing remaining data, handling errors,
and executing the final callback.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **callback** | The callback function to be executed after finalizing the stream. | TransformCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


### _read (function)



Pushes the ready chunks to the consumer stream since the buffer is empty or the size limit is reached.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **size** | The size parameter for controlling the read operation. | number |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | void | This function does not return anything. |


## DiscardingStream

`abstract` `extends ObjectDuplex` 

Abstract class that allows you to emit discarded data in a stream adding support to discard events.



### Examples

```typescriptclass DiscardingStreamImplementation<T> extends DiscardingStream<T> {    constructor(){        super({objectMode: true});    }    _write(chunk: T, encoding: BufferEncoding, callback: TransformCallback): void {        this.emit("discard", chunk);        callback();    }    _final(callback: TransformCallback): void {        this.push(null);        callback();    }    _read(): void {}}const stream:DiscardingStreamImplementation<string> = new DiscardingStreamImplementation();stream.write("data1"); //Discardedstream.write("data2"); //Discardedstream.write("data3"); //Discardedstream.end();stream.on("discard", (chunk: string) => {    console.log(``Discarded chunk: ${chunk}```);});``````shell>> Discarded chunk: data1>> Discarded chunk: data2>> Discarded chunk: data3```

  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **options** | The options for the GroupBy. | ObjectDuplexOptions |



## ObjectDuplex

`abstract` `extends Duplex` 

Abstract class that handle data in a stream in object mode.



  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **options** | The options for the ObjectDuplex. | ObjectDuplexOptions |
  | **options.objectMode** | Whether the stream should operate in object mode. | true |



## StreamUtils

`abstract` 

Utility class for streams exposing static methods.



### mergeStreams (function)

`static` 

Merges multiple readable streams into a single duplex stream.

#### Examples

```typescript const streams: Array<Readable> = [     Readable.from(["a","b"],{objectMode: true}),     Readable.from(["c"],{objectMode: true}),     Readable.from(["d","e"],{objectMode: true}) ]; const merged: Readable = StreamUtils.mergeStreams(streams,{objectMode: true}); merged.on("data", (chunk: string) => {     console.log(`Received chunk: ${chunk}`); });``````shell>> Received chunk: a>> Received chunk: b>> Received chunk: c>> Received chunk: d>> Received chunk: e```

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **streams** | An array of readable streams to merge. | Array.&lt;Readable&gt; |
  | **options** | The options for the Readable stream. | ReadableOptions |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Readable | A readable stream that combines the input streams. |


### splitStreams (function)

`static` 

Returns a stream that split the input stream into multiple writable streams.

#### Examples

```typescript const streams: Array<Writable> = [   new Writable({     objectMode: true},     write(chunk: unknown, encoding: BufferEncoding, callback: TransformCallback) {       console.log(`Writer 1 - Received chunk: ${chunk}`);       callback();     }   }),   new Writable({     objectMode: true},     write(chunk: unknown, encoding: BufferEncoding, callback: TransformCallback) {       console.log(`Writer 1 - Received chunk: ${chunk}`);       callback();     }   }), ]; const splitter: Writable = StreamUtils.splitStreams(streams); splitter.write("a"); splitter.write("b"); splitter.write("c"); splitter.end();``````shell>> Writer 1 - Received chunk: a>> Writer 2 - Received chunk: a>> Writer 1 - Received chunk: b>> Writer 2 - Received chunk: b>> Writer 1 - Received chunk: c>> Writer 2 - Received chunk: c```

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **streams** | An array of writable streams to send the input stream. | Array.&lt;Writable&gt; |
  | **options** | The options for the Writable stream. | WritableOptions |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Writable | A splitter stream that sends the input stream to the provided writable streams. |


