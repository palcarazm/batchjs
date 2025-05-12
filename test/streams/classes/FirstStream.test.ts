import { FirstStream, ObjectDuplexOptions } from "../../../src/streams/index";
describe("FirstStream", () => {
    const options: ObjectDuplexOptions = {};
    let stream: FirstStream<string>;
    let chunks: Array<string>;

    beforeEach(() => {
        stream = new FirstStream(options);

        chunks = [];
        stream.on("data", (chunk: string) => {
            chunks.push(chunk);
        });
    });

    test("should write and read data correctly", (done) => {
        stream.write("first");
        stream.write("second");// Discarded
        stream.write("third");// Discarded

        setTimeout(()=>{
            expect(stream["pushedResult"]).toBeTruthy();
            expect(chunks).toEqual(["first"]);
            done();
        },50);
    });

    test("should handle _final correctly", (done) => {     
        stream.on("finish", () => {
            expect(stream["pushedResult"]).toBeTruthy();
            done();
        });

        stream.write("first");
        stream.write("second"); // Discarded
        stream.end();
    });

    test("should handle _final correctly when nothing to push", (done) => {
        stream.on("finish", () => {
            expect(stream["pushedResult"]).toBeTruthy();
            done();
        });

        // No data should be emitted
        stream.on("data", () => {
            done.fail("Expected error to be thrown but data was received.");
        });

        stream.end();
    });

    test("should send discarded data to discard event listener", (done) => {
        stream.on("data", (chunk: string) => {
            expect(chunk).toEqual("first");
        });

        stream.on("finish", () => {
            expect(stream["pushedResult"]).toBeTruthy();
            done();
        });

        stream.on("discard", (chunk: string) => {
            expect(["second","third"]).toContain(chunk);
        });

        stream.write("first");
        stream.write("second"); // Discarded
        stream.write("third"); // Discarded
        stream.end();
    });
});
