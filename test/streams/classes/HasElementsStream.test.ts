import { HasElementsStream, HasElementsStreamOptions, PushError } from "../../../src/streams/index";
describe("HasElementsStream", () => {
    const options: HasElementsStreamOptions = {};
    let stream: HasElementsStream<string>;
    let chunks: Array<boolean>;

    beforeEach(() => {
        stream = new HasElementsStream(options);

        chunks = [];
        stream.on("data", (chunk: boolean) => {
            chunks.push(chunk);
        });
    });

    test("should write and read data correctly", (done) => {
        stream.write("first"); // not empty

        setTimeout(()=>{
            expect(chunks).toEqual([true]);
            done();
        },50);
    });

    test("should handle _final correctly", (done) => {     
        stream.on("end", () => {
            expect(chunks).toEqual([false]);
            done();
        });

        stream.end(); // empty
    });

    test("should throw PushError when push is disabled in stream end", (done) => {
        jest.spyOn(stream, "push").mockImplementation(() => false);

        stream.on("error", (err) => {
            expect(err).toBeInstanceOf(PushError);
            done();
        });

        stream.end(); // empty
    });
});
