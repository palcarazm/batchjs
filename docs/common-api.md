# Stream API

<!--Auto generated Documentation PLEASE DO NOT MODIFY THIS FILE. MODIFY THE JSDOC INSTEAD-->

## Table of Contents

  - [Job](#job)
  - [Step](#step)

## Job

`Abstract` | `Extends EventEmitter`

Abstract base class for all jobs.



### Examples

```typescriptexport class JobImplementation extends Job {    protected _steps() {        return [new PassingStepFirst(), new PassingStepSecond()];    }}const job = new JobImplementation("My job");job.on("stepStart", (step:step) => {    console.log(`Starting step ${step.name}`);})job.run()    .then(() => {        console.log("Job completed successfully");    })    .catch((error) => {        console.log("Job completed with errors");    });``````shell>> Starting step PassingStepFirst>> Starting step PassingStepSecond>> Job completed successfully```

  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **name** | The name to assign to the Step. | string |



### _steps (function)

`protected` | `Abstract` | 

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Array.&lt;Step&gt; |  |


### run (function)



Asynchronously runs the job by executing each step in sequence.

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Promise.&lt;void&gt; | A Promise that resolves when all steps are successfully executed or rejects if an error occurs. |


### addListener (function)



Adds an event listener to the specified event type.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **event** |  | start | end | stepStart | stepEnd |
  | **listener** |  | function |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | this | allowing to chain |


### emit (function)



Emits an event of the specified type to the listeners.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **event** |  | start | end | stepStart | stepEnd |
  | **args** | Data to sent to the listeners depending on the event type | Array.&lt;JobEventEmitters&gt; |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | boolean |  |


### on (function)



Adds an event listener to the specified event type.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **event** |  | start | end | stepStart | stepEnd |
  | **listener** |  | function |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | this | allowing to chain |


### once (function)



Adds a one time event listener to the specified event type.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **event** |  | start | end | stepStart | stepEnd |
  | **listener** |  | function |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | this | allowing to chain |


### prependListener (function)



Adds an event listener to the specified event type to the beginning of the listeners array.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **event** |  | start | end | stepStart | stepEnd |
  | **listener** |  | function |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | this | allowing to chain |


### prependOnceListener (function)



Adds a one time event listener to the specified event type to the beginning of the listeners array.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **event** |  | start | end | stepStart | stepEnd |
  | **listener** |  | function |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | this | allowing to chain |


### removeListener (function)



Removes an event listener to the specified event type.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **event** |  | start | end | stepStart | stepEnd |
  | **listener** |  | function |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | this | allowing to chain |


## Step

`Abstract` | 

Abstract base class for all steps.



### Examples

```typescriptclass StepImplementation extends Step {
    constructor(name: string = "MockPassingStep") {
        super(name);
    }

    protected _reader() {
        return new Readable({
            objectMode: true,
            read() {
                this.push("data");
                this.push(null);
            }
        });
    }

    protected _processors() {
        const opts: TransformOptions = {
            objectMode: true,
            transform(chunk: unknown, encoding: BufferEncoding, callback: TransformCallback) {
                this.push(chunk);
                callback();
            }
        };
        return [new Transform(opts), new Transform(opts)];
    }

    protected _writer() {
        return new Writable({
            objectMode: true,
            write(chunk: unknown, encoding: BufferEncoding, callback: TransformCallback) {
                callback();
            }
        });
    }
}const step = new StepImplementation("StepImplementation");step.run()    .then(() => {        console.log("Step completed successfully");    })    .catch((error) => {        console.log("Step completed with errors");    });``````shell>> Step completed successfully```

  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **name** | The name to assign to the Step. | string |



### run (function)



Executes the step by connecting streams, processing data, and listening for events.

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Promise.&lt;void&gt; | A Promise that resolves when the step execution is completed, and rejects if an error occurs. |


