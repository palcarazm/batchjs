import { Duplex, DuplexOptions, TransformCallback } from "stream";
import { PushError } from "../errors/PushError";
import { DuplexEventEmitters, DuplexEventHandlers } from "../interfaces/index";

/**
 * Options for the FilterStream.
 */
export interface FilterStreamOptions<T> extends DuplexOptions {
    objectMode?:true;
    filter: (chunk: T) => boolean;
}

const defaultOptions = {
    objectMode: true
};

/**
 * Event emitters interface for the FilterStream.
 */
interface FilterStreamEventEmitters<T> extends DuplexEventEmitters {
    discard: T;
}

/**
 *  Event handlers interface for the FilterStream.
 */
interface FilterStreamEventHandlers<T> extends DuplexEventHandlers {
    discard: (chunk: T) => void;
}

/**
 * A class that allows you  stream data in batches of a specified size.
 */
export class FilterStream<T> extends Duplex {
    private buffer: T[] = [];
    private readonly _filter: (chunk: T) => boolean;

    /**
     * Initializes a new instance of the FilterStream class with the specified options.
     *
     * @param {FilterStreamOptions} options - The options for the FilterStream.
     */
    constructor(options: FilterStreamOptions<T>) {
        const opts = {...defaultOptions, ...options};
        super(opts);
        this._filter = opts.filter;
    }

    /**
     * A method to write data to the stream, filter the chunk and push it to the buffer or discard it, and execute the callback.
     *
     * @param {T} chunk - The data chunk to write to the stream.
     * @param {BufferEncoding} encoding - The encoding of the data.
     * @param {TransformCallback} callback - The callback function to be executed after writing the data.
     * @return {void} This function does not return anything.
     */
    _write(chunk: T, encoding: BufferEncoding, callback: TransformCallback): void {
        if(this._filter(chunk)){
            this.buffer.push(chunk);
        }else{
            this.emit("discard", chunk);
        }
        callback();
    }


    /**
     * Finalizes the stream by pushing remaining data, handling errors,
     * and executing the final callback.
     *
     * @param {TransformCallback} callback - The callback function to be executed after finalizing the stream.
     * @return {void} This function does not return anything.
     */
    _final(callback: TransformCallback): void {
        while (this.buffer.length > 0) {
            const chunk = this.buffer.shift() as T;
            if (!this.push(chunk)) {
                this.buffer.unshift(chunk);
                callback(new PushError());
                return;
            }
        }
        this.push(null);
        callback();
    }

    /**
     * Pushes the ready chunks to the consumer stream since the buffer is empty or the size limit is reached.
     *
     * @param {number} size - The size parameter for controlling the read operation.
     * @return {void} This function does not return anything.
     */
    _read(size: number): void {
        while (this.buffer.length > 0 && size > 0) {
            const chunk = this.buffer.shift() as T;
            if (!this.push(chunk)) {
                this.buffer.unshift(chunk);
            }
            size--;
        }
    }

    addListener<U extends keyof FilterStreamEventHandlers<T>>(event: U, listener: FilterStreamEventHandlers<T>[U]): this {
        return super.addListener(event, listener);
    }

    emit<U extends keyof FilterStreamEventEmitters<T>>(event: U, ...args: Array<FilterStreamEventEmitters<T>[U]>): boolean {
        return super.emit(event, ...args);
    }

    on<U extends keyof FilterStreamEventHandlers<T>>(event: U, listener: FilterStreamEventHandlers<T>[U]): this {
        return super.on(event, listener);
    }

    once<U extends keyof FilterStreamEventHandlers<T>>(event: U, listener: FilterStreamEventHandlers<T>[U]): this {
        return super.once(event, listener);
    }

    prependListener<U extends keyof FilterStreamEventHandlers<T>>(event: U, listener: FilterStreamEventHandlers<T>[U]): this {
        return super.prependListener(event, listener);
    }

    prependOnceListener<U extends keyof FilterStreamEventHandlers<T>>(event: U, listener: FilterStreamEventHandlers<T>[U]): this {
        return super.prependOnceListener(event, listener);
    }

    removeListener<U extends keyof FilterStreamEventHandlers<T>>(event: U, listener: FilterStreamEventHandlers<T>[U]): this {
        return super.removeListener(event, listener);
    }
}