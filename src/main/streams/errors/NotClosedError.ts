import { BatchJSError } from "../../common/errors/_index";

export class NotClosedError extends BatchJSError{
    constructor(){
        super("The stream has not been closed yet.");
    }
}