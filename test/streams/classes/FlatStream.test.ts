import { FlatStream, ObjectDuplexOptions } from "../../../src/streams/index";
describe("FlatStream", () => {
    const options: ObjectDuplexOptions = {};
    let stream: FlatStream<string>;
    let chunks: Array<string>;

    beforeEach(() => {
        stream = new FlatStream(options);

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

        stream.write(["data1", "data2"]);
        stream.write(["data3"]);
        stream.end();
    });
});
