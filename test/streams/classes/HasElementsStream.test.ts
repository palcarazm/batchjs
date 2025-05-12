import { HasElementsStream, ObjectDuplexOptions } from "../../../src/streams/index";
describe("HasElementsStream", () => {
    const options: ObjectDuplexOptions = {};
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
});
