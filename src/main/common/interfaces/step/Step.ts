import { Readable, Duplex, Writable } from "node:stream";
import { RunnableStatus } from "../RunnableStatus";
import { StepCancelledError } from "../../errors/_index";

/**
 * @abstract
 * @class
 * Abstract base class for all steps.
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
 * step.run()
 *     .then(() => {
 *         console.log("Step completed successfully");
 *     })
 *     .catch((error) => {
 *         console.log("Step completed with errors");
 *     });
 * ```
 * ```shell
 * >> Step completed successfully
 * ```
 */
export abstract class Step {
    public readonly name:string;
    public readonly params:object;
    private _status:RunnableStatus;
    private _readerInstance?:Readable;
    private _processorsInstances?:Duplex[];
    private _writerInstance?:Writable;

    /**
     * @param {string} name - The name to assign to the Step.
     * @param {object} params - The parameters to pass to the step.
     */
    constructor(name:string,params:object={}) {
        this.name = name;
        this.params = params;
        this._status = RunnableStatus.CREATED;
    }

    /**
     * The current status of the step.
     * @readonly
     * @type {RunnableStatus}
     */
    get status():RunnableStatus {
        return this._status;
    }

    /**
     * Whether the step is currently running.
     * @readonly
     * @type {boolean}
     */
    get isRunning():boolean {
        return this._status === RunnableStatus.RUNNING;
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
     * Executes the step by connecting streams, processing data, and listening for events.
     *
     * @return {Promise<void>} A Promise that resolves when the step execution is completed, and rejects if an error occurs.
     */
    public run():Promise<void>{
        this._status = RunnableStatus.RUNNING;
        return new Promise<void>((resolve, reject) => {
            // Reader
            this._readerInstance = this._reader()
                .once("error", (error) => {
                    reject(error);
                });

            // Writer
            this._writerInstance = this._writer()
                .once("error", (error) => {
                    reject(error);
                })
                .once("close", () => {
                    if(this._status === RunnableStatus.CANCELLED) reject(new StepCancelledError(this.name));
                });

            // Assembly processors
            this._processorsInstances = this._processors();
            let assembly:Readable = this._readerInstance;
            for (const processor of this._processorsInstances) {
                processor.once("error", (error) => {
                    reject(error);
                });
                assembly = assembly.pipe(processor);
            }

            // Assembly writer
            assembly.pipe(this._writerInstance)
                .once("finish", () => {
                    this._status = RunnableStatus.COMPLETED;
                    resolve();
                });
        }).catch((error) => {
            if(this._status === RunnableStatus.RUNNING) this._status = RunnableStatus.FAILED;
            throw error;
        }).finally(() => {
            this.destroy();
        });
    }

    /**
     * Cancel the execution of the step.
     * @returns {void}
     */
    public cancel():void {
        if(!this.isRunning) return;
        this._status = RunnableStatus.CANCELLED;
        this.destroy();
    }

    /**
     * Destroys all resources associated with the step if it's in a final state.
     * It's automatically called when the step is cancelled and once run promises are settled (resolve or reject).
     * @returns {void}
     * @protected
     */
    protected destroy():void {
        if(this._status === RunnableStatus.CREATED || this._status === RunnableStatus.RUNNING) return;
        this._readerInstance?.destroy();
        this._writerInstance?.destroy();
        for (const processor of this._processorsInstances ?? []) {
            processor.destroy();
        }
    }
}