import { ParallelStreamOptions, ParallelStream } from "../../../src/streams/index";

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

    test("should write and read data correctly", (done) => {
        stream.on("end", () => {
            expect(chunks).toEqual(["DATA1", "DATA2","DATA3"]);
            done();
        });

        stream.write("data1");
        stream.write("data2");
        stream.write("data3");
        stream.end();
    });

    test("should handle _final correctly", (done) => {     
        stream.on("end", () => {
            expect(stream["queue"].length).toBe(0);
            expect(stream["buffer"].length).toBe(0);
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

    test("should not lose data when push is disabled", (done) => {
        jest.spyOn(stream, "push").mockImplementation(() => false);

        // No data should be emitted
        stream.on("data", () => {
            done.fail("Expected no data was received.");
        });

        stream.write("data1");
        stream.write("data2");
       
        setTimeout(()=>{
            expect(stream["buffer"].length).toBe(2);
            done();
        },200);
    });

    test("should wait for drain when push is disabled in stream end", (done) => {
        jest.spyOn(stream, "push").mockImplementation(() => false);

        stream.on("finish", () => {
            expect(stream["buffer"].length).toBe(0);
            done();
        });

        // No data should be emitted
        stream.on("data", () => {
            done.fail("Expected error to be thrown but data was received.");
        });

        stream.write("data1");
        stream.write("data2");
        stream.end();
        setTimeout(()=>{
            expect(stream["buffer"].length).toBe(2);
            jest.spyOn(stream, "push").mockImplementation(() => true);
            stream.emit("drain");
        },50);
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
