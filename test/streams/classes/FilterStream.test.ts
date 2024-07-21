import { FilterStream, FilterStreamOptions, PushError } from "../../../src/streams/index";
describe("FilterStream", () => {
    const options: FilterStreamOptions<string> = {
        filter: (chunk: string) => chunk === "data1" || chunk === "data2",
    };
    let stream: FilterStream<string>;
    let chunks: Array<string>;

    beforeEach(() => {
        stream = new FilterStream(options);

        chunks = [];
        stream.on("data", (chunk: string) => {
            chunks.push(chunk);
        });
    });

    test("should write and read data correctly", (done) => {
        stream.on("end", () => {
            expect(chunks).toEqual(["data1", "data2"]);
            done();
        });

        stream.write("data1");
        stream.write("data2");
        stream.write("data3");// Discarded
        stream.end();
    });

    test("should handle _final correctly", (done) => {     
        stream.on("end", () => {
            expect(stream["buffer"].length).toBe(0);
            done();
        });

        stream.write("data1");
        stream.write("data2");
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
        stream.write("data3"); // Discarded
       
        setTimeout(()=>{
            expect(stream["buffer"].length).toBe(2);
            done();
        },200);
    });

    test("should throw PushError when push is disabled in stream end", (done) => {
        jest.spyOn(stream, "push").mockImplementation(() => false);

        stream.on("error", (err) => {
            expect(err).toBeInstanceOf(PushError);
            done();
        });

        // No data should be emitted
        stream.on("data", () => {
            done.fail("Expected error to be thrown but data was received.");
        });

        stream.write("data1");
        stream.write("data2");
        stream.write("data3"); // Discarded
        stream.end();
    });

    test("should send discarded data to discard event listener", (done) => {
        // No data should be emitted
        stream.on("data", () => {
            done.fail("Expected no data was received.");
        });

        stream.on("end", () => {
            expect(stream["buffer"].length).toBe(0);
            done();
        });

        stream.on("discard", (chunk: string) => {
            expect(["data3","data4","data5"]).toContain(chunk);
        });

        stream.write("data3");// Discarded
        stream.write("data4");// Discarded
        stream.write("data5");// Discarded
        stream.end();
    });

    test("should send first discarded data to once discard event", (done) => {
        // No data should be emitted
        stream.on("data", () => {
            done.fail("Expected no data was received.");
        });

        stream.on("end", () => {
            expect(stream["buffer"].length).toBe(0);
            done();
        });

        stream.once("discard", (chunk: string) => {
            expect(chunk).toBe("data3");
        });

        stream.write("data3");// Discarded
        stream.write("data4");// Discarded
        stream.write("data5");// Discarded
        stream.end();
    });

    test("should send discarded data to active discard events listener", (done) => {
        const listener = (chunk: string) => {
            expect(chunk).toBe("data4");
        };

        // No data should be emitted
        stream.on("data", () => {
            done.fail("Expected no data was received.");
        });

        stream.on("end", () => {
            expect(stream["buffer"].length).toBe(0);
            done();
        });

        stream.write("data3");// Discarded
        stream.addListener("discard", listener);
        stream.write("data4");// Discarded
        stream.removeListener("discard", listener);
        stream.write("data5");// Discarded
        stream.end();
    });

    test("should send discarded data first to prepended discard events listener", (done) => {
        let isFirstListener:boolean = true;

        // No data should be emitted
        stream.on("data", () => {
            done.fail("Expected no data was received.");
        });

        stream.on("end", () => {
            expect(stream["buffer"].length).toBe(0);
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
            stream.write("data3");// Discarded
        }, 50);
        setTimeout(()=>{
            stream.write("data4");// Discarded
        }, 100);
        setTimeout(()=>{
            stream.write("data5");// Discarded
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
            expect(stream["buffer"].length).toBe(0);
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
            stream.write("data3");// Discarded
        }, 50);
        setTimeout(()=>{
            stream.write("data4");// Discarded
        }, 100);
        setTimeout(()=>{
            stream.write("data5");// Discarded
        }, 150);
        stream.end();
    });
});
