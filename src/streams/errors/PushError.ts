import { BatchJSError } from "../../commons/errors/BatchJSError";

export class PushError extends BatchJSError{
    constructor(){
        super("Unable to perform push action");
    }
}