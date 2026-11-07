/// <reference types="jest" />
import { Logger, JobLogger, RunnableStatus } from "../../../../main/common/index";

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

    test("stepStart should log step start with parameters", () => {
        const stepParams = { x: 42 };
        jobLogger.stepStart("Step1", stepParams);

        expect(mockLogger.info).toHaveBeenCalledTimes(1);
        expect(mockLogger.info).toHaveBeenCalledWith(
            `STEP::Step1 launched with the following parameters: [${JSON.stringify(stepParams)}]`
        );
    });

    test("stepFinish should log step finish with status and duration", () => {
        jobLogger.stepFinish("Step1", RunnableStatus.COMPLETED, 78.9);

        expect(mockLogger.info).toHaveBeenCalledTimes(1);
        expect(mockLogger.info).toHaveBeenCalledWith(
            `STEP::Step1 completed with status [${RunnableStatus.COMPLETED}] in 78.90ms`
        );
    });

    test("stepError should log step error with message and stack", () => {
        const error = new Error("Something went wrong");
        jobLogger.stepError("Step1", RunnableStatus.FAILED, error);

        expect(mockLogger.error).toHaveBeenCalledTimes(1);
        expect(mockLogger.error).toHaveBeenCalledWith(
            `Error in STEP::Step1: [${error.message}]\n${error.stack}`
        );
    });

    test("stepRollbackSucceed should log rollback success", () => {
        jobLogger.stepRollbackSucceed("Step1");

        expect(mockLogger.info).toHaveBeenCalledTimes(1);
        expect(mockLogger.info).toHaveBeenCalledWith(
            "STEP::Step1 rollback succeeded"
        );
    });

    test("stepRollbackFailed should log rollback failure with error message and stack", () => {
        const error = new Error("Rollback failed", { cause: new Error("Inner error") });
        jobLogger.stepRollbackFailed("Step1", error);

        expect(mockLogger.error).toHaveBeenCalledTimes(1);
        expect(mockLogger.error).toHaveBeenCalledWith(
            `STEP::Step1 rollback failed: [${error.message}]\n${error.stack}`
        );
    });

    test("stepRetry should log retry with message and stack", () => {
        const error = new Error("Execution Error", { cause: new Error("Inner error") });
        jobLogger.stepRetry("Step1", 1, 3, 1000, error);

        expect(mockLogger.warn).toHaveBeenCalledTimes(1);
        expect(mockLogger.warn).toHaveBeenCalledWith(
            `STEP::Step1 retry created with attempt 1 of 3. Will start on 1000 ms. Cause: [${error.message}]\n${error.stack}`
        );
    });

    test("stepRetryStarted should log retry start in debug mode", () => {
        jobLogger.stepRetryStarted("Step1", 1, 3);

        expect(mockLogger.debug).toHaveBeenCalledTimes(1);
        expect(mockLogger.debug).toHaveBeenCalledWith(
            "STEP::Step1 retry started with attempt 1 of 3"
        );
    });

    test("stepRetryExhausted should log retry exhausted with message and stack", () => {
        const error = new Error("Execution Error", { cause: new Error("Inner error") });
        jobLogger.stepRetryExhausted("Step1", 3, 3, error);

        expect(mockLogger.warn).toHaveBeenCalledTimes(1);
        expect(mockLogger.warn).toHaveBeenCalledWith(
            `STEP::Step1 retry exhausted with attempt 3 of 3. Cause: [${error.message}]\n${error.stack}`
        );
    });
});
