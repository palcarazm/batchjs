import { BufferStream, BufferStreamOptions } from "../../../src/streams/index";

describe("BufferStream", () => {
    const options: BufferStreamOptions = {
        batchSize: 2,
    };
    let stream: BufferStream<string>;
    let  chunks: Array<Array<string>>;

    beforeEach(() => {
        stream = new BufferStream(options);

        chunks = [];
        stream.on("data", (chunk: Array<string>) => {
            chunks.push(chunk);
        });
    });

    test("should write and read data correctly", (done) => {
        stream.on("finish", () => {
            expect(chunks).toEqual([["data1", "data2"], ["data3"]]);
            done();
        });

        stream.write("data1");
        stream.write("data2");
        stream.write("data3");
        stream.end();
    });

    test("should handle _final correctly", (done) => {     
        stream.on("finish", () => {
            expect(stream["buffer"].length).toBe(0);
            done();
        });

        stream.write("data1");
        stream.write("data2");
        stream.end();
    });

    test("should not lose data when push is disabled", (done) => {
        jest.spyOn(stream, "push").mockImplementation(() => false);

        // No data should be emitted
        stream.on("data", () => {
            done.fail("Expected no data was received.");
        });

        stream.write("data1");
        stream.write("data2");
       
        setTimeout(()=>{
            expect(stream["buffer"].length).toBe(2);
            done();
        },200);
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

        stream.write("data1");
        stream.write("data2");
        stream.end();
        setTimeout(()=>{
            expect(stream["buffer"].length).toBe(2);
            jest.spyOn(stream, "push").mockImplementation(() => true);
            stream.emit("drain");
        },50);
    });
});
