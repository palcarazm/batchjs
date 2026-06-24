export abstract class BatchJSError extends Error{
    readonly moduleProvenance: string = "BatchJS";
}