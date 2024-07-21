import { BatchJSError } from "../../common/errors/_index";

export class PushError extends BatchJSError{
    constructor(){
        super("Unable to perform push action");
    }
}