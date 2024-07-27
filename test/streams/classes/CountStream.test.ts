import { CountStream, ObjectDuplexOptions, PushError } from "../../../src/streams/index";

describe("CountStream", () => {
    const options: ObjectDuplexOptions = {};
    let stream: CountStream<string>;
    let chunks: Array<number>;

    beforeEach(() => {
        stream = new CountStream(options);

        chunks = [];
        stream.on("data", (chunk: number) => {
            chunks.push(chunk);
        });
    });

    test("should write and read data correctly", (done) => {
        stream.on("end", () => {
            expect(chunks).toEqual([3]);
            done();
        });

        stream.write("data1");
        stream.write("data2");
        stream.write("data3");
        stream.end();
    });

    test("should handle _final correctly", (done) => {     
        stream.on("end", () => {
            expect(chunks).toEqual([2]);
            done();
        });

        stream.write("data1");
        stream.write("data2");
        stream.end();
    });

    test("should wait streams end to push count", (done) => {

        stream.on("error", (err) => {
            expect(err).toBeInstanceOf(PushError);
            done();
        });

        // No data should be emitted
        stream.on("data", () => {
            done.fail("Expected error to be thrown but data was received.");
        });

        stream.write("data1");
        stream.write("data2");
        setTimeout(() => {
            done();
        },50);
    });

    test("should throw PushError when push is disabled in stream end", (done) => {
        jest.spyOn(stream, "push").mockImplementation(() => false);

        stream.on("error", (err) => {
            expect(err).toBeInstanceOf(PushError);
            done();
        });

        // No data should be emitted
        stream.on("data", () => {
            done.fail("Expected error to be thrown but data was received.");
        });

        stream.write("data1");
        stream.write("data2");
        stream.end();
    });
});
