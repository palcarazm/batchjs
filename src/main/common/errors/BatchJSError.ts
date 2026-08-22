/**
 * Base class for all BatchJS errors
 * @abstract
 * @extends Error
 */
export abstract class BatchJSError extends Error{
    /**
     * The provenance of the module that threw the error
     * @type {string}
     * @default "BatchJS"
     * @readonly
     */
    readonly moduleProvenance: string = "BatchJS";
}