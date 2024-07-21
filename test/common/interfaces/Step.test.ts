import { MockPassingStep, MockProcessorFailingStep, MockReaderFailingStep, MockWriterFailingStep } from "../mocks/_index";

describe("Step", () => {
    test("should run the step successfully", async () => {
        const step = new MockPassingStep();
        await expect(step.run()).resolves.toBeUndefined();
    });

    test("should reject if the reader stream errors", async () => {
        const step = new MockReaderFailingStep();
        await expect(step.run()).rejects.toThrow("Reader error");
    });

    test("should reject if a processor stream errors", async () => {
        const step = new MockProcessorFailingStep();
        await expect(step.run()).rejects.toThrow("Processor error");
    });

    test("should reject if the writer stream errors", async () => {
        const step = new MockWriterFailingStep();
        await expect(step.run()).rejects.toThrow("Writer error");
    });
});
