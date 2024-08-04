import {Readable} from "stream";
import { StreamUtils } from "../../../src/streams/index";
import { buffer2String, chunks2Readable } from "../TestUtils";

describe("StreamUtils.MergeStreams", () => {

    test("should merge streams correctly with object mode", (done) => {
        const streams: Array<Readable> = [
            chunks2Readable(["a","b","c"],{objectMode: true}),
            chunks2Readable(["d","e","f"],{objectMode: true}),
            chunks2Readable(["g","h","i"],{objectMode: true})
        ];

        const merged: Readable = StreamUtils.mergeStreams(streams,{objectMode: true});

        const receivedChunks: Array<string> = [];
        merged.on("data", (chunk: string) => {
            receivedChunks.push(chunk);
        }).once("end", () => {
            expect(receivedChunks).toEqual(["a","b","c","d","e","f","g","h","i"]);
            done();
        });
    });

    test("should merge streams correctly without object mode", (done) => {
        const streams: Array<Readable> = [
            chunks2Readable(["a","b","c"]),
            chunks2Readable(["d","e","f"]),
            chunks2Readable(["g","h","i"])
        ];

        const merged: Readable = StreamUtils.mergeStreams(streams);

        const receivedChunks: Array<Buffer> = [];
        merged.on("data", (chunk: Buffer) => {
            receivedChunks.push(chunk);
        }).once("end", () => {
            expect(buffer2String(receivedChunks)).toEqual(["a","b","c","d","e","f","g","h","i"]);
            done();
        });
    });

});
