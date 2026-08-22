import { BatchJSError } from "../../common/errors/_index";

/**
 * Error thrown when the stream contains more than one chunk.
 * @extends BatchJSError
 */
export class SingleStreamError extends BatchJSError{
    constructor(){
        super("Expected only one chunk in the stream");
    }
}