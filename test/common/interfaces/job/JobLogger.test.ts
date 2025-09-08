import { Logger, JobLogger, RunnableStatus } from "../../../../src/common/index";

describe("JobLogger", () => {
  let mockLogger: jest.Mocked<Logger>;
  let jobLogger: JobLogger;

  beforeEach(() => {

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    jobLogger = new JobLogger(mockLogger, "TestJob");
  });

  test("start should log job start with parameters", () => {
    const params = { a: 1, b: "test" };
    jobLogger.start(params);

    expect(mockLogger.info).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalledWith(
      `JOB::TestJob launched with the following parameters: [${JSON.stringify(params)}]`
    );
  });

  test("finish should log job finish with status and duration", () => {
    jobLogger.finish(RunnableStatus.COMPLETED, 123.456);

    expect(mockLogger.info).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalledWith(
      `JOB::TestJob completed with status [${RunnableStatus.COMPLETED}] in 123.46ms`
    );
  });

  test("StepStart should log step start with parameters", () => {
    const stepParams = { x: 42 };
    jobLogger.StepStart("Step1", stepParams);

    expect(mockLogger.info).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalledWith(
      `STEP::Step1 launched with the following parameters: [${JSON.stringify(stepParams)}]`
    );
  });

  test("StepFinish should log step finish with status and duration", () => {
    jobLogger.StepFinish("Step1", RunnableStatus.COMPLETED, 78.9);

    expect(mockLogger.info).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalledWith(
      `STEP::Step1 completed with status [${RunnableStatus.COMPLETED}] in 78.90ms`
    );
  });

  test("StepError should log step error with message and stack", () => {
    const error = new Error("Something went wrong");
    jobLogger.StepError("Step1", RunnableStatus.FAILED, error);

    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    expect(mockLogger.error).toHaveBeenCalledWith(
      `Error in STEP::Step1: [${error.message}]\n${error.stack}`
    );
  });
});
