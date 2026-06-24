import { TransformCallback } from "node:stream";
import { InternalBufferDuplex } from "../../../../main/streams/interfaces/_index";
import { SlowWritable } from "../../TestUtils";

describe("InternalBufferDuplex", () => {
    class InternalBufferDuplexImplementation extends InternalBufferDuplex<string,string> {
        constructor(){
            super({objectMode: true});
        }

        _write(chunk: string, encoding: BufferEncoding, callback: TransformCallback): void {
            this.buffer.push(chunk);
            callback();
        }
    }
    let stream: InternalBufferDuplexImplementation;
    let slowWritable: SlowWritable<string>;
    let chunks: Array<string>;

    beforeEach(() => {
        stream = new InternalBufferDuplexImplementation();
        slowWritable = new SlowWritable<string>({highWaterMark: 1});

        chunks = [];
        stream.on("data", (chunk: string) => {
            chunks.push(chunk);
        });
    });

    test("should handle _read data correctly", (done) => {
        stream.on("end", () => {
            expect(chunks).toEqual(["data1","data2","data3"]);
            done();
        });

        stream.write("data1");
        stream.write("data2");
        stream.write("data3");
        stream.end();
    });

    test("should handle _final correctly", (done) => {     
        stream.on("finish", () => {
            expect(stream["buffer"].length).toBe(0);
            done();
        });

        stream.write("data1");
        stream.write("data2");
        stream.end();
    });

    test("should flush batches in order and respect backpressure", (done) => {  
        let drainCalled = false;
        let endCallbackCalled = false;

        const originalPush = stream.push.bind(stream);
        const pushMock = jest.spyOn(stream, "push").mockImplementation((chunk: string) => {
            const result = originalPush(chunk);
            if (chunk === null) return true;

            if (pushMock.mock.calls.length <= 3) {
                setImmediate(() => stream.emit("drain"));
                return false;
            }
            return result;
        });

        slowWritable.once("drain", () => {
            drainCalled = true;
        });
    
        stream.pipe(slowWritable);
    
        // Write data
        for (let i = 1; i <= 10; i++) {
            stream.write(`${i}`);
        }
    
        // End stream
        stream.end(() => {
            endCallbackCalled = true;
        });
    
        slowWritable.on("finish", () => {
            expect(endCallbackCalled).toBe(true);
            expect(drainCalled).toBe(true);
            expect(slowWritable.chunks).toEqual([
                "1","2","3","4","5","6","7","8","9","10"
            ]);
            done();
        });
    },10000);
});
