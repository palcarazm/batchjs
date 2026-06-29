import { Duplex, Readable, Writable } from "node:stream";
import { Step } from "./Step";
import { StepBuilderError } from "../../errors/StepBuilderError";
import { StepOptions } from "./StepOptions";

/**
 * @class
 * Fluent builder for creating Step instances without subclassing.
 * @since 2.0.0
 * 
 * @example
 * ```typescript
 * const step = new StepBuilder('myStep')
 *   .reader(() => Readable.from(['a', 'b', 'c'], { objectMode: true }))
 *   .processors(() => [
 *      new Transform({
 *        objectMode: true,
 *        transform(chunk, encoding, callback) {
 *          this.push(chunk.toUpperCase());
 *          callback();
 *        }
 *      })
 *   ])
 *   .writer(() => new Writable({
 *     objectMode: true,
 *     write(chunk, encoding, callback) {
 *       console.log(chunk);
 *       callback();
 *     }
 *   }))
 *   .build();
 * 
 * step.on("started", () => console.log("Step started"));
 * step.on("completed", () => console.log("Step completed"));
 * step.run();
 * ```
 * ```shell
 * >> Step started
 * >> A
 * >> B
 * >> C
 * >> Step completed
 * ```
 */
export class StepBuilder {
    private _readerFn?: () => Readable;
    private _processorsFn?: () => Duplex[];
    private _writerFn?: () => Writable;
    private _rollbackFn?: () => Promise<void>;
    private readonly _name: string;
    private readonly _params: Record<string, unknown>;
    private readonly _options: Partial<StepOptions> = {};

    /**
     * @param {string} name - The name to assign to the Step.
     * @param {Record<string, unknown>} params - The parameters to pass to the step (optional, defaults to `{}`).
     */
    constructor(name: string, params: Record<string, unknown> = {}, options: Partial<StepOptions> = {}) {
        this._name = name;
        this._params = params;
        this._options = {...options};
    }

    /**
     * Sets the reader function for the step.
     * @param {() => Readable} readerFn - A function that returns a Readable stream.
     * @returns {this} The builder instance for chaining.
     */
    reader(readerFn: () => Readable): this {
        this._readerFn = readerFn;
        return this;
    }

    /**
     * Sets the processors function for the step.
     * @param {() => Duplex[]} processorsFn - A function that returns an array of Duplex streams.
     * @returns {this} The builder instance for chaining.
     */
    processors(processorsFn: () => Duplex[]): this {
        this._processorsFn = processorsFn;
        return this;
    }

    /**
     * Sets the writer function for the step.
     * @param {() => Writable} writerFn - A function that returns a Writable stream.
     * @returns {this} The builder instance for chaining.
     */
    writer(writerFn: () => Writable): this {
        this._writerFn = writerFn;
        return this;
    }

    /**
     * Sets whether auto-rollback is enabled for this step.
     * Overrides any value passed via constructor options.
     * @param enabled - Whether auto-rollback should be enabled.
     * @returns {this} The builder instance for chaining.
     */
    autoRollback(enabled: boolean): this {
        this._options.autoRollback = enabled;
        return this;
    }

    /**
     * Sets the rollback function for the step.
     * @param {() => Promise<void>} rollbackFn - A function that returns a Promise.
     * @returns {this} The builder instance for chaining.
     */
    rollback(rollbackFn: () => Promise<void>): this {
        this._rollbackFn = rollbackFn;
        return this;
    }

    /**
     * Builds and returns a Step instance using the configured reader, processors, and writer.
     * Each call to build() returns a new Step instance. The builder can be reused to create
     * multiple Step instances with the same configuration.
     * @returns {Step} A new Step instance.
     * @throws {@link StepBuilderError} when :
     * - Any of the required callbacks (reader, processors, writer) are missing
     * - Rollback callback is missing and `autoRollback` options is `true`.
     */
    build(): Step {
        if (!this._readerFn) throw new StepBuilderError(this._name, "reader");
        if (!this._processorsFn) throw new StepBuilderError(this._name, "processors");
        if (!this._writerFn) throw new StepBuilderError(this._name, "writer");
        if (this._options.autoRollback && !this._rollbackFn) {
            throw new StepBuilderError(this._name, "rollback (required when autoRollback is true)");
        }

        const name = this._name;
        const params = this._params;
        const options = this._options;
        const readerFn = this._readerFn;
        const processorsFn = this._processorsFn;
        const writerFn = this._writerFn;
        const rollbackFn = this._rollbackFn;

        // Create anonymous class extending Step
        class AnonymousStep extends Step {
            constructor() {
                super(name, params, options);
            }

            protected _reader(): Readable {
                return readerFn();
            }

            protected _processors(): Duplex[] {
                return processorsFn();
            }

            protected _writer(): Writable {
                return writerFn();
            }

            protected _rollback(): Promise<void> {
                if (rollbackFn) {
                    return rollbackFn();
                }
                // No-op: validation ensures this is only called when rollbackFn exists if autoRollback is true
                return Promise.resolve();
            }
        }

        return new AnonymousStep();
    }
}