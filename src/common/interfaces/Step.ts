import { Readable, Duplex, Writable } from "stream";

/**
 * The base class for all steps.
 */
export abstract class Step {
    readonly name:string;

    /**
     * Constructor for initializing the name property.
     *
     * @param {string} name - The name to assign to the Step.
     * @return {void} 
     */
    constructor(name:string) {
        this.name = name;
    }
    
    /**
     * The reader stream.
     * @returns {Readable}
     */
    protected abstract _reader():Readable;

    /**
     * The processors in order to process the data from the reader to the writer.
     * @returns {Array<Duplex>}
     */
    protected abstract _processors():Array<Duplex>;

    /**
     * The writer stream.
     * @returns {Writable}
     */
    protected abstract _writer():Writable;
    
    /**
     * Executes the step by connecting streams, processing data, and listening for events.
     *
     * @return {Promise<void>} A Promise that resolves when the step execution is completed, and rejects if an error occurs.
     */
    public run():Promise<void>{
        return new Promise((resolve, reject) => {
            // Reader
            const reader = this._reader();
            reader.once("error", (error) => {
                reject(error);
            });

            // Writer
            const writer = this._writer();
            writer.once("error", (error) => {
                reject(error);
            });

            // Assembly processors           
            let assembly:Readable = reader;
            for (const processor of this._processors()) {
                processor.once("error", (error) => {
                    reject(error);
                });
                assembly = assembly.pipe(processor);
            }

            // Assembly writer
            assembly.pipe(writer)
                .on("finish", () => {
                    resolve();
                });
        });
    }
}