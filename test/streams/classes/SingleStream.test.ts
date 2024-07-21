import { SingleStream, SingleStreamOptions, PushError, SingleStreamError } from "../../../src/streams/index";

describe("SingleStream", () => {
    const options: SingleStreamOptions = {};
    let singleStream: SingleStream<string>;
    let chunks: Array<string>;

    beforeEach(() => {
        singleStream = new SingleStream(options);

        chunks = [];
        singleStream.on("data", (chunk: string) => {
            chunks.push(chunk);
        });
    });

    test("should write and read data correctly", (done) => {
        singleStream.on("end", () => {
            expect(chunks).toEqual(["data1"]);
            done();
        });

        singleStream.write("data1");
        singleStream.end();
    });

    
    test("should throw SingleStreamError when more than one chunk is received", (done) => {
        singleStream.once("error", (err) => {
            expect(err).toBeInstanceOf(SingleStreamError);
            expect(chunks).toEqual(["data1"]);
            done();
        });

        singleStream.write("data1");
        setTimeout(()=>{
            singleStream.write("data2"); // This should launch error
            singleStream.end();
        },50);
    });

    test("should handle _final correctly", (done) => {     
        singleStream.on("end", () => {
            expect(singleStream["buffer"].length).toBe(0);
            done();
        });

        singleStream.write("data1");
        singleStream.end();
    });

    test("should not lose data when push is disabled", (done) => {
        jest.spyOn(singleStream, "push").mockImplementation(() => false);

        // No data should be emitted
        singleStream.on("data", () => {
            done.fail("Expected no data was received.");
        });

        singleStream.write("data1");
       
        setTimeout(()=>{
            expect(singleStream["buffer"].length).toBe(1);
            done();
        },200);
    });

    test("should throw PushError when push is disabled in stream end", (done) => {
        jest.spyOn(singleStream, "push").mockImplementation(() => false);

        singleStream.once("error", (err) => {
            expect(err).toBeInstanceOf(PushError);
            done();
        });

        // No data should be emitted
        singleStream.on("data", () => {
            done.fail("Expected error to be thrown but data was received.");
        });

        singleStream.write("data1");
        singleStream.end();
    });
});
