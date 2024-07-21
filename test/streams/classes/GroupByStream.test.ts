import { GroupByStream, GroupByStreamOptions, PushError } from "../../../src/streams/index";

describe("GroupByStream", () => {
    const options: GroupByStreamOptions<string> = {
        groupBy: (chunk: string) => chunk.split("").at(0) ?? "",
    };
    let groupByStream: GroupByStream<string>;
    let chunks: Array<Array<string>>;

    beforeEach(() => {
        groupByStream = new GroupByStream(options);

        chunks = [];
        groupByStream.on("data", (chunk: Array<string>) => {
            chunks.push(chunk);
        });
    });

    test("should write and read data correctly", (done) => {
        groupByStream.on("end", () => {
            expect(chunks).toEqual([["DATA1", "DATA2"], ["data3"]]);
            done();
        });

        groupByStream.write("DATA1");
        groupByStream.write("DATA2");
        groupByStream.write("data3");
        groupByStream.end();
    });

    test("should not emit data since stream is ended", (done) => {     
        // No data should be emitted
        groupByStream.on("data", () => {
            done.fail("Expected error to be thrown but data was received.");
        });

        groupByStream.on("pause", () => {
            done();
        });

        groupByStream.write("data1");
        groupByStream.write("data2");
        groupByStream.pause();
    });

    test("should throw PushError when push is disabled in stream end", (done) => {
        jest.spyOn(groupByStream, "push").mockImplementation(() => false);

        groupByStream.on("error", (err) => {
            expect(err).toBeInstanceOf(PushError);
            done();
        });

        // No data should be emitted
        groupByStream.on("data", () => {
            done.fail("Expected error to be thrown but data was received.");
        });

        groupByStream.write("data1");
        groupByStream.write("data2");
        groupByStream.end();
    });
});
