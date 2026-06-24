import { CountStream, ObjectDuplexOptions } from "../../../main/streams/index";

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

    test("should count the amount of chunks", (done) => {
        stream.on("end", () => {
            expect(chunks).toEqual([3]);
            done();
        });

        stream.write("data1");
        stream.write("data2");
        stream.write("data3");
        stream.end();
    });

    test("should wait write end to push count", (done) => {

        // No data should be emitted
        stream.on("data", () => {
            done.fail("Expected error to be thrown but data was received.");
        });

        stream.write("data1");
        stream.write("data2");
        setTimeout(() => {
            expect(chunks).toEqual([]);
            done();
        },50);
    });
});
