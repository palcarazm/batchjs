import { EmptyStream, ObjectDuplexOptions } from "../../../src/streams/index";
describe("EmptyStream", () => {
    const options: ObjectDuplexOptions = {};
    let stream: EmptyStream<string>;
    let chunks: Array<boolean>;

    beforeEach(() => {
        stream = new EmptyStream(options);

        chunks = [];
        stream.on("data", (chunk: boolean) => {
            chunks.push(chunk);
        });
    });

    test("should write and read data correctly", (done) => {
        stream.write("first"); // not empty

        setTimeout(()=>{
            expect(chunks).toEqual([false]);
            done();
        },50);
    });

    test("should handle _final correctly", (done) => {     
        stream.on("end", () => {
            expect(chunks).toEqual([true]);
            done();
        });

        stream.end(); // empty
    });

    test("should wait for drain when push is disabled in stream end", (done) => {
        jest.spyOn(stream, "push").mockImplementation(() => false);

        stream.on("finish", () => {
            expect(stream["pushedResult"]).toBeTruthy();
            done();
        });

        stream.end(); // empty
        setTimeout(()=>{
            expect(stream["pushedResult"]).toBeFalsy();
            jest.spyOn(stream, "push").mockImplementation(() => true);
            stream.emit("drain");
        },50);
    });
});
