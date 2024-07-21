import { Duplex } from "stream";
import { DiscardingStreamEventEmitters, DiscardingStreamEventHandlers } from "../events/_index";

/**
 * A class that allows you to filter data in a stream.
 */
export abstract class DiscardingStream<T> extends Duplex {
    addListener<U extends keyof DiscardingStreamEventHandlers<T>>(event: U, listener: DiscardingStreamEventHandlers<T>[U]): this {
        return super.addListener(event, listener);
    }

    emit<U extends keyof DiscardingStreamEventEmitters<T>>(event: U, ...args: Array<DiscardingStreamEventEmitters<T>[U]>): boolean {
        return super.emit(event, ...args);
    }

    on<U extends keyof DiscardingStreamEventHandlers<T>>(event: U, listener: DiscardingStreamEventHandlers<T>[U]): this {
        return super.on(event, listener);
    }

    once<U extends keyof DiscardingStreamEventHandlers<T>>(event: U, listener: DiscardingStreamEventHandlers<T>[U]): this {
        return super.once(event, listener);
    }

    prependListener<U extends keyof DiscardingStreamEventHandlers<T>>(event: U, listener: DiscardingStreamEventHandlers<T>[U]): this {
        return super.prependListener(event, listener);
    }

    prependOnceListener<U extends keyof DiscardingStreamEventHandlers<T>>(event: U, listener: DiscardingStreamEventHandlers<T>[U]): this {
        return super.prependOnceListener(event, listener);
    }

    removeListener<U extends keyof DiscardingStreamEventHandlers<T>>(event: U, listener: DiscardingStreamEventHandlers<T>[U]): this {
        return super.removeListener(event, listener);
    }
}