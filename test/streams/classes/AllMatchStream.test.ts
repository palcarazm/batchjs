import { AllMatchStream, AllMatchStreamOptions } from "../../../src/streams/index";
describe("AllMatchStream", () => {
    const options: AllMatchStreamOptions<string> = {
        matcher: (chunk: string) => chunk.length > 2
    };
    let stream: AllMatchStream<string>;
    let chunks: Array<boolean>;

    beforeEach(() => {
        stream = new AllMatchStream(options);

        chunks = [];
        stream.on("data", (chunk: boolean) => {
            chunks.push(chunk);
        });
    });

    test("should write and read data correctly", (done) => {
        stream.write("first"); // match
        stream.write("second"); // match
        stream.write("3"); // not match

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

        stream.write("first"); // match
        stream.write("second"); // match
        stream.end();
    });

    test("should wait for drain when push is disabled in stream end", (done) => {
        jest.spyOn(stream, "push").mockImplementation(() => false);

        stream.on("finish", () => {
            expect(stream["pushedResult"]).toBeTruthy();
            done();
        });

        stream.write("first"); // match
        stream.write("second"); // match
        stream.end();

        setTimeout(()=>{
            expect(stream["pushedResult"]).toBeFalsy();
            jest.spyOn(stream, "push").mockImplementation(() => true);
            stream.emit("drain");
        },50);
    });

    test("should emit discard event when data does not match", (done) => {     
        const unmatched : Array<string> =[];

        stream.on("discard", (chunk: string) => {
            unmatched.push(chunk);
        });

        stream.on("end", () => {
            expect(chunks).toEqual([false]);
            expect(unmatched).toEqual(["0","3"]);
            done();
        });

        stream.write("0"); // not match
        stream.write("first"); // match
        stream.write("second"); // match
        stream.write("3"); // not match
        stream.end();
    });
});
