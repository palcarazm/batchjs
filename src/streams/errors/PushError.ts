import { BatchJSError } from "../../common/errors/BatchJSError";

export class PushError extends BatchJSError{
    constructor(){
        super("Unable to perform push action");
    }
}