import { HasElementsStream, ObjectDuplexOptions } from "../../../main/streams/index";
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

    test("should send true if not empty", (done) => {
        stream.write("first"); // not empty

        setTimeout(()=>{
            expect(chunks).toEqual([true]);
            done();
        },50);
    });

    test("should send false if empty", (done) => {     
        stream.on("end", () => {
            expect(chunks).toEqual([false]);
            done();
        });

        stream.end(); // empty
    });
});
