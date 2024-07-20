import { BufferDuplex, BufferDuplexOptions } from "../../../src/streams/duplex/BufferDuplex";
import { PushError } from "../../../src/streams/errors/PushError";

describe("BufferDuplex", () => {
    let duplex: BufferDuplex<string>;
    const chunks: Array<Array<string>> = [];

    beforeEach(() => {
        const options: BufferDuplexOptions = {
            batchSize: 2,
            objectMode: true,
        };
        duplex = new BufferDuplex(options);
    });

    test("should write and read data correctly", (done) => {
        duplex.on("data", (chunk: Array<string>) => {
            chunks.push(chunk);
        });

        duplex.on("end", () => {
            expect(chunks).toEqual([["data1", "data2"], ["data3"]]);
            done();
        });

        duplex.write("data1");
        duplex.write("data2");
        duplex.write("data3");
        duplex.end();
    });

    test("should handle _final correctly", (done) => {     
        duplex.on("data", (chunk: Array<string>) => {
            chunks.push(chunk);
        });

        duplex.on("end", () => {
            expect(duplex["buffer"].length).toBe(0);
            done();
        });

        duplex.write("data1");
        duplex.write("data2");
        duplex.end();
    });

    test("should not lose data when push is disabled", (done) => {
        jest.spyOn(duplex, "push").mockImplementation(() => false);

        // No data should be emitted
        duplex.on("data", () => {
            done.fail("Expected no data was received.");
        });

        duplex.write("data1");
        duplex.write("data2");
       
        setTimeout(()=>{
            expect(duplex["buffer"].length).toBe(2);
            done();
        },200);
    });

    test("should throw PushError when push is disabled in stream end", (done) => {
        jest.spyOn(duplex, "push").mockImplementation(() => false);

        duplex.on("error", (err) => {
            expect(err).toBeInstanceOf(PushError);
            done();
        });

        // No data should be emitted
        duplex.on("data", () => {
            done.fail("Expected error to be thrown but data was received.");
        });

        duplex.write("data1");
        duplex.write("data2");
        duplex.end();
    });
});
