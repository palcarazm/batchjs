import { GroupByStream, GroupByStreamOptions } from "../../src/streams/GroupByStream";
import { PushError } from "../../src/streams/errors/PushError";

describe("GroupByStream", () => {
    let groupByStream: GroupByStream<string>;
    const chunks: Array<Array<string>> = [];

    beforeEach(() => {
        const options: GroupByStreamOptions<string> = {
            objectMode: true,
            groupBy: (chunk: string) => chunk.split("").at(0) ?? "",
        };
        groupByStream = new GroupByStream(options);
    });

    test("should write and read data correctly", (done) => {
        groupByStream.on("data", (chunk: Array<string>) => {
            chunks.push(chunk);
        });

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
