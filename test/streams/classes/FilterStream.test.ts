import { FilterStream, FilterStreamOptions, PushError } from "../../../src/streams/index";
describe("FilterStream", () => {
    const options: FilterStreamOptions<string> = {
        filter: (chunk: string) => chunk === "data1" || chunk === "data2",
    };
    let filterStream: FilterStream<string>;
    let chunks: Array<string>;

    beforeEach(() => {
        filterStream = new FilterStream(options);

        chunks = [];
        filterStream.on("data", (chunk: string) => {
            chunks.push(chunk);
        });
    });

    test("should write and read data correctly", (done) => {
        filterStream.on("end", () => {
            expect(chunks).toEqual(["data1", "data2"]);
            done();
        });

        filterStream.write("data1");
        filterStream.write("data2");
        filterStream.write("data3");// Discarded
        filterStream.end();
    });

    test("should handle _final correctly", (done) => {     
        filterStream.on("end", () => {
            expect(filterStream["buffer"].length).toBe(0);
            done();
        });

        filterStream.write("data1");
        filterStream.write("data2");
        filterStream.end();
    });

    test("should not lose data when push is disabled", (done) => {
        jest.spyOn(filterStream, "push").mockImplementation(() => false);

        // No data should be emitted
        filterStream.on("data", () => {
            done.fail("Expected no data was received.");
        });

        filterStream.write("data1");
        filterStream.write("data2");
        filterStream.write("data3"); // Discarded
       
        setTimeout(()=>{
            expect(filterStream["buffer"].length).toBe(2);
            done();
        },200);
    });

    test("should throw PushError when push is disabled in stream end", (done) => {
        jest.spyOn(filterStream, "push").mockImplementation(() => false);

        filterStream.on("error", (err) => {
            expect(err).toBeInstanceOf(PushError);
            done();
        });

        // No data should be emitted
        filterStream.on("data", () => {
            done.fail("Expected error to be thrown but data was received.");
        });

        filterStream.write("data1");
        filterStream.write("data2");
        filterStream.write("data3"); // Discarded
        filterStream.end();
    });

    test("should send discarded data to discard event listener", (done) => {
        // No data should be emitted
        filterStream.on("data", () => {
            done.fail("Expected no data was received.");
        });

        filterStream.on("end", () => {
            expect(filterStream["buffer"].length).toBe(0);
            done();
        });

        filterStream.on("discard", (chunk: string) => {
            expect(["data3","data4","data5"]).toContain(chunk);
        });

        filterStream.write("data3");// Discarded
        filterStream.write("data4");// Discarded
        filterStream.write("data5");// Discarded
        filterStream.end();
    });

    test("should send first discarded data to once discard event", (done) => {
        // No data should be emitted
        filterStream.on("data", () => {
            done.fail("Expected no data was received.");
        });

        filterStream.on("end", () => {
            expect(filterStream["buffer"].length).toBe(0);
            done();
        });

        filterStream.once("discard", (chunk: string) => {
            expect(chunk).toBe("data3");
        });

        filterStream.write("data3");// Discarded
        filterStream.write("data4");// Discarded
        filterStream.write("data5");// Discarded
        filterStream.end();
    });

    test("should send discarded data to active discard events listener", (done) => {
        const listener = (chunk: string) => {
            expect(chunk).toBe("data4");
        };

        // No data should be emitted
        filterStream.on("data", () => {
            done.fail("Expected no data was received.");
        });

        filterStream.on("end", () => {
            expect(filterStream["buffer"].length).toBe(0);
            done();
        });

        filterStream.write("data3");// Discarded
        filterStream.addListener("discard", listener);
        filterStream.write("data4");// Discarded
        filterStream.removeListener("discard", listener);
        filterStream.write("data5");// Discarded
        filterStream.end();
    });

    test("should send discarded data first to prepended discard events listener", (done) => {
        let isFirstListener:boolean = true;

        // No data should be emitted
        filterStream.on("data", () => {
            done.fail("Expected no data was received.");
        });

        filterStream.on("end", () => {
            expect(filterStream["buffer"].length).toBe(0);
            done();
        });

        filterStream.once("discard", () => {
            expect(isFirstListener).toBeFalsy();
            isFirstListener = true;
        });

        filterStream.prependListener("discard", () => {
            expect(isFirstListener).toBeTruthy();
            isFirstListener = false;
        });

        setTimeout(()=>{
            filterStream.write("data3");// Discarded
        }, 50);
        setTimeout(()=>{
            filterStream.write("data4");// Discarded
        }, 100);
        setTimeout(()=>{
            filterStream.write("data5");// Discarded
        }, 150);
        filterStream.end();
    });

    test("should send discarded data first to once prepended discard events listener", (done) => {
        let isFirstListener:boolean = true;
        let isFirstDiscard:boolean = true;

        // No data should be emitted
        filterStream.on("data", () => {
            done.fail("Expected no data was received.");
        });

        filterStream.on("end", () => {
            expect(filterStream["buffer"].length).toBe(0);
            done();
        });

        filterStream.once("discard", () => {
            if(isFirstDiscard){
                expect(isFirstListener).toBeFalsy();
                isFirstListener = true;
                isFirstDiscard = false;
            }else{
                expect(isFirstListener).toBeTruthy();
            }
        });

        filterStream.prependOnceListener("discard", () => {
            expect(isFirstListener).toBeTruthy();
            isFirstListener = false;
        });

        setTimeout(()=>{
            filterStream.write("data3");// Discarded
        }, 50);
        setTimeout(()=>{
            filterStream.write("data4");// Discarded
        }, 100);
        setTimeout(()=>{
            filterStream.write("data5");// Discarded
        }, 150);
        filterStream.end();
    });
});
