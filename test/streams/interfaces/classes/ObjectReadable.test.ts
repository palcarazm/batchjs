import { ObjectReadable } from "../../../../src/streams/interfaces/_index";

describe("ObjectReadable", () => {
class ObjectReadableImplementation extends ObjectReadable<string> {
        constructor(){
            super({objectMode: true});
        }
        _read(size: number) {
            this.push("data1");
            this.push("data2");
            this.push("data3");
            this.push(null);
        }
    }
    let stream: ObjectReadableImplementation;
    let chunks: Array<string>;

    beforeEach(() => {
        stream = new ObjectReadableImplementation();
        chunks = [];
    });

    test("should handle _read data correctly", (done) => {
        stream.on("readable", () => {
            let chunk;
            while ((chunk = stream.read()) !== null) {
              chunks.push(chunk);
            }
          });
        
          stream.on("end", () => {
            expect(chunks).toEqual(["data1","data2","data3"]);
            done();
          });
    });
});
