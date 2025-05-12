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
});
