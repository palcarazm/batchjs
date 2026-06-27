import { BaseRunnableEventMap, Runnable } from "../../../../main/common";

export class MockPassingRunnable extends Runnable<BaseRunnableEventMap> {
    protected async doRun(): Promise<{ cancelled: boolean; reason?: string; executionPromise: Promise<void> }> {
        return { cancelled: false, executionPromise: Promise.resolve() };
    }
    protected async doComplete(): Promise<{ cancelled: boolean; reason?: string }> {
        return { cancelled: false };
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected async doFail(error: Error): Promise<{ cancelled: boolean; reason?: string }> {
        return { cancelled: false };
    }
    protected async doCancel(): Promise<{ cancelled: boolean; reason?: string }> {
        return { cancelled: false };
    }
}