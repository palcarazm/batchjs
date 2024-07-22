import { Step } from "./Step";

export interface JobEventEmitters {
    start: void
    end: void
    stepStart: Step
    stepEnd: Step
}

export interface JobEventHandlers {
    start: () => void
    end: () => void
    stepStart: (step:Step) => void
    stepEnd: (step:Step) => void
}