import { FirstStream, ObjectDuplexOptions, PushError } from "../../../src/streams/index";
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
            expect(stream["pushedFirstChunk"]).toBeTruthy();
            expect(chunks).toEqual(["first"]);
            done();
        },50);
    });

    test("should handle _final correctly", (done) => {     
        stream.on("end", () => {
            expect(stream["pushedFirstChunk"]).toBeTruthy();
            done();
        });

        stream.write("first");
        stream.write("second"); // Discarded
        stream.end();
    });

    test("should not lose data when push is disabled", (done) => {
        jest.spyOn(stream, "push").mockImplementation(() => false);

        // No data should be emitted
        stream.on("data", () => {
            done.fail("Expected no data was received.");
        });

        stream.write("first");
        stream.write("second"); // Discarded
        stream.write("third"); // Discarded
       
        setTimeout(()=>{
            expect(stream["pushedFirstChunk"]).toBeFalsy();
            done();
        },200);
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

        stream.write("first");
        stream.write("second"); // Discarded
        stream.write("third"); // Discarded
        stream.end();
    });

    test("should send discarded data to discard event listener", (done) => {
        stream.on("data", (chunk: string) => {
            expect(chunk).toEqual("first");
        });

        stream.on("end", () => {
            expect(stream["pushedFirstChunk"]).toBeTruthy();
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
