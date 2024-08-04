import { LastStream, ObjectDuplexOptions } from "../../../src/streams/index";
describe("LastStream", () => {
    const options: ObjectDuplexOptions = {};
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

    test("should wait for drain when push is disabled in stream end", (done) => {
        jest.spyOn(stream, "push").mockImplementation(() => false);

        stream.on("finish", () => {
            expect(stream["pushedResult"]).toBeTruthy();
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
        setTimeout(()=>{
            expect(stream["pushedResult"]).toBeFalsy();
            jest.spyOn(stream, "push").mockImplementation(() => true);
            stream.emit("drain");
        },50);
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
