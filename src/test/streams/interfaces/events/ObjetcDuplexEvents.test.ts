import { ObjectDuplex } from "../../../../main/streams";

class ObjectDuplexImplementation extends ObjectDuplex<string, string>  {
    constructor(){
        super({objectMode: true});
    }
    _read(){/** no-op */}
    _write(){/** no-op */}
}

describe("ObjectDuplexEvents", () => {
    let duplex: ObjectDuplex<string, string>;
    let eventsCount:Map<string, number>;

    beforeEach(() => {
        duplex = new ObjectDuplexImplementation();
        eventsCount=new Map<string, number>();
    });

    describe("emit()", () => {
        it("should send event to all listeners", (done) => {
            duplex.on("data", () => {
                eventsCount.set("data-1", (eventsCount.get("data-1") || 0) + 1);
            }).on("data", () => {
                eventsCount.set("data-2", (eventsCount.get("data-2") || 0) + 1);
            }).once("end", () => {
                expect(eventsCount.get("data-1")).toBe(3);
                expect(eventsCount.get("data-2")).toBe(3);
                done();
            });

            duplex.emit("data");
            duplex.emit("data");
            duplex.emit("data");
            duplex.emit("end");
        });

        it("should send data to listener", (done) => {
            duplex.on("data", (data: string) => {
                expect(data).toBe("test");
            }).once("end", () => {
                done();
            });

            duplex.emit("data", "test");
            duplex.emit("data", "test");
            duplex.emit("data", "test");
            duplex.emit("end");
        });
    });

    describe("on()", () => {
        it("should add listener", (done) => {
            duplex.on("data", () => {
                eventsCount.set("data", (eventsCount.get("data") || 0) + 1);
            }).once("end", () => {
                expect(eventsCount.get("data")).toBe(3);
                done();
            });

            duplex.emit("data");
            duplex.emit("data");
            duplex.emit("data");
            duplex.emit("end");
        });

        it("should send data to active listener", (done) => {

            const listener = (data: string) => {
                expect(data).toBe("2");
            };

            duplex.on("end", () => {
                done();
            });

            duplex.emit("data", "1"); // should be ignored no active listener

            duplex.on("data", listener);
            duplex.emit("data", "2");
            duplex.removeListener("data", listener);

            duplex.emit("data", "3");// should be ignored no active listener

            duplex.emit("end");
        });
    });

    describe("once()", () => {
        it("should add one time listener", (done) => {
            duplex.once("data", () => {
                eventsCount.set("data", (eventsCount.get("data") || 0) + 1);
            }).once("end", () => {
                expect(eventsCount.get("data")).toBe(1);
                done();
            });

            duplex.emit("data");
            duplex.emit("data");
            duplex.emit("data");
            duplex.emit("end");
        });
        
        it("should send data to active one time listener", (done) => {
            const listener = (data: string) => {
                expect(data).toBe("2");
            };

            duplex.on("end", () => {
                done();
            });

            duplex.emit("data", "1"); // should be ignored no active listener

            duplex.once("data", listener);
            duplex.emit("data", "2");

            duplex.emit("data", "3");// should be ignored because listener is one time

            duplex.emit("end");
        });
    });

    describe("addListener()", () => {
        it("should add listener", (done) => {
            duplex.addListener("data", () => {
                eventsCount.set("data", (eventsCount.get("data") || 0) + 1);
            }).once("end", () => {
                expect(eventsCount.get("data")).toBe(3);
                done();
            });

            duplex.emit("data");
            duplex.emit("data");
            duplex.emit("data");
            duplex.emit("end");
        });

        it("should send data to active listener", (done) => {
            const listener = (data: string) => {
                expect(data).toBe("2");
            };

            duplex.on("end", () => {
                done();
            });

            duplex.emit("data", "1"); // should be ignored no active listener

            duplex.addListener("data", listener);
            duplex.emit("data", "2");
            duplex.removeListener("data", listener);

            duplex.emit("data", "3");// should be ignored no active listener

            duplex.emit("end");
        });
    });

    describe("prependListener()", () => {
        test("should send event first to prepend events listener", (done) => {
            let isFirstListener:boolean = true;

            duplex.on("end", () => {
                done();
            });

            duplex.on("data", () => {
                expect(isFirstListener).toBeFalsy();
                isFirstListener = true;
            });

            duplex.prependListener("data", () => {
                expect(isFirstListener).toBeTruthy();
                isFirstListener = false;
            });

            setTimeout(()=>{
                duplex.emit("data");
            }, 25);
            setTimeout(()=>{
                duplex.emit("data");
            }, 50);
            setTimeout(()=>{
                duplex.emit("data");
            }, 75);
            duplex.emit("end");
        });
    });

    describe("prependOnceListener()", () => {
        it("should send event to one time prepend events listener", (done) => {
            let isFirstListener:boolean = true;
            let isFirstDiscard:boolean = true;

            duplex.on("end", () => {
                done();
            });

            duplex.on("data", () => {
                if(isFirstDiscard){
                    expect(isFirstListener).toBeFalsy();
                    isFirstListener = true;
                    isFirstDiscard = false;
                }else{
                    expect(isFirstListener).toBeTruthy();
                }
            });

            duplex.prependOnceListener("data", () => {
                expect(isFirstListener).toBeTruthy();
                isFirstListener = false;
            });

            setTimeout(()=>{
                duplex.emit("data");
            }, 25);
            setTimeout(()=>{
                duplex.emit("data");
            }, 50);
            setTimeout(()=>{
                duplex.emit("data");
            }, 75);
            duplex.emit("end");
        });
    });

    describe("removeListener()", () => {
        it("should remove listener", (done) => {
            const listener = () => {
                eventsCount.set("data-1", (eventsCount.get("data-1") || 0) + 1);
            };

            duplex
                .on("data", listener)
                .on("data", () => {
                    eventsCount.set("data-2", (eventsCount.get("data-2") || 0) + 1);
                })
                .once("end", () => {
                    expect(eventsCount.get("data-1")).toBe(1);
                    expect(eventsCount.get("data-2")).toBe(2);
                    done();
                });

            duplex.emit("data");
            duplex.removeListener("data", listener);

            duplex.emit("data"); // should be ignored by listener 1 because is removed
            duplex.emit("end");
        });
    });

    describe("off()", () => {
        it("should remove listener", (done) => {
            const listener = () => {
                eventsCount.set("data-1", (eventsCount.get("data-1") || 0) + 1);
            };

            duplex
                .on("data", listener)
                .on("data", () => {
                    eventsCount.set("data-2", (eventsCount.get("data-2") || 0) + 1);
                })
                .once("end", () => {
                    expect(eventsCount.get("data-1")).toBe(1);
                    expect(eventsCount.get("data-2")).toBe(2);
                    done();
                });

            duplex.emit("data");
            duplex.off("data", listener);

            duplex.emit("data"); // should be ignored by listener 1 because is removed
            duplex.emit("end");
        });
    });

    describe("removeAllListeners()", () => {
        it("should remove listener", (done) => {
            duplex
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

            duplex.emit("data");
            duplex.removeAllListeners("data");

            duplex.emit("data"); // should be ignored by all listeners because is removed
            duplex.emit("end");
        });
    });

    describe("listeners()", () => {
        it("should return all listeners of the provided event", () => {
            const listener1 = () => { eventsCount.set("data-1", (eventsCount.get("data") || 0) + 1);};
            const listener2 = () => { eventsCount.set("data-2", (eventsCount.get("data") || 0) + 1);};
            duplex.on("data", listener1)
                .on("data", listener2);

            expect(duplex.listeners("end")).toHaveLength(0);
            expect(duplex.listeners("data")).toHaveLength(2);
            expect(duplex.listeners("data")).toStrictEqual([listener1, listener2]);
        });
    });

    describe("listenerCount()", () => {
        it("should return the listeners count of the provided event", () => {
            const listener1 = () => { eventsCount.set("data-1", (eventsCount.get("data") || 0) + 1);};
            const listener2 = () => { eventsCount.set("data-2", (eventsCount.get("data") || 0) + 1);};
            duplex.on("data", listener1)
                .on("data", listener2);

            expect(duplex.listenerCount("end")).toBe(0);
            expect(duplex.listenerCount("data")).toBe(2);
        });
    });
});
