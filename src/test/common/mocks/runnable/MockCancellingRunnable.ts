import { BaseRunnableEventMap, Runnable, RunnableStatus } from "../../../../main/common";

export class MockCancellingRunnable extends Runnable<BaseRunnableEventMap> {
    private _runCancelling: boolean = true;

    protected async doRun(): Promise<{ cancelled: true; reason?: string} | { cancelled: false; reason?: string, executionPromise: Promise<void>}> {
        return this._runCancelling ? { cancelled: true, reason: "Cancelled" } : { cancelled: false, executionPromise: Promise.resolve() };
    }
    protected async doComplete(): Promise<{ cancelled: boolean; reason?: string }> {
        return { cancelled: true, reason: "Cancelled" };
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected async doFail(error: Error): Promise<{ cancelled: boolean; reason?: string }> {
        return { cancelled: true, reason: "Cancelled" };
    }
    protected async doCancel(): Promise<{ cancelled: boolean; reason?: string }> {
        return { cancelled: true, reason: "Cancelled" };
    }

    async runNoCancel(): Promise<void> {
        this._runCancelling = false;
        await this.transitionTo(RunnableStatus.RUNNING);
        this._runCancelling = true;
    }
}