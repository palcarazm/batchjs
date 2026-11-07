import { Readable, ReadableOptions } from "node:stream";
import { ReadableEventMap, TypedEventEmitter } from "../_index";

/**
 * @interface
 * Options for the ObjectReadable.
 * @extends ReadableOptions
 */
export interface ObjectReadableOptions extends ReadableOptions {
    /**
     * Whether the stream should operate in object mode.
     */
    objectMode?:true;

    /**
     * Milliseconds until the stream is considered drained.
     */
    drainTimeout?: number;
}

const defaultOptions = {
    objectMode: true,
    drainTimeout: 50
};

/**
 * @abstract
 * @class
 * Abstract class that handle data in a stream in object mode.
 * @extends Readable
 * @template Tout The type of the output data
 * @template TEventMap The type of the event map
 */
 
export abstract class ObjectReadable<
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Tout = any,
TEventMap extends ReadableEventMap<Tout> = ReadableEventMap<Tout>
> extends Readable implements TypedEventEmitter<TEventMap> {
    readonly drainTimeout: number;

    /**
     * @param {ObjectReadableOptions} options - The options for the ObjectReadable.
     */
    constructor(options: ObjectReadableOptions) {
        const opts = {...defaultOptions, ...options};
        super(opts);
        this.drainTimeout = opts.drainTimeout;
    }

    read(size?: number):Tout|null {
        return super.read(size);
    }

    /**
     * Emits an event of the specified type to the listeners.
     * 
     * @typeParam U - The event type.
     * @param event - The event type.
     * @param args - Additional arguments.
     * @returns Whether the event had listeners.
     */
    emit<U extends keyof TEventMap & string>(
        event: U,
        ...args: Array<TEventMap[U]>
    ): boolean {
        return super.emit(event, ...args);
    }

    /**
     * Adds an event listener to the specified event type.
     * 
     * @typeParam U - The event type.
     * @param event - The event type.
     * @param listener - The event listener.
     * @returns This instance for chaining.
     */
    addListener<U extends keyof TEventMap & string>(
        event: U,
        listener: (...args:Array<TEventMap[U]>) => void
    ): this {
        return super.addListener(event, listener);
    }

    /**
     * Adds an event listener to the specified event type.
     * 
     * @typeParam U - The event type.
     * @param event - The event type.
     * @param listener - The event listener.
     * @returns This instance for chaining.
     */
    on<U extends keyof TEventMap & string>(
        event: U,
        listener: (...args:Array<TEventMap[U]>) => void
    ): this {
        return super.on(event, listener);
    }

    /**
     * Adds a one-time event listener to the specified event type.
     * 
     * @typeParam U - The event type.
     * @param event - The event type.
     * @param listener - The event listener.
     * @returns This instance for chaining.
     */
    once<U extends keyof TEventMap & string>(
        event: U,
        listener:  (...args:Array<TEventMap[U]>) => void
    ): this {
        return super.once(event, listener);
    }

    /**
     * Adds an event listener to the beginning of the listeners array.
     * 
     * @typeParam U - The event type.
     * @param event - The event type.
     * @param listener - The event listener.
     * @returns This instance for chaining.
     */
    prependListener<U extends keyof TEventMap & string>(
        event: U,
        listener:  (...args:Array<TEventMap[U]>) => void
    ): this {
        return super.prependListener(event, listener);
    }

    /**
     * Adds a one-time event listener to the beginning of the listeners array.
     * 
     * @typeParam U - The event type.
     * @param event - The event type.
     * @param listener - The event listener.
     * @returns This instance for chaining.
     */
    prependOnceListener<U extends keyof TEventMap & string>(
        event: U,
        listener:  (...args:Array<TEventMap[U]>) => void
    ): this {
        return super.prependOnceListener(event, listener);
    }

    /**
     * Removes an event listener from the specified event type.
     * 
     * @typeParam U - The event type.
     * @param event - The event type.
     * @param listener - The event listener.
     * @returns This instance for chaining.
     */
    removeListener<U extends keyof TEventMap & string>(
        event: U,
        listener:  (...args:Array<TEventMap[U]>) => void
    ): this {
        return super.removeListener(event, listener);
    }

    /**
     * Alias for removeListener.
     * 
     * @typeParam U - The event type.
     * @param event - The event type.
     * @param listener - The event listener.
     * @returns This instance for chaining.
     */
    off<U extends keyof TEventMap & string>(
        event: U,
        listener:  (...args:Array<TEventMap[U]>) => void
    ): this {
        return this.removeListener(event, listener);
    }

    /**
     * Removes all listeners for the specified event type.
     * 
     * @typeParam U - The event type.
     * @param event - The event type.
     * @returns This instance for chaining.
     */
    removeAllListeners<U extends keyof TEventMap & string>(event?: U): this {
        return super.removeAllListeners(event);
    }

    /**
     * Returns an array of listeners for the specified event type.
     * 
     * @typeParam U - The event type.
     * @param event - The event type.
     * @returns Array of listeners for the specified event.
     */
    listeners<U extends keyof TEventMap & string>(event: U): ((...args:Array<TEventMap[U]>) => void)[] {
        return super.listeners(event);
    }

    /**
     * Returns the number of listeners for the specified event type.
     * 
     * @typeParam U - The event type.
     * @param event - The event type.
     * @returns The number of listeners.
     */
    listenerCount<U extends keyof TEventMap & string>(event: U): number {
        return super.listenerCount(event);
    }
}

export type ReadCallback = (error?: Error | null) => void;