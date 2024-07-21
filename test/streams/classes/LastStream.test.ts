import { LastStream, LastStreamOptions, PushError } from "../../../src/streams/index";
describe("LastStream", () => {
    const options: LastStreamOptions = {};
    let stream: LastStream<string>;
    let chunks: Array<string>;

    beforeEach(() => {
        stream = new LastStream(options);

        chunks = [];
        stream.on("data", (chunk: string) => {
            chunks.push(chunk);
        });
    });

    test("should write and read data correctly", (done) => {
        // No data should be emitted
        stream.on("data", () => {
            done.fail("Expected error to be thrown but data was received.");
        });

        stream.write("first");// Discarded
        stream.write("second");// Discarded
        stream.write("third");

        setTimeout(()=>{
            done();
        },50);
    });

    test("should handle _final correctly", (done) => {     
        stream.on("end", () => {
            expect(chunks).toEqual(["third"]);
            done();
        });

        stream.write("first");// Discarded
        stream.write("second");// Discarded
        stream.write("third");
        stream.end();
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

        stream.write("first");// Discarded
        stream.write("second");// Discarded
        stream.write("third");
        stream.end();
    });

    test("should send discarded data to discard event listener", (done) => {
        stream.on("data", (chunk: string) => {
            expect(chunk).toEqual("third");
        });

        stream.on("end", () => {
            done();
        });

        stream.on("discard", (chunk: string) => {
            expect(["first","second"]).toContain(chunk);
        });

        stream.write("first");// Discarded
        stream.write("second");// Discarded
        stream.write("third");
        stream.end();
    });
});
