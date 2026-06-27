/* eslint-disable @typescript-eslint/no-explicit-any */
import { Readable, Writable, Transform, Duplex, TransformCallback } from "node:stream";
import { StepBuilder, StepBuilderError, RunnableStatus, Step } from "../../../../main/common/index";

describe("StepBuilder", () => {
    let builder: StepBuilder;
    const stepName = "TestStep";
    const readerFn = () => new Readable({ objectMode: true });
    const processorsFn = () => [new Transform({ objectMode: true })];
    const writerFn = () => new Writable({ objectMode: true });

    function createStep(builder: StepBuilder): Step {
        return builder
            .reader(readerFn)
            .processors(processorsFn)
            .writer(writerFn)
            .build();
    }

    beforeEach(() => {
        builder = new StepBuilder(stepName);
    });

    describe("constructor", () => {
        test("should create builder with name and empty params", () => {
            expect(builder).toBeInstanceOf(StepBuilder);
        });

        test("should create builder with name and params", () => {
            const params = { key: "value" };
            const builderWithParams = new StepBuilder(stepName, params);
            const step = createStep(builderWithParams);

            expect(step).toBeDefined();
        });
    });

    describe("chainable methods", () => {
        test("should support method chaining", () => {
            const result = builder
                .reader(readerFn)
                .processors(processorsFn)
                .writer(writerFn);

            expect(result).toBe(builder);
        });

        test("reader should store the provided function", () => {
            const step = createStep(builder);
            
            expect((builder as any)._readerFn).toBe(readerFn);
            expect((step as any)._reader()).toBeInstanceOf(Readable);
        });

        test("processors should store the provided function", () => {    
            const step = createStep(builder);
            
            expect((builder as any)._processorsFn).toBe(processorsFn);
            expect((step as any)._processors()).toBeInstanceOf(Array);
            expect((step as any)._processors().at(0)).toBeInstanceOf(Duplex);
        });

        test("writer should store the provided function", () => {
            const step = createStep(builder);
            
            expect((builder as any)._writerFn).toBe(writerFn);
            expect((step as any)._writer()).toBeInstanceOf(Writable);
        });
    });

    describe("build", () => {
        test("should throw StepBuilderError if reader is missing", () => {
            expect(() => {
                builder
                    .processors(processorsFn)
                    .writer(writerFn)
                    .build();
            }).toThrow(StepBuilderError);
            expect(() => {
                builder
                    .processors(processorsFn)
                    .writer(writerFn)
                    .build();
            }).toThrow(/missing a reader/);
        });

        test("should throw StepBuilderError if processor is missing", () => {
            expect(() => {
                builder
                    .reader(readerFn)
                    .writer(writerFn)
                    .build();
            }).toThrow(StepBuilderError);
            expect(() => {
                builder
                    .reader(readerFn)
                    .writer(writerFn)
                    .build();
            }).toThrow(/missing a processor/);
        });

        test("should throw StepBuilderError if writer is missing", () => {
            expect(() => {
                builder
                    .reader(readerFn)
                    .processors(processorsFn)
                    .build();
            }).toThrow(StepBuilderError);
            expect(() => {
                builder
                    .reader(readerFn)
                    .processors(processorsFn)
                    .build();
            }).toThrow(/missing a writer/);
        });

        test("should return a Step instance when all callbacks are provided", () => {
            const step = createStep(builder);

            expect(step).toBeDefined();
            expect(step.name).toBe(stepName);
            expect(step.status).toBe(RunnableStatus.CREATED);
        });

        test("should return a new Step instance each time .build() is called", () => {
            builder
                .reader(readerFn)
                .processors(processorsFn)
                .writer(writerFn);

            const step1 = builder.build();
            const step2 = builder.build();

            expect(step1).not.toBe(step2);
        });

        test("should support params passed to constructor", async () => {
            const params = { multiplier: 2 };
            const builderWithParams = new StepBuilder(stepName, params);
            const step = builderWithParams
                .reader(() => Readable.from(["a", "b"], { objectMode: true }))
                .processors(processorsFn)
                .writer(() => new Writable({
                    objectMode: true,
                    write(chunk: string, encoding: BufferEncoding, callback: TransformCallback) {
                        callback();
                    }
                }))
                .build();

            // params are stored internally, we test they exist via the name matching
            expect(step.params).toBe(params);
        });

        test("should pass instanceof check", () => {
            const step = createStep(builder);

            expect(step).toBeInstanceOf(Step);
        });

        test("should execute successfully with valid stream setup", (done) => {
            const chunks: string[] = [];
            builder
                .reader(() => Readable.from(["x", "y", "z"], { objectMode: true }))
                .processors(() => [
                    new Transform({
                        objectMode: true,
                        transform(chunk: string, encoding: BufferEncoding, callback: TransformCallback) {
                            this.push(chunk.repeat(2));
                            callback();
                        }
                    })
                ])
                .writer(() => new Writable({
                    objectMode: true,
                    write(chunk: string, encoding: BufferEncoding, callback: TransformCallback) {
                        chunks.push(chunk);
                        callback();
                    }
                }))
                .build()
                .on("finished", ({ status }) => {
                    expect(status).toBe(RunnableStatus.COMPLETED);
                    expect(chunks).toEqual(["xx", "yy", "zz"]);
                    done();
                })
                .run();
        });

        test("should handle errors from streams", (done) => {
            builder
                .reader(() => {
                    const readable = new Readable({
                        objectMode: true,
                        read() {
                            this.emit("error", new Error("Reader error"));
                        }
                    });
                    return readable;
                })
                .processors(processorsFn)
                .writer(writerFn)
                .build()
                .once("failed", ({ error }) => {
                    expect(error).toBeDefined();
                    expect(error?.message).toBe("Reader error");
                })
                .on("finished", ({ status }) => {
                    expect(status).toBe(RunnableStatus.FAILED);
                    done();
                })
                .run();
        });
    });
});