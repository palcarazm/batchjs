/// <reference types="jest" />
/// <reference types="node" />
import { ObjectReadable } from "../../../../main/streams";

class ObjectReadableImplementation extends ObjectReadable<string> {
    constructor(){
        super({objectMode: true});
    }
    _read() {/** no-op */}
}

describe("ObjectReadableEvents", () => {
    let readable: ObjectReadable<string>;
    let eventsCount:Map<string, number>;

    beforeEach(() => {
        readable = new ObjectReadableImplementation();
        eventsCount=new Map<string, number>();
    });

    describe("emit()", () => {
        it("should send event to all listeners", (done) => {
            readable.on("data", () => {
                eventsCount.set("data-1", (eventsCount.get("data-1") || 0) + 1);
            }).on("data", () => {
                eventsCount.set("data-2", (eventsCount.get("data-2") || 0) + 1);
            }).once("end", () => {
                expect(eventsCount.get("data-1")).toBe(3);
                expect(eventsCount.get("data-2")).toBe(3);
                done();
            });

            readable.emit("data");
            readable.emit("data");
            readable.emit("data");
            readable.emit("end");
        });

        it("should send data to listener", (done) => {
            readable.on("data", (data: string) => {
                expect(data).toBe("test");
            }).once("end", () => {
                done();
            });

            readable.emit("data", "test");
            readable.emit("data", "test");
            readable.emit("data", "test");
            readable.emit("end");
        });
    });

    describe("on()", () => {
        it("should add listener", (done) => {
            readable.on("data", () => {
                eventsCount.set("data", (eventsCount.get("data") || 0) + 1);
            }).once("end", () => {
                expect(eventsCount.get("data")).toBe(3);
                done();
            });

            readable.emit("data");
            readable.emit("data");
            readable.emit("data");
            readable.emit("end");
        });

        it("should send data to active listener", (done) => {

            const listener = (data: string) => {
                expect(data).toBe("2");
            };

            readable.on("end", () => {
                done();
            });

            readable.emit("data", "1"); // should be ignored no active listener

            readable.on("data", listener);
            readable.emit("data", "2");
            readable.removeListener("data", listener);

            readable.emit("data", "3");// should be ignored no active listener

            readable.emit("end");
        });
    });

    describe("once()", () => {
        it("should add one time listener", (done) => {
            readable.once("data", () => {
                eventsCount.set("data", (eventsCount.get("data") || 0) + 1);
            }).once("end", () => {
                expect(eventsCount.get("data")).toBe(1);
                done();
            });

            readable.emit("data");
            readable.emit("data");
            readable.emit("data");
            readable.emit("end");
        });
        
        it("should send data to active one time listener", (done) => {
            const listener = (data: string) => {
                expect(data).toBe("2");
            };

            readable.on("end", () => {
                done();
            });

            readable.emit("data", "1"); // should be ignored no active listener

            readable.once("data", listener);
            readable.emit("data", "2");

            readable.emit("data", "3");// should be ignored because listener is one time

            readable.emit("end");
        });
    });

    describe("addListener()", () => {
        it("should add listener", (done) => {
            readable.addListener("data", () => {
                eventsCount.set("data", (eventsCount.get("data") || 0) + 1);
            }).once("end", () => {
                expect(eventsCount.get("data")).toBe(3);
                done();
            });

            readable.emit("data");
            readable.emit("data");
            readable.emit("data");
            readable.emit("end");
        });

        it("should send data to active listener", (done) => {
            const listener = (data: string) => {
                expect(data).toBe("2");
            };

            readable.on("end", () => {
                done();
            });

            readable.emit("data", "1"); // should be ignored no active listener

            readable.addListener("data", listener);
            readable.emit("data", "2");
            readable.removeListener("data", listener);

            readable.emit("data", "3");// should be ignored no active listener

            readable.emit("end");
        });
    });

    describe("prependListener()", () => {
        test("should send event first to prepend events listener", (done) => {
            let isFirstListener:boolean = true;

            readable.on("end", () => {
                done();
            });

            readable.on("data", () => {
                expect(isFirstListener).toBeFalsy();
                isFirstListener = true;
            });

            readable.prependListener("data", () => {
                expect(isFirstListener).toBeTruthy();
                isFirstListener = false;
            });

            setTimeout(()=>{
                readable.emit("data");
            }, 25);
            setTimeout(()=>{
                readable.emit("data");
            }, 50);
            setTimeout(()=>{
                readable.emit("data");
            }, 75);
            readable.emit("end");
        });
    });

    describe("prependOnceListener()", () => {
        it("should send event to one time prepend events listener", (done) => {
            let isFirstListener:boolean = true;
            let isFirstDiscard:boolean = true;

            readable.on("end", () => {
                done();
            });

            readable.on("data", () => {
                if(isFirstDiscard){
                    expect(isFirstListener).toBeFalsy();
                    isFirstListener = true;
                    isFirstDiscard = false;
                }else{
                    expect(isFirstListener).toBeTruthy();
                }
            });

            readable.prependOnceListener("data", () => {
                expect(isFirstListener).toBeTruthy();
                isFirstListener = false;
            });

            setTimeout(()=>{
                readable.emit("data");
            }, 25);
            setTimeout(()=>{
                readable.emit("data");
            }, 50);
            setTimeout(()=>{
                readable.emit("data");
            }, 75);
            readable.emit("end");
        });
    });

    describe("removeListener()", () => {
        it("should remove listener", (done) => {
            const listener = () => {
                eventsCount.set("data-1", (eventsCount.get("data-1") || 0) + 1);
            };

            readable
                .on("data", listener)
                .on("data", () => {
                    eventsCount.set("data-2", (eventsCount.get("data-2") || 0) + 1);
                })
                .once("end", () => {
                    expect(eventsCount.get("data-1")).toBe(1);
                    expect(eventsCount.get("data-2")).toBe(2);
                    done();
                });

            readable.emit("data");
            readable.removeListener("data", listener);

            readable.emit("data"); // should be ignored by listener 1 because is removed
            readable.emit("end");
        });
    });

    describe("off()", () => {
        it("should remove listener", (done) => {
            const listener = () => {
                eventsCount.set("data-1", (eventsCount.get("data-1") || 0) + 1);
            };

            readable
                .on("data", listener)
                .on("data", () => {
                    eventsCount.set("data-2", (eventsCount.get("data-2") || 0) + 1);
                })
                .once("end", () => {
                    expect(eventsCount.get("data-1")).toBe(1);
                    expect(eventsCount.get("data-2")).toBe(2);
                    done();
                });

            readable.emit("data");
            readable.off("data", listener);

            readable.emit("data"); // should be ignored by listener 1 because is removed
            readable.emit("end");
        });
    });

    describe("removeAllListeners()", () => {
        it("should remove listener", (done) => {
            readable
                .on("data", () => {
                    eventsCount.set("data-1", (eventsCount.get("data-1") || 0) + 1);
                })
                .on("data", ()=>{
                    eventsCount.set("data-2", (eventsCount.get("data-2") || 0) + 1);
                })
                .once("end", () => {
                    expect(eventsCount.get("data-1")).toBe(1);
                    expect(eventsCount.get("data-2")).toBe(1);
                    done();
                });

            readable.emit("data");
            readable.removeAllListeners("data");

            readable.emit("data"); // should be ignored by all listeners because is removed
            readable.emit("end");
        });
    });

    describe("listeners()", () => {
        it("should return all listeners of the provided event", () => {
            const listener1 = () => { eventsCount.set("data-1", (eventsCount.get("data") || 0) + 1);};
            const listener2 = () => { eventsCount.set("data-2", (eventsCount.get("data") || 0) + 1);};
            readable.on("data", listener1)
                .on("data", listener2);

            expect(readable.listeners("end")).toHaveLength(0);
            expect(readable.listeners("data")).toHaveLength(2);
            expect(readable.listeners("data")).toStrictEqual([listener1, listener2]);
        });
    });

    describe("listenerCount()", () => {
        it("should return the listeners count of the provided event", () => {
            const listener1 = () => { eventsCount.set("data-1", (eventsCount.get("data") || 0) + 1);};
            const listener2 = () => { eventsCount.set("data-2", (eventsCount.get("data") || 0) + 1);};
            readable.on("data", listener1)
                .on("data", listener2);

            expect(readable.listenerCount("end")).toBe(0);
            expect(readable.listenerCount("data")).toBe(2);
        });
    });
});
