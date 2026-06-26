import { Duplex, Readable, Writable } from "node:stream";
import { Step } from "./Step";
import { StepBuilderError } from "../../errors/StepBuilderError";

/**
 * @class
 * Fluent builder for creating Step instances without subclassing.
 * @since 1.3.0
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
 * await step.run();
 * ```
 * ```shell
 * >> A
 * >> B
 * >> C
 * ```
 */
export class StepBuilder {
    private _readerFn?: () => Readable;
    private _processorsFn?: () => Duplex[];
    private _writerFn?: () => Writable;
    private readonly _name: string;
    private readonly _params: object;

    /**
     * @param {string} name - The name to assign to the Step.
     * @param {object} params - The parameters to pass to the step (optional, defaults to `{}`).
     */
    constructor(name: string, params: object = {}) {
        this._name = name;
        this._params = params;
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
     * Builds and returns a Step instance using the configured reader, processors, and writer.
     * Each call to build() returns a new Step instance. The builder can be reused to create
     * multiple Step instances with the same configuration.
     * @returns {Step} A new Step instance.
     * @throws {@link StepBuilderError} If any of the required callbacks (reader, processors, writer) are missing.
     */
    build(): Step {
        if (!this._readerFn) throw new StepBuilderError(this._name, "reader");
        if (!this._processorsFn) throw new StepBuilderError(this._name, "processors");
        if (!this._writerFn) throw new StepBuilderError(this._name, "writer");

        const name = this._name;
        const params = this._params;
        const readerFn = this._readerFn;
        const processorsFn = this._processorsFn;
        const writerFn = this._writerFn;

        // Create anonymous class extending Step
        class AnonymousStep extends Step {
            constructor() {
                super(name, params);
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
        }

        return new AnonymousStep();
    }
}