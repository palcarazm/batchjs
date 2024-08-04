import { DistinctStream, DistinctStreamOptions } from "../../../src/streams/index";
describe("DistinctStream", () => {
    const options: DistinctStreamOptions<string,string> = {
        keyExtractor: (chunk: string) => chunk,
    };
    let stream: DistinctStream<string,string>;
    let chunks: Array<string>;

    beforeEach(() => {
        stream = new DistinctStream(options);

        chunks = [];
        stream.on("data", (chunk: string) => {
            chunks.push(chunk);
        });
    });

    test("should write and read data correctly", (done) => {
        stream.on("finish", () => {
            expect(chunks).toEqual(["data1", "data2"]);
            done();
        });

        stream.write("data1");
        stream.write("data2");
        stream.write("data1"); //Duplicated
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
        stream.write("data1"); //Duplicated
       
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
        stream.write("data1"); //Duplicated
        stream.end();
        setTimeout(()=>{
            expect(stream["buffer"].length).toBe(2);
            jest.spyOn(stream, "push").mockImplementation(() => true);
            stream.emit("drain");
        },50);
    });

    test("should send duplicated data to discard event listener", (done) => {
        stream.on("finish", () => {
            expect(stream["buffer"].length).toBe(0);
            done();
        });

        stream.on("discard", (chunk: string) => {
            expect(["data1","data2"]).toContain(chunk);
        });

        stream.write("data1");
        stream.write("data2");
        stream.write("data1"); //Duplicated
        stream.write("data2"); //Duplicated
        stream.end();
    });
});
