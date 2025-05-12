import { FlatStream, ObjectDuplexOptions } from "../../../src/streams/index";
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

    test("should wait for drain when push is disabled in stream end", (done) => {
        jest.spyOn(stream, "push").mockImplementation(() => false);

        stream.on("finish", () => {
            expect(stream["buffer"].length).toBe(0);
            done();
        });

        // No data should be emitted
        stream.on("data", () => {
            done.fail("Expected error to be thrown but data was received.");
        });

        stream.write(["data1", "data2"]);
        stream.write(["data3"]);
        stream.end();
        setTimeout(()=>{
            jest.spyOn(stream, "push").mockImplementation(() => true);
            stream.emit("drain");
        },50);
    });
});
