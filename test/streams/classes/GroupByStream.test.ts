import { GroupByStream, GroupByStreamOptions } from "../../../src/streams/index";

describe("GroupByStream", () => {
    const options: GroupByStreamOptions<string> = {
        groupBy: (chunk: string) => chunk.split("").at(0) ?? "",
    };
    let stream: GroupByStream<string>;
    let chunks: Array<Array<string>>;

    beforeEach(() => {
        stream = new GroupByStream(options);

        chunks = [];
        stream.on("data", (chunk: Array<string>) => {
            chunks.push(chunk);
        });
    });

    test("should write and read data correctly", (done) => {
        stream.on("end", () => {
            expect(chunks).toEqual([["DATA1", "DATA2"], ["data3"]]);
            done();
        });

        stream.write("DATA1");
        stream.write("DATA2");
        stream.write("data3");
        stream.end();
    });

    test("should not emit data since stream is ended", (done) => {     
        // No data should be emitted
        stream.on("data", () => {
            done.fail("Expected error to be thrown but data was received.");
        });

        stream.on("pause", () => {
            done();
        });

        stream.write("data1");
        stream.write("data2");
        stream.pause();
    });

    test("should wait for drain when push is disabled in stream end", (done) => {
        jest.spyOn(stream, "push").mockImplementation(() => false);

        stream.on("finish", () => {
            expect (stream["buffer"].size).toBe(0);
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
            expect (stream["buffer"].size).toBe(1);
            jest.spyOn(stream, "push").mockImplementation(() => true);
            stream.emit("drain");
        },50);
    });
});
