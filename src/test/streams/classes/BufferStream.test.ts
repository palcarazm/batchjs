import { BufferStream, BufferStreamOptions } from "../../../main/streams/index";
import { SlowWritable } from "../TestUtils";

describe("BufferStream", () => {
    const options: BufferStreamOptions = {
        batchSize: 2,
    };
    let stream: BufferStream<string>;
    let slowWritable: SlowWritable<string>;
    let  chunks: Array<Array<string>>;

    beforeEach(() => {
        stream = new BufferStream(options);
        slowWritable = new SlowWritable<string>({highWaterMark: 1});

        chunks = [];
        stream.on("data", (chunk: Array<string>) => {
            chunks.push(chunk);
        });
    });

    test("should write and read data correctly", (done) => {
        stream.on("finish", () => {
            expect(chunks).toEqual([["data1", "data2"], ["data3"]]);
            done();
        });

        stream.write("data1");
        stream.write("data2");
        stream.write("data3");
        stream.end();
    });

    test("should handle _final correctly", (done) => {     
        stream.on("finish", () => {
            expect(stream["buffer"]).toHaveLength(0);
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
        for (let i = 1; i <= 20; i++) {
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
                ["1","2"],["3","4"],["5","6"],["7","8"],["9","10"],["11","12"],["13","14"],["15","16"],["17","18"],["19","20"]
            ]);
            done();
        });
    },10000);
});
