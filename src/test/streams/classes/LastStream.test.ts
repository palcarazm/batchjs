import { LastStream, ObjectDuplexOptions } from "../../../main/streams/index";
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

    test("should wait until write end to send last chunk", (done) => {
        // No data should be emitted
        stream.on("data", () => {
            done.fail("Expected error to be thrown but data was received.");
        });

        stream.write("first");// Discarded
        stream.write("second");// Discarded
        stream.write("third");

        setTimeout(()=>{
            expect(chunks).toEqual([]);
            done();
        },50);
    });

    test("should send the last chunk", (done) => {     
        stream.on("end", () => {
            expect(chunks).toEqual(["third"]);
            done();
        });

        stream.write("first");// Discarded
        stream.write("second");// Discarded
        stream.write("third");
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
