import { Readable, Duplex, Writable } from "node:stream";
import { Runnable , RunnableStatus } from "../runnable/_index";
import { StepEventMap } from "./StepEvents";
import { StepCancelledError } from "../../errors/_index";

/**
 * @abstract
 * @class
 * Abstract base class for all steps.
 * @extends {@link Runnable<StepEventMap>}
 * @example
 * ```typescript
 * class StepImplementation extends Step {
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
}
 * const step = new StepImplementation("StepImplementation");
 * step.on("started", () => console.log("Step started"));
 * step.on("completed", () => console.log("Step completed"));
 * step.run();
 * ```
 * ```shell
 * >> Step started
 * >> Step completed
 * ```
 */
export abstract class Step extends Runnable<StepEventMap> {
    private _readerInstance?:Readable;
    private _processorsInstances?:Duplex[];
    private _writerInstance?:Writable;

    /**
     * @param {string} name - The name to assign to the Step.
     * @param {Record<string, unknown>} params - The parameters to pass to the step.
     */
    constructor(name:string,params:Record<string, unknown> ={}) {
        super(name, params);
    }
    
    /**
     * @abstract
     * Abstract method that must be implemented by the step in order to defined the reader stream.
     * @returns {Readable}
     * @protected
     */
    protected abstract _reader():Readable;

    /**
     * @abstract
     * Abstract method that must be implemented by the step in order to process the data from the reader stream and push it to the writer stream.
     * Processors are defined in an ordered array to be chained on the runner.
     * @returns {Array<Duplex>}
     * @protected
     */
    protected abstract _processors():Array<Duplex>;

    /**
     * @abstract
     * Abstract method that must be implemented by the step in order to defined the writer stream.
     * @returns {Writable}
     * @protected
     */
    protected abstract _writer():Writable;

    /**
     * Hook called during transition to RUNNING.
     * Builds the stream pipeline and launches it asynchronously.
     * @returns {Promise<{ cancelled: boolean; reason?: string; executionPromise: Promise<void> }>}
     */
    protected async doRun(): Promise<{ cancelled: boolean; reason?: string, executionPromise: Promise<void> }> {
        this._readerInstance = this._reader();
        this._processorsInstances = this._processors();
        this._writerInstance = this._writer();

        const executionPromise = new Promise<void>((resolve, reject) => {
            this._readerInstance!.once("error", (error) => {
                reject(error);
            });
            this._writerInstance!.once("close", () => {
                if (this.isCancelled || this.transitioningTo === RunnableStatus.CANCELLED) {
                    reject(new StepCancelledError(this.name));
                }
            }).once("error", (error) => {
                reject(error);
            });

            let assembly: Readable = this._readerInstance!;
            for (const processor of this._processorsInstances!) {
                processor.once("error", (error) => {
                    reject(error);
                });
                assembly = assembly.pipe(processor);
            }
            assembly.pipe(this._writerInstance!);

            assembly
                .once("finish", () => {
                    resolve();
                });
        }).then(() => {
            return this.transitionTo(RunnableStatus.COMPLETED);
        }).catch((error) => {
            if (this.isRunning && this.transitioningTo === undefined) {
                return this.transitionTo(RunnableStatus.FAILED, error)
                    .finally(() => { throw error; });
            }
            throw error;
        });

        return { cancelled: false, executionPromise };
    }

    /**
     * Hook called during transition to COMPLETED.
     * Destroys all streams.
     * @returns {Promise<{ cancelled: boolean; reason?: string }>}
     */
    protected async doComplete(): Promise<{ cancelled: boolean; reason?: string }> {
        this.destroy();
        return { cancelled: false };
    }

    /**
     * Hook called during transition to FAILED.
     * Destroys all streams.
     * @param {Error} _error - The error that caused the failure.
     * @returns {Promise<{ cancelled: boolean; reason?: string }>}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected async doFail(_error: Error): Promise<{ cancelled: boolean; reason?: string }> {
        this.destroy();
        return { cancelled: false };
    }

    /**
     * Hook called during transition to CANCELLED.
     * Destroys all streams.
     * @returns {Promise<{ cancelled: boolean; reason?: string }>}
     */
    protected async doCancel(): Promise<{ cancelled: boolean; reason?: string }> {
        this.destroy();
        return { cancelled: false };
    }

    /**
     * Destroys all resources associated with the step.
     * Called automatically on completion, failure, or cancellation.
     * @returns {void}
     * @protected
     */
    protected destroy(): void {
        if (this.isCreated || (this.isRunning && this.transitioningTo === undefined)) {
            return;
        }
        this._readerInstance?.destroy();
        this._writerInstance?.destroy();
        for (const processor of this._processorsInstances ?? []) {
            processor.destroy();
        }
    }
}