// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface TypedEventEmitter<TEventMap extends Record<string, any>> {
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
    ): boolean;

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
    ): this;

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
    ): this;

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
    ): this;

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
    ): this;

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
    ): this;

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
    ): this;

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
    ): this;

    /**
     * Removes all listeners for the specified event type.
     * 
     * @typeParam U - The event type.
     * @param event - The event type.
     * @returns This instance for chaining.
     */
    removeAllListeners<U extends keyof TEventMap & string>(event?: U): this;

    /**
     * Returns an array of listeners for the specified event type.
     * 
     * @typeParam U - The event type.
     * @param event - The event type.
     * @returns Array of listeners for the specified event.
     */
    listeners<U extends keyof TEventMap & string>(event: U): ((...args:Array<TEventMap[U]>) => void)[];

    /**
     * Returns the number of listeners for the specified event type.
     * 
     * @typeParam U - The event type.
     * @param event - The event type.
     * @returns The number of listeners.
     */
    listenerCount<U extends keyof TEventMap & string>(event: U): number;
}