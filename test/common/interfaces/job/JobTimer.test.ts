import { JobTimer } from "../../../../src/common/interfaces/_index";


describe("JobTimer", () => {
  let timer: JobTimer;
  const deltaMax = 10;
  const deltaMin = 2;

  beforeEach(() => {
    timer = new JobTimer("myJob");
  });

  test("should measure job duration in ms", (done) => {
    timer.start("JOB", "myJob");
    const start = Date.now();

    setTimeout(()=>{
        const duration = timer.stop("JOB", "myJob");
        const end = Date.now();
        expect(duration).toBeGreaterThanOrEqual(50 - deltaMin);
        expect(duration).toBeLessThanOrEqual(end - start + deltaMax);
        done();
    }, 50)
  });

  test("should measure step duration in ms", (done) => {
    timer.start("STEP", "myStep");
    const start = Date.now();

    setTimeout(()=>{
        const duration = timer.stop("STEP", "myStep");
        const end = Date.now();
        expect(duration).toBeGreaterThanOrEqual(30 - deltaMin);
        expect(duration).toBeLessThanOrEqual(end - start + deltaMax);
        done();
    }, 30)
  });

  test("should return 0 if stop called without start", () => {
    const duration = timer.stop("JOB", "notStarted");
    expect(duration).toBe(0);
  });
});
