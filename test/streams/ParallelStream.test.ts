import { ParallelStreamOptions, ParallelStream, PushError } from "../../src/streams/index";

describe("ParallelStream", () => {
    const options: ParallelStreamOptions<string,string> = {
        maxConcurrent: 2,
        transform(chunk: string) {
            return Promise.resolve(chunk.toUpperCase());
        },
    };
    let parallelStream: ParallelStream<string,string>;
    let chunks: Array<string>;

    beforeEach(() => {
        parallelStream = new ParallelStream(options);

        chunks = [];
        parallelStream.on("data", (chunk: string) => {
            chunks.push(chunk);
        });
    });

    test("should write and read data correctly", (done) => {
        parallelStream.on("end", () => {
            expect(chunks).toEqual(["DATA1", "DATA2","DATA3"]);
            done();
        });

        parallelStream.write("data1");
        parallelStream.write("data2");
        parallelStream.write("data3");
        parallelStream.end();
    });

    test("should handle _final correctly", (done) => {     
        parallelStream.on("end", () => {
            expect(parallelStream["queue"].length).toBe(0);
            expect(parallelStream["buffer"].length).toBe(0);
            done();
        });

        parallelStream.write("data1");
        parallelStream.write("data2");
        parallelStream.write("data3");
        parallelStream.write("data4");
        parallelStream.write("data5");
        parallelStream.write("data6");
        parallelStream.end();
    });

    test("should not lose data when push is disabled", (done) => {
        jest.spyOn(parallelStream, "push").mockImplementation(() => false);

        // No data should be emitted
        parallelStream.on("data", () => {
            done.fail("Expected no data was received.");
        });

        parallelStream.write("data1");
        parallelStream.write("data2");
       
        setTimeout(()=>{
            expect(parallelStream["buffer"].length).toBe(2);
            done();
        },200);
    });

    test("should throw PushError when push is disabled in stream end", (done) => {
        jest.spyOn(parallelStream, "push").mockImplementation(() => false);

        parallelStream.on("error", (err) => {
            expect(err).toBeInstanceOf(PushError);
            done();
        });

        // No data should be emitted
        parallelStream.on("data", () => {
            done.fail("Expected error to be thrown but data was received.");
        });

        parallelStream.write("data1");
        parallelStream.write("data2");
        parallelStream.end();
    });

    test("should throw Error when Async transform throws", (done) => {
        let isDone = false;
        parallelStream = new ParallelStream({...options,
            transform() {
                return Promise.reject(new Error("transform error"));
            },
        });

        parallelStream.on("error", (err) => {
            if(!isDone){
                isDone=true;
                expect(err).toBeInstanceOf(Error);
                done();
            }

        });

        // No data should be emitted
        parallelStream.on("data", () => {
            done.fail("Expected error to be thrown but data was received.");
        });

        parallelStream.write("data1");
        parallelStream.write("data2");
        parallelStream.end();
    });
});
