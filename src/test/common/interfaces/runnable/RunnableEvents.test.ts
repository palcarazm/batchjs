import { MockPassingRunnable } from "../../mocks/_index";


describe("RunnableEvents", () => {
    let runnable: MockPassingRunnable;
    let eventsCount:Map<string, number>;

    beforeEach(() => {
        runnable = new MockPassingRunnable("test");
        eventsCount=new Map<string, number>();
    });

    describe("emit()", () => {
        it("should send event to all listeners", (done) => {
            runnable.on("started", () => {
                eventsCount.set("started-1", (eventsCount.get("started-1") || 0) + 1);
            }).on("started", () => {
                eventsCount.set("started-2", (eventsCount.get("started-2") || 0) + 1);
            }).once("completed", () => {
                expect(eventsCount.get("started-1")).toBe(3);
                expect(eventsCount.get("started-2")).toBe(3);
                done();
            });

            runnable.emit("started");
            runnable.emit("started");
            runnable.emit("started");
            runnable.emit("completed");
        });

        it("should send data to listener", (done) => {
            runnable.on("started", ({name}:{name:string}) => {
                expect(name).toBe("test");
            }).once("completed", () => {
                done();
            });

            runnable.emit("started", { name: "test" });
            runnable.emit("started", { name: "test" });
            runnable.emit("started", { name: "test" });
            runnable.emit("completed");
        });
    });

    describe("on()", () => {
        it("should add listener", (done) => {
            runnable.on("started", () => {
                eventsCount.set("started", (eventsCount.get("started") || 0) + 1);
            }).once("completed", () => {
                expect(eventsCount.get("started")).toBe(3);
                done();
            });

            runnable.emit("started");
            runnable.emit("started");
            runnable.emit("started");
            runnable.emit("completed");
        });

        it("should send data to active listener", (done) => {
            const listener = ({name}:{name:string}) => {
                expect(name).toBe("2");
            };

            runnable.on("completed", () => {
                done();
            });

            runnable.emit("started", { name: "1" }); // should be ignored no active listener

            runnable.on("started", listener);
            runnable.emit("started", { name: "2" });
            runnable.removeListener("started", listener);

            runnable.emit("started", { name: "3" });// should be ignored no active listener

            runnable.emit("completed");
        });
    });

    describe("once()", () => {
        it("should add one time listener", (done) => {
            runnable.once("started", () => {
                eventsCount.set("started", (eventsCount.get("started") || 0) + 1);
            }).once("completed", () => {
                expect(eventsCount.get("started")).toBe(1);
                done();
            });

            runnable.emit("started");
            runnable.emit("started");
            runnable.emit("started");
            runnable.emit("completed");
        });
        
        it("should send data to active one time listener", (done) => {
            const listener = ({name}:{name:string}) => {
                expect(name).toBe("2");
            };

            runnable.on("completed", () => {
                done();
            });

            runnable.emit("started", { name: "1" }); // should be ignored no active listener

            runnable.once("started", listener);
            runnable.emit("started", { name: "2" });

            runnable.emit("started", { name: "3" });// should be ignored because listener is one time

            runnable.emit("completed");
        });
    });

    describe("addListener()", () => {
        it("should add listener", (done) => {
            runnable.addListener("started", () => {
                eventsCount.set("started", (eventsCount.get("started") || 0) + 1);
            }).once("completed", () => {
                expect(eventsCount.get("started")).toBe(3);
                done();
            });

            runnable.emit("started");
            runnable.emit("started");
            runnable.emit("started");
            runnable.emit("completed");
        });

        it("should send data to active listener", (done) => {
            const listener = ({name}:{name:string}) => {
                expect(name).toBe("2");
            };

            runnable.on("completed", () => {
                done();
            });

            runnable.emit("started", { name: "1" }); // should be ignored no active listener

            runnable.addListener("started", listener);
            runnable.emit("started", { name: "2" });
            runnable.removeListener("started", listener);

            runnable.emit("started", { name: "3" });// should be ignored no active listener

            runnable.emit("completed");
        });
    });

    describe("prependListener()", () => {
        test("should send event first to prepend events listener", (done) => {
            let isFirstListener:boolean = true;

            runnable.on("completed", () => {
                done();
            });

            runnable.on("started", () => {
                expect(isFirstListener).toBeFalsy();
                isFirstListener = true;
            });

            runnable.prependListener("started", () => {
                expect(isFirstListener).toBeTruthy();
                isFirstListener = false;
            });

            setTimeout(()=>{
                runnable.emit("started");
            }, 25);
            setTimeout(()=>{
                runnable.emit("started");
            }, 50);
            setTimeout(()=>{
                runnable.emit("started");
            }, 75);
            runnable.emit("completed");
        });
    });

    describe("prependOnceListener()", () => {
        it("should send event to one time prepend events listener", (done) => {
            let isFirstListener:boolean = true;
            let isFirstDiscard:boolean = true;

            runnable.on("completed", () => {
                done();
            });

            runnable.on("started", () => {
                if(isFirstDiscard){
                    expect(isFirstListener).toBeFalsy();
                    isFirstListener = true;
                    isFirstDiscard = false;
                }else{
                    expect(isFirstListener).toBeTruthy();
                }
            });

            runnable.prependOnceListener("started", () => {
                expect(isFirstListener).toBeTruthy();
                isFirstListener = false;
            });

            setTimeout(()=>{
                runnable.emit("started");
            }, 25);
            setTimeout(()=>{
                runnable.emit("started");
            }, 50);
            setTimeout(()=>{
                runnable.emit("started");
            }, 75);
            runnable.emit("completed");
        });
    });

    describe("removeListener()", () => {
        it("should remove listener", (done) => {
            const listener = () => {
                eventsCount.set("started-1", (eventsCount.get("started-1") || 0) + 1);
            };

            runnable
                .on("started", listener)
                .on("started", () => {
                    eventsCount.set("started-2", (eventsCount.get("started-2") || 0) + 1);
                })
                .once("completed", () => {
                    expect(eventsCount.get("started-1")).toBe(1);
                    expect(eventsCount.get("started-2")).toBe(2);
                    done();
                });

            runnable.emit("started");
            runnable.removeListener("started", listener);

            runnable.emit("started"); // should be ignored by listener 1 because is removed
            runnable.emit("completed");
        });
    });

    describe("off()", () => {
        it("should remove listener", (done) => {
            const listener = () => {
                eventsCount.set("started-1", (eventsCount.get("started-1") || 0) + 1);
            };

            runnable
                .on("started", listener)
                .on("started", () => {
                    eventsCount.set("started-2", (eventsCount.get("started-2") || 0) + 1);
                })
                .once("completed", () => {
                    expect(eventsCount.get("started-1")).toBe(1);
                    expect(eventsCount.get("started-2")).toBe(2);
                    done();
                });

            runnable.emit("started");
            runnable.off("started", listener);

            runnable.emit("started"); // should be ignored by listener 1 because is removed
            runnable.emit("completed");
        });
    });

    describe("removeAllListeners()", () => {
        it("should remove listener", (done) => {
            runnable
                .on("started", () => {
                    eventsCount.set("started-1", (eventsCount.get("started-1") || 0) + 1);
                })
                .on("started", ()=>{
                    eventsCount.set("started-2", (eventsCount.get("started-2") || 0) + 1);
                })
                .once("completed", () => {
                    expect(eventsCount.get("started-1")).toBe(1);
                    expect(eventsCount.get("started-2")).toBe(1);
                    done();
                });

            runnable.emit("started");
            runnable.removeAllListeners("started");

            runnable.emit("started"); // should be ignored by all listeners because is removed
            runnable.emit("completed");
        });
    });

    describe("listeners()", () => {
        it("should return all listeners of the provided event", () => {
            const listener1 = () => { eventsCount.set("started-1", (eventsCount.get("started") || 0) + 1);};
            const listener2 = () => { eventsCount.set("started-2", (eventsCount.get("started") || 0) + 1);};
            runnable.on("started", listener1)
                .on("started", listener2);

            expect(runnable.listeners("completed")).toHaveLength(0);
            expect(runnable.listeners("started")).toHaveLength(2);
            expect(runnable.listeners("started")).toStrictEqual([listener1, listener2]);
        });
    });

    describe("listenerCount()", () => {
        it("should return the listeners count of the provided event", () => {
            const listener1 = () => { eventsCount.set("started-1", (eventsCount.get("started") || 0) + 1);};
            const listener2 = () => { eventsCount.set("started-2", (eventsCount.get("started") || 0) + 1);};
            runnable.on("started", listener1)
                .on("started", listener2);

            expect(runnable.listenerCount("completed")).toBe(0);
            expect(runnable.listenerCount("started")).toBe(2);
        });
    });
});
