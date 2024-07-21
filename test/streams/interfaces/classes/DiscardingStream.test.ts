import { TransformCallback } from "stream";
import { DiscardingStream } from "../../../../src/streams/index";

describe("DiscardingStream", () => {
    class DiscardingStreamImplementation extends DiscardingStream<string> {
        constructor(){
            super({objectMode: true});
        }

        _write(chunk: string, encoding: BufferEncoding, callback: TransformCallback): void {
            this.emit("discard", chunk);
            callback();
        }

        _final(callback: TransformCallback): void {
            this.push(null);
            callback();
        }

        _read(): void {}
    }
    let stream: DiscardingStreamImplementation;
    let chunks: Array<string>;

    beforeEach(() => {
        stream = new DiscardingStreamImplementation();

        chunks = [];
        stream.on("data", (chunk: string) => {
            chunks.push(chunk);
        });
    });

    test("should send discarded data to discard event listener", (done) => {
        // No data should be emitted
        stream.on("data", () => {
            done.fail("Expected no data was received.");
        });

        stream.on("end", () => {
            done();
        });

        stream.on("discard", (chunk: string) => {
            expect(["data1","data2","data3"]).toContain(chunk);
        });

        stream.write("data1");// Discarded
        stream.write("data2");// Discarded
        stream.write("data3");// Discarded
        stream.end();
    });

    test("should send first discarded data to once discard event", (done) => {
        // No data should be emitted
        stream.on("data", () => {
            done.fail("Expected no data was received.");
        });

        stream.on("end", () => {
            done();
        });

        stream.once("discard", (chunk: string) => {
            expect(chunk).toBe("data1");
        });

        stream.write("data1");// Discarded
        stream.write("data2");// Discarded
        stream.write("data3");// Discarded
        stream.end();
    });

    test("should send discarded data to active discard events listener", (done) => {
        const listener = (chunk: string) => {
            expect(chunk).toBe("data2");
        };

        // No data should be emitted
        stream.on("data", () => {
            done.fail("Expected no data was received.");
        });

        stream.on("end", () => {
            done();
        });

        stream.write("data1");// Discarded
        stream.addListener("discard", listener);
        stream.write("data2");// Discarded
        stream.removeListener("discard", listener);
        stream.write("data3");// Discarded
        stream.end();
    });

    test("should send discarded data first to prepended discard events listener", (done) => {
        let isFirstListener:boolean = true;

        // No data should be emitted
        stream.on("data", () => {
            done.fail("Expected no data was received.");
        });

        stream.on("end", () => {
            done();
        });

        stream.once("discard", () => {
            expect(isFirstListener).toBeFalsy();
            isFirstListener = true;
        });

        stream.prependListener("discard", () => {
            expect(isFirstListener).toBeTruthy();
            isFirstListener = false;
        });

        setTimeout(()=>{
            stream.write("data1");// Discarded
        }, 50);
        setTimeout(()=>{
            stream.write("data2");// Discarded
        }, 100);
        setTimeout(()=>{
            stream.write("data3");// Discarded
        }, 150);
        stream.end();
    });

    test("should send discarded data first to once prepended discard events listener", (done) => {
        let isFirstListener:boolean = true;
        let isFirstDiscard:boolean = true;

        // No data should be emitted
        stream.on("data", () => {
            done.fail("Expected no data was received.");
        });

        stream.on("end", () => {
            done();
        });

        stream.once("discard", () => {
            if(isFirstDiscard){
                expect(isFirstListener).toBeFalsy();
                isFirstListener = true;
                isFirstDiscard = false;
            }else{
                expect(isFirstListener).toBeTruthy();
            }
        });

        stream.prependOnceListener("discard", () => {
            expect(isFirstListener).toBeTruthy();
            isFirstListener = false;
        });

        setTimeout(()=>{
            stream.write("data1");// Discarded
        }, 50);
        setTimeout(()=>{
            stream.write("data2");// Discarded
        }, 100);
        setTimeout(()=>{
            stream.write("data3");// Discarded
        }, 150);
        stream.end();
    });
});
