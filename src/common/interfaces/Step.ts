import { Readable, Duplex, Writable } from "stream";

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
    readonly name:string;

    /**
     * @constructor
     * @param {string} name - The name to assign to the Step.
     */
    constructor(name:string) {
        this.name = name;
    }
    
    /**
     * @abstract
     * @description
     * Abstract method that must be implemented by the step in order to defined the reader stream.
     * @function _reader
     * @memberof Step
     * @returns {Readable}
     * @protected
     */
    protected abstract _reader():Readable;

    /**
     * @abstract
     * @description
     * Abstract method that must be implemented by the step in order to process the data from the reader stream and push it to the writer stream.
     * Processors are defined in an ordered array to be chained on the runner.
     * @function _processors
     * @memberof Step
     * @returns {Array<Duplex>}
     * @protected
     */
    protected abstract _processors():Array<Duplex>;

    /**
     * @abstract
     * @description
     * Abstract method that must be implemented by the step in order to defined the writer stream.
     * @function _writer
     * @memberof Step
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
        return new Promise((resolve, reject) => {
            // Reader
            const reader = this._reader();
            reader.once("error", (error) => {
                reject(error);
            });

            // Writer
            const writer = this._writer();
            writer.once("error", (error) => {
                reject(error);
            });

            // Assembly processors           
            let assembly:Readable = reader;
            for (const processor of this._processors()) {
                processor.once("error", (error) => {
                    reject(error);
                });
                assembly = assembly.pipe(processor);
            }

            // Assembly writer
            assembly.pipe(writer)
                .on("finish", () => {
                    resolve();
                });
        });
    }
}