import { ObjectWritable } from "../../../../main/streams";

class ObjectWritableImplementation extends ObjectWritable<string> {
    public chunks: Array<string> = [];
    constructor() {
        super({ objectMode: true });
    }
    _write(){/** no-op */}
}

describe("ObjectWritableEvents", () => {
    let writable: ObjectWritable<string>;
    let eventsCount:Map<string, number>;

    beforeEach(() => {
        writable = new ObjectWritableImplementation();
        eventsCount=new Map<string, number>();
    });

    describe("emit()", () => {
        it("should send event to all listeners", (done) => {
            writable.on("drain", () => {
                eventsCount.set("drain-1", (eventsCount.get("drain-1") || 0) + 1);
            }).on("drain", () => {
                eventsCount.set("drain-2", (eventsCount.get("drain-2") || 0) + 1);
            }).once("finish", () => {
                expect(eventsCount.get("drain-1")).toBe(3);
                expect(eventsCount.get("drain-2")).toBe(3);
                done();
            });

            writable.emit("drain");
            writable.emit("drain");
            writable.emit("drain");
            writable.emit("finish");
        });
    });

    describe("on()", () => {
        it("should add listener", (done) => {
            writable.on("drain", () => {
                eventsCount.set("drain", (eventsCount.get("drain") || 0) + 1);
            }).once("finish", () => {
                expect(eventsCount.get("drain")).toBe(3);
                done();
            });

            writable.emit("drain");
            writable.emit("drain");
            writable.emit("drain");
            writable.emit("finish");
        });
    });

    describe("once()", () => {
        it("should add one time listener", (done) => {
            writable.once("drain", () => {
                eventsCount.set("drain", (eventsCount.get("drain") || 0) + 1);
            }).once("finish", () => {
                expect(eventsCount.get("drain")).toBe(1);
                done();
            });

            writable.emit("drain");
            writable.emit("drain");
            writable.emit("drain");
            writable.emit("finish");
        });
    });

    describe("addListener()", () => {
        it("should add listener", (done) => {
            writable.addListener("drain", () => {
                eventsCount.set("drain", (eventsCount.get("drain") || 0) + 1);
            }).once("finish", () => {
                expect(eventsCount.get("drain")).toBe(3);
                done();
            });

            writable.emit("drain");
            writable.emit("drain");
            writable.emit("drain");
            writable.emit("finish");
        });
    });

    describe("prependListener()", () => {
        test("should send event first to prepend events listener", (done) => {
            let isFirstListener:boolean = true;

            writable.on("finish", () => {
                done();
            });

            writable.on("drain", () => {
                expect(isFirstListener).toBeFalsy();
                isFirstListener = true;
            });

            writable.prependListener("drain", () => {
                expect(isFirstListener).toBeTruthy();
                isFirstListener = false;
            });

            setTimeout(()=>{
                writable.emit("drain");
            }, 25);
            setTimeout(()=>{
                writable.emit("drain");
            }, 50);
            setTimeout(()=>{
                writable.emit("drain");
            }, 75);
            writable.emit("finish");
        });
    });

    describe("prependOnceListener()", () => {
        it("should send event to one time prepend events listener", (done) => {
            let isFirstListener:boolean = true;
            let isFirstDiscard:boolean = true;

            writable.on("finish", () => {
                done();
            });

            writable.on("drain", () => {
                if(isFirstDiscard){
                    expect(isFirstListener).toBeFalsy();
                    isFirstListener = true;
                    isFirstDiscard = false;
                }else{
                    expect(isFirstListener).toBeTruthy();
                }
            });

            writable.prependOnceListener("drain", () => {
                expect(isFirstListener).toBeTruthy();
                isFirstListener = false;
            });

            setTimeout(()=>{
                writable.emit("drain");
            }, 25);
            setTimeout(()=>{
                writable.emit("drain");
            }, 50);
            setTimeout(()=>{
                writable.emit("drain");
            }, 75);
            writable.emit("finish");
        });
    });

    describe("removeListener()", () => {
        it("should remove listener", (done) => {
            const listener = () => {
                eventsCount.set("drain-1", (eventsCount.get("drain-1") || 0) + 1);
            };

            writable
                .on("drain", listener)
                .on("drain", () => {
                    eventsCount.set("drain-2", (eventsCount.get("drain-2") || 0) + 1);
                })
                .once("finish", () => {
                    expect(eventsCount.get("drain-1")).toBe(1);
                    expect(eventsCount.get("drain-2")).toBe(2);
                    done();
                });

            writable.emit("drain");
            writable.removeListener("drain", listener);

            writable.emit("drain"); // should be ignored by listener 1 because is removed
            writable.emit("finish");
        });
    });

    describe("off()", () => {
        it("should remove listener", (done) => {
            const listener = () => {
                eventsCount.set("drain-1", (eventsCount.get("drain-1") || 0) + 1);
            };

            writable
                .on("drain", listener)
                .on("drain", () => {
                    eventsCount.set("drain-2", (eventsCount.get("drain-2") || 0) + 1);
                })
                .once("finish", () => {
                    expect(eventsCount.get("drain-1")).toBe(1);
                    expect(eventsCount.get("drain-2")).toBe(2);
                    done();
                });

            writable.emit("drain");
            writable.off("drain", listener);

            writable.emit("drain"); // should be ignored by listener 1 because is removed
            writable.emit("finish");
        });
    });

    describe("removeAllListeners()", () => {
        it("should remove listener", (done) => {
            writable
                .on("drain", () => {
                    eventsCount.set("drain-1", (eventsCount.get("drain-1") || 0) + 1);
                })
                .on("drain", ()=>{
                    eventsCount.set("drain-2", (eventsCount.get("drain-2") || 0) + 1);
                })
                .once("finish", () => {
                    expect(eventsCount.get("drain-1")).toBe(1);
                    expect(eventsCount.get("drain-2")).toBe(1);
                    done();
                });

            writable.emit("drain");
            writable.removeAllListeners("drain");

            writable.emit("drain"); // should be ignored by all listeners because is removed
            writable.emit("finish");
        });
    });

    describe("listeners()", () => {
        it("should return all listeners of the provided event", () => {
            const listener1 = () => { eventsCount.set("drain-1", (eventsCount.get("drain") || 0) + 1);};
            const listener2 = () => { eventsCount.set("drain-2", (eventsCount.get("drain") || 0) + 1);};
            writable.on("drain", listener1)
                .on("drain", listener2);

            expect(writable.listeners("finish")).toHaveLength(0);
            expect(writable.listeners("drain")).toHaveLength(2);
            expect(writable.listeners("drain")).toStrictEqual([listener1, listener2]);
        });
    });

    describe("listenerCount()", () => {
        it("should return the listeners count of the provided event", () => {
            const listener1 = () => { eventsCount.set("drain-1", (eventsCount.get("drain") || 0) + 1);};
            const listener2 = () => { eventsCount.set("drain-2", (eventsCount.get("drain") || 0) + 1);};
            writable.on("drain", listener1)
                .on("drain", listener2);

            expect(writable.listenerCount("finish")).toBe(0);
            expect(writable.listenerCount("drain")).toBe(2);
        });
    });
});
