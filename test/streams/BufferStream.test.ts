import { BufferStream, BufferStreamOptions } from "../../src/streams/BufferStream";
import { PushError } from "../../src/streams/errors/PushError";

describe("BufferStream", () => {
    let bufferStream: BufferStream<string>;
    const chunks: Array<Array<string>> = [];

    beforeEach(() => {
        const options: BufferStreamOptions = {
            batchSize: 2,
            objectMode: true,
        };
        bufferStream = new BufferStream(options);
    });

    test("should write and read data correctly", (done) => {
        bufferStream.on("data", (chunk: Array<string>) => {
            chunks.push(chunk);
        });

        bufferStream.on("end", () => {
            expect(chunks).toEqual([["data1", "data2"], ["data3"]]);
            done();
        });

        bufferStream.write("data1");
        bufferStream.write("data2");
        bufferStream.write("data3");
        bufferStream.end();
    });

    test("should handle _final correctly", (done) => {     
        bufferStream.on("data", (chunk: Array<string>) => {
            chunks.push(chunk);
        });

        bufferStream.on("end", () => {
            expect(bufferStream["buffer"].length).toBe(0);
            done();
        });

        bufferStream.write("data1");
        bufferStream.write("data2");
        bufferStream.end();
    });

    test("should not lose data when push is disabled", (done) => {
        jest.spyOn(bufferStream, "push").mockImplementation(() => false);

        // No data should be emitted
        bufferStream.on("data", () => {
            done.fail("Expected no data was received.");
        });

        bufferStream.write("data1");
        bufferStream.write("data2");
       
        setTimeout(()=>{
            expect(bufferStream["buffer"].length).toBe(2);
            done();
        },200);
    });

    test("should throw PushError when push is disabled in stream end", (done) => {
        jest.spyOn(bufferStream, "push").mockImplementation(() => false);

        bufferStream.on("error", (err) => {
            expect(err).toBeInstanceOf(PushError);
            done();
        });

        // No data should be emitted
        bufferStream.on("data", () => {
            done.fail("Expected error to be thrown but data was received.");
        });

        bufferStream.write("data1");
        bufferStream.write("data2");
        bufferStream.end();
    });
});
