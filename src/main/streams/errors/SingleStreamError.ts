import { BatchJSError } from "../../common/errors/_index";

export class SingleStreamError extends BatchJSError{
    constructor(){
        super("Expected only one chunk in the stream");
    }
}