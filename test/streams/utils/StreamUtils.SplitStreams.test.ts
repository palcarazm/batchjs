import {Writable} from "stream";
import { StreamUtils } from "../../../src/streams/index";
import { buffer2String, CollectStream } from "../TestUtils";

describe("StreamUtils.SplitStreams", () => {

    test("should split streams correctly with objectMode", (done) => {
        const streams: Array<CollectStream> = [
            new CollectStream({objectMode: true}),
            new CollectStream({objectMode: true}),
            new CollectStream({objectMode: true})
        ];

        const splitter: Writable = StreamUtils.splitStreams(streams,{objectMode: true});

        splitter.write("a");
        splitter.write("b");
        splitter.write("c");
        splitter.end();

        splitter.once("close", () => {
            streams.forEach((stream: CollectStream) => {
                expect(stream.chunks).toEqual(["a","b","c"]);
            });
            done();
        });

    });

    test("should split streams correctly without objectMode", (done) => {
        const streams: Array<CollectStream> = [
            new CollectStream(),
            new CollectStream(),
            new CollectStream()
        ];

        const splitter: Writable = StreamUtils.splitStreams(streams);

        splitter.write("a");
        splitter.write("b");
        splitter.write("c");
        splitter.end();

        splitter.once("close", () => {
            streams.forEach((stream: CollectStream) => {
                expect(buffer2String((stream.chunks as Buffer[]))).toEqual(["a","b","c"]);
            });
            done();
        });

    });

    test("split method should close all streams on finish", (done) => {
        const streams: Array<CollectStream> = [
            new CollectStream({objectMode: true}),
            new CollectStream({objectMode: true}),
            new CollectStream({objectMode: true})
        ];

        const splitter: Writable = StreamUtils.splitStreams(streams,{objectMode: true});

        splitter.end();

        splitter.once("close", () => {
            streams.forEach((stream: CollectStream) => {
                expect(stream.closed).toEqual(true);
            });
            done();
        });

    });

    test("should split streams handle drain on write", (done) => {
        const streams: Array<CollectStream> = [
            new CollectStream({objectMode: true}),
            new CollectStream({objectMode: true}),
            new CollectStream({objectMode: true})
        ];

        jest.spyOn(streams.at(2) as CollectStream, "write").mockImplementation(() => false);

        const splitter: Writable = StreamUtils.splitStreams(streams,{objectMode: true});

        splitter.write("a");
        splitter.end();
        
        setTimeout(() => {
            expect(streams.at(0)?.chunks).toEqual(["a"]);
            expect(streams.at(1)?.chunks).toEqual(["a"]);
            expect(streams.at(2)?.chunks).toEqual([]);

            jest.spyOn(streams.at(2) as CollectStream, "write").mockImplementation((chunk: unknown) => {
                streams.at(2)?.chunks?.push(chunk);
                return true;
            });
            streams.at(2)?.emit("drain");
        }, 50);

        splitter.once("close", () => {
            streams.forEach((stream: CollectStream) => {
                expect(stream.chunks).toEqual(["a"]);
            });
            done();
        });

    });
});
