import { DistinctStream, DistinctStreamOptions } from "../../../main/streams/index";
describe("DistinctStream", () => {
    const options: DistinctStreamOptions<string,string> = {
        keyExtractor: (chunk: string) => chunk,
    };
    let stream: DistinctStream<string,string>;
    let chunks: Array<string>;

    beforeEach(() => {
        stream = new DistinctStream(options);

        chunks = [];
        stream.on("data", (chunk: string) => {
            chunks.push(chunk);
        });
    });

    test("should write data correctly", (done) => {
        stream.on("finish", () => {
            expect(chunks).toEqual(["data1", "data2"]);
            done();
        });

        stream.write("data1");
        stream.write("data2");
        stream.write("data1"); //Duplicated
        stream.end();
    });

    test("should send duplicated data to discard event listener", (done) => {
        stream.on("finish", () => {
            expect(stream["buffer"].length).toBe(0);
            done();
        });

        stream.on("discard", (chunk: string) => {
            expect(["data1","data2"]).toContain(chunk);
        });

        stream.write("data1");
        stream.write("data2");
        stream.write("data1"); //Duplicated
        stream.write("data2"); //Duplicated
        stream.end();
    });
});
