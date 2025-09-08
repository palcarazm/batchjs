# Common API

In this documentation, we will focus on the common API. This module includes the core of BatchJS. This API allows you to create your own custom jobs and steps using the common interface.

------------

<!--Auto generated Documentation PLEASE DO NOT MODIFY THIS FILE. MODIFY THE JSDOC INSTEAD-->

## Table of Contents

  - [Job](#job)
  - [JobListener](#joblistener)
  - [JobLogger](#joblogger)
  - [JobMeter](#jobmeter)
  - [JobTimer](#jobtimer)
  - [Step](#step)

## Job

`abstract` `extends EventEmitter` 

Abstract base class for all jobs.



### Examples

```typescriptexport class JobImplementation extends Job {    protected _steps() {        return [new PassingStepFirst(), new PassingStepSecond()];    }}const job = new JobImplementation("My job");job.on("stepStart", (step:step) => {    console.log(`Starting step ${step.name}`);})job.run()    .then(() => {        console.log("Job completed successfully");    })    .catch((error) => {        console.log("Job completed with errors");    });``````shell>> Starting step PassingStepFirst>> Starting step PassingStepSecond>> Job completed successfully```

  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **name** | The name to assign to the Step. | string |
  | **params** | The parameters to pass to the job. | object |
  | **options** | An optional options object. | JobOptions |



### _steps (function)

`protected` `static` `abstract` 

Abstract method that most be implemented by the job in order to returns an ordered array of steps that make up the job.

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
  | **event** |  | start, end, stepStart, stepEnd |
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
  | **event** |  | start, end, stepStart, stepEnd |
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
  | **event** |  | start, end, stepStart, stepEnd |
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
  | **event** |  | start, end, stepStart, stepEnd |
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
  | **event** |  | start, end, stepStart, stepEnd |
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
  | **event** |  | start, end, stepStart, stepEnd |
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
  | **event** |  | start, end, stepStart, stepEnd |
  | **listener** |  | function |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | this | allowing to chain |


## JobListener



Class responsible for listening to the events of a job and dispatching them to handle timers, metrics and logging.



  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **job** | The job to listen to. |  |
  | **logger** | The logger to use for logging. If not given, no logging will be done. |  |



## JobLogger



Class responsible for logging the events of a job.



  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **logger** | The logger to use for logging. | Logger |
  | **jobName** | The name of the job to log. | string |



### start (function)



Log the start of a job.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **jobParams** | The parameters passed to the job. |  |


### finish (function)



Log the end of a job.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **jobStatus** | The final status of the job. |  |
  | **duration** | The duration of the job in milliseconds. |  |


### StepStart (function)



Log the start of a step.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **stepName** | The name of the step that started. |  |
  | **stepParams** | The parameters passed to the step. |  |


### StepError (function)



Log an error that occurred in a step.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **stepName** | The name of the step that produced the error. |  |
  | **stepStatus** | The status of the step that produced the error. |  |
  | **error** | The error that occurred. |  |


### StepFinish (function)



Log the end of a step.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **stepName** | The name of the step that finished. |  |
  | **stepStatus** | The status of the step that finished. |  |
  | **duration** | The duration of the step in milliseconds. |  |


## JobMeter



Class responsible for keeping track of the metrics of a job.



  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **jobName** | The name to assign to the Job. | string |
  | **jobStatus** | The status to assign to the Job. | RunnableStatus |



### start (function)



Start a job by setting its status to the given jobStatus.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **jobStatus** | The status to set the job to. |  |


### finish (function)



Finish a job by setting its status to the given jobStatus and its duration to the given duration.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **jobStatus** | The status to set the job to. |  |
  | **duration** | The duration of the job in milliseconds. |  |


### StepStart (function)



Start a step by adding a new entry to the list of steps with the given stepName and stepStatus.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **stepName** | The name to assign to the step. |  |
  | **stepStatus** | The status to assign to the step. |  |


### StepFinish (function)



Finish a step by finding the entry in the list of steps with the given stepName and setting its status to the given stepStatus and its duration to the given duration.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **stepName** | The name of the step to finish. |  |
  | **stepStatus** | The status to set the step to. |  |
  | **duration** | The duration of the step in milliseconds. |  |


## JobTimer



Class responsible for keeping track of the timers of a job.



  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **jobName** | The name of the job. |  |



### nsFrom (function)

`protected` 

Convert a nanosecond duration to milliseconds.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **start** | starting time in nanoseconds |  |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  |  | time in milliseconds |


### getKey (function)

`protected` 

Generates a key for the timer Map.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **type** | Is it a job or a step? |  |
  | **name** | The name of the job or step |  |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  |  | A key that can be used to identify the timer |


### start (function)



Start a timer for a job or step.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **type** | Is it a job or a step? |  |
  | **name** | The name of the job or step |  |


### stop (function)



Stop a timer for a job or step.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **type** | Is it a job or a step? |  |
  | **name** | The name of the job or step |  |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  |  | The time taken to run the job or step in milliseconds, or 0 if the timer was not started. |


## Step

`abstract` 

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
  | **params** | The parameters to pass to the step. | object |



### _reader (function)

`protected` `static` `abstract` 

Abstract method that must be implemented by the step in order to defined the reader stream.

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Readable |  |


### _processors (function)

`protected` `static` `abstract` 

Abstract method that must be implemented by the step in order to process the data from the reader stream and push it to the writer stream.
Processors are defined in an ordered array to be chained on the runner.

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Array.&lt;Duplex&gt; |  |


### _writer (function)

`protected` `static` `abstract` 

Abstract method that must be implemented by the step in order to defined the writer stream.

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Writable |  |


### run (function)



Executes the step by connecting streams, processing data, and listening for events.

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Promise.&lt;void&gt; | A Promise that resolves when the step execution is completed, and rejects if an error occurs. |


