/// <reference types="jest" />
import { RunnableStatus } from "../../../../main/common/interfaces/runnable/_index";
import { MockCancellingRunnable, MockFailingRunnable, MockPassingRunnable } from "../../mocks/_index";



describe("Runnable", () => {
    describe("status", () => {
        it("should start with CREATED status", () => {
            const runnable = new MockPassingRunnable("test");
            expect(runnable.status).toBe(RunnableStatus.CREATED);
            expect(runnable.isCreated).toBe(true);
            expect(runnable.isRunning).toBe(false);
            expect(runnable.isCompleted).toBe(false);
            expect(runnable.isFailed).toBe(false);
            expect(runnable.isCancelled).toBe(false);
        });

        it("should transition to RUNNING when run() is called", async () => {
            const runnable = new MockPassingRunnable("test");
            await runnable.run();
            expect(runnable.status).toBe(RunnableStatus.RUNNING);
            expect(runnable.isRunning).toBe(true);
        });
    });

    describe("events", () => {
        it("should emit started event when transitioning to RUNNING", (done) => {
            new MockPassingRunnable("test")
                .once("started", ({name}) => {
                    expect(name).toBe("test");
                    done();
                })
                .run();
        });

        it("should emit completed and finished events on successful completion", (done) => {
            const runnable = new MockPassingRunnable("test")
                .once("completed", ({name})=>{
                    expect(name).toBe("test");
                })
                .once("finished", ({name, status}) => {
                    expect(name).toBe("test");
                    expect(status).toBe(RunnableStatus.COMPLETED);
                    done();
                });

            runnable.run().then(() => runnable.complete());
        });

        it("should emit transition-invalid on invalid transition", (done) => {
            new MockPassingRunnable("test")
                .once("transition-invalid", ({from, to})=>{
                    expect(from).toBe(RunnableStatus.CREATED);
                    expect(to).toBe(RunnableStatus.COMPLETED);
                    done();
                })
                .complete();
        });
    });

    describe("run", () => {
        it("should transition to RUNNING when run() is called", (done) => {
            const runnable = new MockPassingRunnable("test")
                .once("started", ({name})=>{
                    expect(name).toBe("test");
                    expect(runnable.isRunning).toBe(true);
                    done();
                });

            runnable.run();
        });

        it("should be no-op called multiple times", (done) => {
            const runnable = new MockPassingRunnable("test")
                .once("transition-invalid", ({from, to})=>{
                    expect(runnable.status).toBe(RunnableStatus.RUNNING);
                    expect(from).toBe(RunnableStatus.RUNNING);
                    expect(to).toBe(RunnableStatus.RUNNING);
                    done();
                });

            runnable.run().then(() => runnable.run());
        });

        it("should be no-op if already in terminal state", (done) => {
            const runnable = new MockPassingRunnable("test")
                .once("transition-invalid", ({from, to})=>{
                    expect(runnable.status).toBe(RunnableStatus.COMPLETED);
                    expect(from).toBe(RunnableStatus.COMPLETED);
                    expect(to).toBe(RunnableStatus.RUNNING);
                    done();
                });

            runnable.run().then(() => runnable.complete()).then(() => runnable.run());
        });
    });

    describe("complete", () => {
        it("should transition to COMPLETED when complete() is called", (done) => {
            const runnable = new MockPassingRunnable("test")
                .once("completed", ({name})=>{
                    expect(name).toBe("test");
                    expect(runnable.isCompleted).toBe(true);
                })
                .once("finished", ({name, status})=>{
                    expect(name).toBe("test");
                    expect(status).toBe(RunnableStatus.COMPLETED);
                    done();
                });

            runnable.run().then(() => runnable.complete());
        });

        it("should be no-op called multiple times", (done) => {
            const runnable = new MockPassingRunnable("test")
                .once("transition-invalid", ({from, to})=>{
                    expect(runnable.status).toBe(RunnableStatus.COMPLETED);
                    expect(from).toBe(RunnableStatus.COMPLETED);
                    expect(to).toBe(RunnableStatus.COMPLETED);
                    done();
                });

            runnable.run().then(() => runnable.complete()).then(() => runnable.complete());
        });

        it("should be no-op if already in terminal state", (done) => {
            const runnable = new MockPassingRunnable("test")
                .once("transition-invalid", ({from, to})=>{
                    expect(runnable.status).toBe(RunnableStatus.CANCELLED);
                    expect(from).toBe(RunnableStatus.CANCELLED);
                    expect(to).toBe(RunnableStatus.COMPLETED);
                    done();
                });

            runnable.run().then(() => runnable.cancel()).then(() => runnable.complete());
        });

        
        it("should be no-op if is not running", (done) => {
            const runnable = new MockPassingRunnable("test")
                .once("transition-invalid", ({from, to})=>{
                    expect(runnable.status).toBe(RunnableStatus.CREATED);
                    expect(from).toBe(RunnableStatus.CREATED);
                    expect(to).toBe(RunnableStatus.COMPLETED);
                    done();
                });

            runnable.complete();
        });
    });

    describe("cancel", () => {
        it("should transition to CANCELLED when cancel() is called", (done) => {
            const runnable = new MockPassingRunnable("test")
                .once("cancelled", ({name})=>{
                    expect(name).toBe("test");
                    expect(runnable.isCancelled).toBe(true);
                })
                .once("finished", ({name, status})=>{
                    expect(name).toBe("test");
                    expect(status).toBe(RunnableStatus.CANCELLED);
                    done();
                });

            runnable.run().then(() => runnable.cancel());
        });

        it("should be no-op called multiple times", (done) => {
            const runnable = new MockPassingRunnable("test")
                .once("transition-invalid", ({from, to})=>{
                    expect(runnable.status).toBe(RunnableStatus.CANCELLED);
                    expect(from).toBe(RunnableStatus.CANCELLED);
                    expect(to).toBe(RunnableStatus.CANCELLED);
                    done();
                });

            runnable.run().then(() => runnable.cancel()).then(() => runnable.cancel());
        });

        it("should be no-op if already in terminal state", (done) => {
            const runnable = new MockPassingRunnable("test")
                .once("transition-invalid", ({from, to})=>{
                    expect(runnable.status).toBe(RunnableStatus.COMPLETED);
                    expect(from).toBe(RunnableStatus.COMPLETED);
                    expect(to).toBe(RunnableStatus.CANCELLED);
                    done();
                });

            runnable.run().then(() => runnable.complete()).then(() => runnable.cancel());
        });

        
        it("should be no-op if is not running", (done) => {
            const runnable = new MockPassingRunnable("test")
                .once("transition-invalid", ({from, to})=>{
                    expect(runnable.status).toBe(RunnableStatus.CREATED);
                    expect(from).toBe(RunnableStatus.CREATED);
                    expect(to).toBe(RunnableStatus.CANCELLED);
                    done();
                });

            runnable.cancel();
        });
    });

    describe("fail", () => {
        it("should transition to FAILED when fail() is called", (done) => {
            const runnable = new MockPassingRunnable("test")
                .once("failed", ({name, error})=>{
                    expect(name).toBe("test");
                    expect(error).toBeDefined();
                    expect(error.message).toBe("Test error");
                    expect(runnable.isFailed).toBe(true);
                })
                .once("finished", ({name, status})=>{
                    expect(name).toBe("test");
                    expect(status).toBe(RunnableStatus.FAILED);
                    done();
                });

            runnable.run().then(() => runnable.fail(new Error("Test error")));
        });

        it("should be no-op called multiple times", (done) => {
            const runnable = new MockPassingRunnable("test")
                .once("transition-invalid", ({from, to})=>{
                    expect(runnable.status).toBe(RunnableStatus.FAILED);
                    expect(from).toBe(RunnableStatus.FAILED);
                    expect(to).toBe(RunnableStatus.FAILED);
                    done();
                });

            runnable.run().then(() => runnable.fail(new Error("Test error"))).then(() => runnable.fail(new Error("Test error")));
        });

        it("should be no-op if already in terminal state", (done) => {
            const runnable = new MockPassingRunnable("test")
                .once("transition-invalid", ({from, to})=>{
                    expect(runnable.status).toBe(RunnableStatus.COMPLETED);
                    expect(from).toBe(RunnableStatus.COMPLETED);
                    expect(to).toBe(RunnableStatus.FAILED);
                    done();
                });

            runnable.run().then(() => runnable.complete()).then(() => runnable.fail(new Error("Test error")));
        });

        
        it("should be no-op if is not running", (done) => {
            const runnable = new MockPassingRunnable("test")
                .once("transition-invalid", ({from, to})=>{
                    expect(runnable.status).toBe(RunnableStatus.CREATED);
                    expect(from).toBe(RunnableStatus.CREATED);
                    expect(to).toBe(RunnableStatus.FAILED);
                    done();
                });

            runnable.fail(new Error("Test error"));
        });
    });

    describe("cancelling transitions", () => {
        it("should abort CREATED -> RUNNING transition when hook returns { cancelled: true }", (done) => {
            const runnable = new MockCancellingRunnable("test")
                .once("transition-cancelled", ({from, to, reason})=>{
                    expect(runnable.status).toBe(RunnableStatus.CREATED);
                    expect(from).toBe(RunnableStatus.CREATED);
                    expect(to).toBe(RunnableStatus.RUNNING);
                    expect(reason).toBe("Cancelled");
                    done();
                });
            runnable.run();
        });

        it("should abort RUNNING -> COMPLETED transition when hook returns { cancelled: true }", (done) => {
            const runnable = new MockCancellingRunnable("test")
                .once("transition-cancelled", ({from, to, reason})=>{
                    expect(runnable.status).toBe(RunnableStatus.RUNNING);
                    expect(from).toBe(RunnableStatus.RUNNING);
                    expect(to).toBe(RunnableStatus.COMPLETED);
                    expect(reason).toBe("Cancelled");
                    done();
                });
            runnable.runNoCancel().then(() => runnable.complete());
        });

        it("should abort RUNNING -> CANCELLED transition when hook returns { cancelled: true }", (done) => {
            const runnable = new MockCancellingRunnable("test")
                .once("transition-cancelled", ({from, to, reason})=>{
                    expect(runnable.status).toBe(RunnableStatus.RUNNING);
                    expect(from).toBe(RunnableStatus.RUNNING);
                    expect(to).toBe(RunnableStatus.CANCELLED);
                    expect(reason).toBe("Cancelled");
                    done();
                });
            runnable.runNoCancel().then(() => runnable.cancel());
        });

        it("should abort RUNNING -> FAILED transition when hook returns { cancelled: true }", (done) => {
            const runnable = new MockCancellingRunnable("test")
                .once("transition-cancelled", ({from, to, reason})=>{
                    expect(runnable.status).toBe(RunnableStatus.RUNNING);
                    expect(from).toBe(RunnableStatus.RUNNING);
                    expect(to).toBe(RunnableStatus.FAILED);
                    expect(reason).toBe("Cancelled");
                    done();
                });
            runnable.runNoCancel().then(() => runnable.fail(new Error("Test error")));
        });
    });

    describe("execution task", () => {
        it("should resolve to a fulfilled promise on success", async () => {
            const runnable = new MockPassingRunnable("test");
            await runnable.run();
            await expect(runnable.executionTask).resolves.toEqual(expect.objectContaining({status: "fulfilled"}));
        });

        it("should resolve to a rejected promise on fail", async () => {
            const runnable = new MockFailingRunnable("test");
            await runnable.run();
            await expect(runnable.executionTask).resolves.toEqual(expect.objectContaining({status: "rejected", reason: expect.any(Error)}));
        });

        it("should resolve to undefined on run cancel", async () => {
            const runnable = new MockCancellingRunnable("test");
            await runnable.run();
            expect(runnable.executionTask).toBeUndefined();
        });
    });
});