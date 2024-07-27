import { FlatStream, ObjectDuplexOptions, PushError } from "../../../src/streams/index";
describe("FlatStream", () => {
    const options: ObjectDuplexOptions = {};
    let stream: FlatStream<string>;
    let chunks: Array<string>;

    beforeEach(() => {
        stream = new FlatStream(options);

        chunks = [];
        stream.on("data", (chunk: string) => {
            chunks.push(chunk);
        });
    });

    test("should write and read data correctly", (done) => {
        stream.on("end", () => {
            expect(chunks).toEqual(["data1","data2","data3"]);
            done();
        });

        stream.write(["data1", "data2"]);
        stream.write(["data3"]);
        stream.end();
    });

    test("should handle _final correctly", (done) => {     
        stream.on("end", () => {
            expect(stream["buffer"].length).toBe(0);
            done();
        });

        stream.write(["data1", "data2"]);
        stream.write(["data3"]);
        stream.end();
    });

    test("should not lose data when push is disabled", (done) => {
        jest.spyOn(stream, "push").mockImplementation(() => false);

        // No data should be emitted
        stream.on("data", () => {
            done.fail("Expected no data was received.");
        });

        stream.write(["data1", "data2"]);
        stream.write(["data3"]);
       
        setTimeout(()=>{
            expect(stream["buffer"].length).toBe(3);
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

        stream.write(["data1", "data2"]);
        stream.write(["data3"]);
        stream.end();
    });
});
