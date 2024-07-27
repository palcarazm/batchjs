import { ReplayStream, ObjectDuplexOptions, PushError, NotClosedError } from "../../../src/streams/index";
describe("ReplayStream", () => {
    const options: ObjectDuplexOptions = {};
    let stream: ReplayStream<string>;
    let chunks: Array<string>;

    beforeEach(() => {
        stream = new ReplayStream(options);

        chunks = [];
        stream.on("data", (chunk: string) => {
            chunks.push(chunk);
        });
    });

    test("should write and read data correctly", (done) => {
        stream.on("end", () => {
            expect(chunks).toEqual(["data1","data2","data3"]);
            done();
        });

        stream.write("data1");
        stream.write("data2");
        stream.write("data3");
        stream.end();
    });

    test("should replay the pushed data", (done) => {
        stream.on("close", () => {
            const  replayedChunks: Array<string>=[];

            stream.replay().on("data", (chunk: string) => {
                replayedChunks.push(chunk);
            }).once("end", () => {
                expect(replayedChunks).toEqual(chunks);
                done();
            });
        });

        stream.write("data1");
        stream.write("data2");
        stream.write("data3");
        stream.end();
    });

    test("should not be replayed since stream is closed", () => {
        stream.write("data1");
        stream.write("data2");
        stream.write("data3");

        expect(()=>{stream.replay();}).toThrow(NotClosedError);
    });

    test("should handle _final correctly", (done) => {     
        stream.on("end", () => {
            expect(stream["buffer"].length).toBe(stream["index"]);
            done();
        });

        stream.write("data1");
        stream.write("data2");
        stream.write("data3");
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
        stream.write("data3");
       
        setTimeout(()=>{
            expect(stream["buffer"].length).toBe(3);
            expect(stream["index"]).toBe(0);
            done();
        },200);
    });

    test("should throw PushError when push is disabled in stream end", (done) => {
        jest.spyOn(stream, "push").mockImplementation(() => false);

        stream.on("error", (err) => {
            expect(err).toBeInstanceOf(PushError);
            done();
        });

        // No data should be emitted
        stream.on("data", () => {
            done.fail("Expected error to be thrown but data was received.");
        });

        stream.write("data1");
        stream.write("data2");
        stream.write("data3");
        stream.end();
    });
});
