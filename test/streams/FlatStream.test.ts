import { FlatStream, FlatStreamOptions, PushError } from "../../src/streams/index";
describe("FlatStream", () => {
    const options: FlatStreamOptions = {};
    let flatStream: FlatStream<string>;
    let chunks: Array<Array<string>>;

    beforeEach(() => {
        flatStream = new FlatStream(options);

        chunks = [];
        flatStream.on("data", (chunk: Array<string>) => {
            chunks.push(chunk);
        });
    });

    test("should write and read data correctly", (done) => {
        flatStream.on("end", () => {
            expect(chunks).toEqual(["data1","data2","data3"]);
            done();
        });

        flatStream.write(["data1", "data2"]);
        flatStream.write(["data3"]);
        flatStream.end();
    });

    test("should handle _final correctly", (done) => {     
        flatStream.on("end", () => {
            expect(flatStream["buffer"].length).toBe(0);
            done();
        });

        flatStream.write(["data1", "data2"]);
        flatStream.write(["data3"]);
        flatStream.end();
    });

    test("should not lose data when push is disabled", (done) => {
        jest.spyOn(flatStream, "push").mockImplementation(() => false);

        // No data should be emitted
        flatStream.on("data", () => {
            done.fail("Expected no data was received.");
        });

        flatStream.write(["data1", "data2"]);
        flatStream.write(["data3"]);
       
        setTimeout(()=>{
            expect(flatStream["buffer"].length).toBe(3);
            done();
        },200);
    });

    test("should throw PushError when push is disabled in stream end", (done) => {
        jest.spyOn(flatStream, "push").mockImplementation(() => false);

        flatStream.on("error", (err) => {
            expect(err).toBeInstanceOf(PushError);
            done();
        });

        // No data should be emitted
        flatStream.on("data", () => {
            done.fail("Expected error to be thrown but data was received.");
        });

        flatStream.write(["data1", "data2"]);
        flatStream.write(["data3"]);
        flatStream.end();
    });
});
