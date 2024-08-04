import { Step } from "../../../src/common/interfaces/_index";
import { MockPassingStep, MockReaderFailingStep } from "../mocks/_index";
import { MockPassingJob } from "../mocks/jobs/_index";


describe("DiscardingStream", () => {
    let job: MockPassingJob;
    let startCount:number;

    beforeEach(() => {
        job = new MockPassingJob();
        startCount=0;
    });

    test("should send first start event to once start listener", (done) => {
        job.on("end", () => {
            expect(startCount).toBe(1);
            done();
        });

        job.once("start", () => {
            startCount++;
        });

        job.emit("start");
        job.emit("start");
        job.emit("start");
        job.emit("end");
    });

    test("should send stepStart data to active stepStart events listener", (done) => {
        const listener = (step:Step) => {
            expect(step.name).toBe("MockPassingStep");
        };

        job.on("end", () => {
            done();
        });

        job.emit("stepStart", new MockReaderFailingStep());
        job.addListener("stepStart", listener);
        job.emit("stepStart", new MockPassingStep());
        job.removeListener("stepStart", listener);
        job.emit("stepStart", new MockReaderFailingStep());
        job.emit("end");
    });

    test("should send start event first to prepended start events listener", (done) => {
        let isFirstListener:boolean = true;

        job.on("end", () => {
            done();
        });

        job.once("start", () => {
            expect(isFirstListener).toBeFalsy();
            isFirstListener = true;
        });

        job.prependListener("start", () => {
            expect(isFirstListener).toBeTruthy();
            isFirstListener = false;
        });

        setTimeout(()=>{
            job.emit("start");
        }, 50);
        setTimeout(()=>{
            job.emit("start");
        }, 100);
        setTimeout(()=>{
            job.emit("start");
        }, 150);
        job.emit("end");
    });

    test("should send start event to once prepended start events listener", (done) => {
        let isFirstListener:boolean = true;
        let isFirstDiscard:boolean = true;

        job.on("end", () => {
            done();
        });

        job.once("start", () => {
            if(isFirstDiscard){
                expect(isFirstListener).toBeFalsy();
                isFirstListener = true;
                isFirstDiscard = false;
            }else{
                expect(isFirstListener).toBeTruthy();
            }
        });

        job.prependOnceListener("start", () => {
            expect(isFirstListener).toBeTruthy();
            isFirstListener = false;
        });

        setTimeout(()=>{
            job.emit("start");
        }, 50);
        setTimeout(()=>{
            job.emit("start");
        }, 100);
        setTimeout(()=>{
            job.emit("start");
        }, 150);
        job.emit("end");
    });
});
