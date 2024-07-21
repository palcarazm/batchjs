import { FilterStream, FilterStreamOptions, PushError } from "../../../src/streams/index";
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

    test("should write and read data correctly", (done) => {
        stream.on("end", () => {
            expect(chunks).toEqual(["data1", "data2"]);
            done();
        });

        stream.write("data1");
        stream.write("data2");
        stream.write("data3");// Discarded
        stream.end();
    });

    test("should handle _final correctly", (done) => {     
        stream.on("end", () => {
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
        stream.write("data3"); // Discarded
       
        setTimeout(()=>{
            expect(stream["buffer"].length).toBe(2);
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

        stream.write("data1");
        stream.write("data2");
        stream.write("data3"); // Discarded
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
