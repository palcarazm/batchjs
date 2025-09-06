import { ObjectWritable } from "../../../../src/streams/interfaces/_index";

describe("ObjectWritable", () => {
  class ObjectWritableImplementation extends ObjectWritable<string> {
    public chunks: Array<string> = [];
    constructor() {
      super({ objectMode: true });
    }
    _write(
      chunk: string,
      encoding: BufferEncoding,
      callback: (error?: Error | null) => void
    ): void {
      this.chunks.push(chunk);
      callback();
    }
  }
  let stream: ObjectWritableImplementation;

  beforeEach(() => {
    stream = new ObjectWritableImplementation();
  });

  test("should handle _write data correctly", (done) => {
    stream.write("data1");
    stream.write("data2");
    stream.write("data3");
    stream.end();

    stream.on("close", () => {
      expect(stream.chunks).toEqual(["data1", "data2", "data3"]);
      done();
    });
  });
});
