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

    test("should send false if not empty", (done) => {
        stream.write("first"); // not empty

        setTimeout(()=>{
            expect(chunks).toEqual([false]);
            done();
        },50);
    });

    test("should send true if empty", (done) => {     
        stream.on("end", () => {
            expect(chunks).toEqual([true]);
            done();
        });

        stream.end(); // empty
    });
});
