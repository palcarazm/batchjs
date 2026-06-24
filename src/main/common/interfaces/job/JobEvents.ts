import { Step } from "../Step";

type StepErrorData = { step:Step, error:Error };

export interface JobEventEmitters {
    start: void
    end: void
    error: Error
    stepStart: Step
    stepError: StepErrorData
    stepEnd: Step
}

export interface JobEventHandlers {
    start: () => void
    error: (error:Error) => void
    end: () => void
    stepStart: (step:Step) => void
    stepError: (data:StepErrorData) => void
    stepEnd: (step:Step) => void
}