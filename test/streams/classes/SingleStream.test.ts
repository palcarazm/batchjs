import { SingleStream, ObjectDuplexOptions, SingleStreamError } from "../../../src/streams/index";

describe("SingleStream", () => {
    const options: ObjectDuplexOptions = {};
    let stream: SingleStream<string>;
    let chunks: Array<string>;

    beforeEach(() => {
        stream = new SingleStream(options);

        chunks = [];
        stream.on("data", (chunk: string) => {
            chunks.push(chunk);
        });
    });

    test("should write and read data correctly", (done) => {
        stream.on("end", () => {
            expect(chunks).toEqual(["data1"]);
            done();
        });

        stream.write("data1");
        stream.end();
    });

    
    test("should throw SingleStreamError when more than one chunk is received", (done) => {
        stream.once("error", (err) => {
            expect(err).toBeInstanceOf(SingleStreamError);
            expect(chunks).toEqual(["data1"]);
            done();
        });

        stream.write("data1");
        setTimeout(()=>{
            stream.write("data2"); // This should launch error
            stream.end();
        },50);
    });

    test("should handle _final correctly", (done) => {     
        stream.on("end", () => {
            expect(stream["buffer"].length).toBe(0);
            done();
        });

        stream.write("data1");
        stream.end();
    });

    test("should not lose data when push is disabled", (done) => {
        jest.spyOn(stream, "push").mockImplementation(() => false);

        // No data should be emitted
        stream.on("data", () => {
            done.fail("Expected no data was received.");
        });

        stream.write("data1");
       
        setTimeout(()=>{
            expect(stream["buffer"].length).toBe(1);
            done();
        },200);
    });

    test("should wait for drain when push is disabled in stream end", (done) => {
        jest.spyOn(stream, "push").mockImplementation(() => false);

        stream.once("finish", () => {
            expect(stream["buffer"].length).toBe(0);
            done();
        });

        // No data should be emitted
        stream.on("data", () => {
            done.fail("Expected error to be thrown but data was received.");
        });

        stream.write("data1");
        stream.end();
        setTimeout(()=>{
            expect(stream["buffer"].length).toBe(1);
            jest.spyOn(stream, "push").mockImplementation(() => true);
            stream.emit("drain");
        },50);
    });
});
