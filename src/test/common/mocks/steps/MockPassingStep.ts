/// <reference types="node" />
import { Step, StepOptions } from "../../../../main/common/index";
import { Readable, Writable, Transform, TransformCallback, TransformOptions } from "node:stream";

export class MockPassingStep extends Step {
    private readonly delay: number;

    constructor(name: string = "MockPassingStep", delay: number = 0, options?: Partial<StepOptions>) {
        super(name, {}, options);
        this.delay = delay;
    }

    protected _reader() {
        const delay = this.delay;
        return new Readable({
            objectMode: true,
            read() {
                setTimeout(() => {
                    this.push("data");
                    this.push(null);
                }, delay);
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