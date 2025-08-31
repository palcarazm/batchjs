import { FilterStream, FilterStreamOptions } from "../../../src/streams/index";
describe("FilterStream", () => {
    const options: FilterStreamOptions<string> = {
        filter: (chunk: string) => chunk === "data1" || chunk === "data2",
    };
    let stream: FilterStream<string>;
    let chunks: Array<string>;

    beforeEach(() => {
        stream = new FilterStream(options);

        chunks = [];
        stream.on("data", (chunk: string) => {
            chunks.push(chunk);
        });
    });

    test("should write data correctly", (done) => {
        stream.on("end", () => {
            expect(chunks).toEqual(["data1", "data2"]);
            done();
        });

        stream.write("data1");
        stream.write("data2");
        stream.write("data3");// Discarded
        stream.end();
    });

    test("should send discarded data to discard event listener", (done) => {
        // No data should be emitted
        stream.on("data", () => {
            done.fail("Expected no data was received.");
        });

        stream.on("end", () => {
            expect(stream["buffer"].length).toBe(0);
            done();
        });

        stream.on("discard", (chunk: string) => {
            expect(["data3","data4","data5"]).toContain(chunk);
        });

        stream.write("data3");// Discarded
        stream.write("data4");// Discarded
        stream.write("data5");// Discarded
        stream.end();
    });
});
