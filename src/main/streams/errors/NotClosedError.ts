import { BatchJSError } from "../../common/errors/_index";

/**
 * Error thrown when the stream has not been closed yet.
 * @extends BatchJSError
 */
export class NotClosedError extends BatchJSError{
    constructor(){
        super("The stream has not been closed yet.");
    }
}