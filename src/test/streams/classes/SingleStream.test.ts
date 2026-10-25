import { SingleStream, ObjectDuplexOptions, SingleStreamError } from "../../../main/streams/index";

describe("SingleStream", () => {
    const options: ObjectDuplexOptions = {};
    let stream: SingleStream<string>;
    let chunks: Array<string>;

    beforeEach(() => {
        stream = new SingleStream(options);

        chunks = [];
        stream.on("data", (chunk: string) => {
            chunks.push(chunk);
        });
    });

    test("should write data correctly", (done) => {
        stream.on("end", () => {
            expect(chunks).toEqual(["data1"]);
            done();
        });

        stream.write("data1");
        stream.end();
    });

    
    test("should throw SingleStreamError when more than one chunk is received", (done) => {
        stream.once("error", (err) => {
            expect(err).toBeInstanceOf(SingleStreamError);
            expect(chunks).toEqual(["data1"]);
            done();
        });

        stream.write("data1");
        setTimeout(()=>{
            stream.write("data2"); // This should launch error
            stream.end();
        },50);
    });
});
