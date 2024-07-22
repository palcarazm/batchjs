import { AnyMatchStream, AnyMatchStreamOptions, PushError } from "../../../src/streams/index";
describe("AnyMatchStream", () => {
    const options: AnyMatchStreamOptions<string> = {
        matcher: (chunk: string) => chunk.length > 2
    };
    let stream: AnyMatchStream<string>;
    let chunks: Array<boolean>;

    beforeEach(() => {
        stream = new AnyMatchStream(options);

        chunks = [];
        stream.on("data", (chunk: boolean) => {
            chunks.push(chunk);
        });
    });

    test("should write and read data correctly", (done) => {
        stream.write("1"); // not match
        stream.write("2"); // not match
        stream.write("third"); // match

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

        stream.write("1"); // not match
        stream.write("2"); // not match
        stream.end();
    });

    test("should throw PushError when push is disabled in stream end", (done) => {
        jest.spyOn(stream, "push").mockImplementation(() => false);

        stream.on("error", (err) => {
            expect(err).toBeInstanceOf(PushError);
            done();
        });

        stream.write("1"); // not match
        stream.write("2"); // not match
        stream.end();
    });

    test("should emit discard event when data does not match", (done) => {     
        const matched : Array<string> =[];

        stream.on("discard", (chunk: string) => {
            matched.push(chunk);
        });

        stream.on("end", () => {
            expect(chunks).toEqual([false]);
            expect(matched).toEqual(["zero","third"]);
            done();
        });

        stream.write("zero"); // match
        stream.write("1"); // not match
        stream.write("2"); // not match
        stream.write("third"); // match
        stream.end();
    });
});
