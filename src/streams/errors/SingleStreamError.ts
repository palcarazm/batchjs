import { BatchJSError } from "../../common/errors/BatchJSError";

export class SingleStreamError extends BatchJSError{
    constructor(){
        super("Expected only one chunk in the stream");
    }
}