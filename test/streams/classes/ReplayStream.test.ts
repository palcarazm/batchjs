import { ReplayStream, ObjectDuplexOptions, NotClosedError } from "../../../src/streams/index";
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

    test("should write data correctly", (done) => {
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
});
