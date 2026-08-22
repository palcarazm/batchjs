import { ParallelStreamOptions, ParallelStream } from "../../../main/streams/index";

describe("ParallelStream", () => {
    const options: ParallelStreamOptions<string,string> = {
        maxConcurrent: 2,
        transform(chunk: string) {
            return Promise.resolve(chunk.toUpperCase());
        },
    };
    let stream: ParallelStream<string,string>;
    let chunks: Array<string>;

    beforeEach(() => {
        stream = new ParallelStream(options);

        chunks = [];
        stream.on("data", (chunk: string) => {
            chunks.push(chunk);
        });
    });

    test("should write data correctly", (done) => {
        stream.on("end", () => {
            expect(chunks).toEqual(["DATA1", "DATA2","DATA3"]);
            done();
        });

        stream.write("data1");
        stream.write("data2");
        stream.write("data3");
        stream.end();
    });

    test("should await all data been processed to finish", (done) => {     
        stream.on("end", () => {
            expect(stream["queue"]).toHaveLength(0);
            expect(stream["buffer"]).toHaveLength(0);
            done();
        });

        stream.write("data1");
        stream.write("data2");
        stream.write("data3");
        stream.write("data4");
        stream.write("data5");
        stream.write("data6");
        stream.end();
    });

    test("should throw Error when Async transform throws", (done) => {
        let isDone = false;
        stream = new ParallelStream({...options,
            transform() {
                return Promise.reject(new Error("transform error"));
            },
        });

        stream.on("error", (err) => {
            if(!isDone){
                isDone=true;
                expect(err).toBeInstanceOf(Error);
                done();
            }

        });

        // No data should be emitted
        stream.on("data", () => {
            done.fail("Expected error to be thrown but data was received.");
        });

        stream.write("data1");
        stream.write("data2");
        stream.end();
    });
});
