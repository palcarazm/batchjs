export abstract class BatchJSError extends Error{
    constructor(message:string){
        super(message);
    }
}