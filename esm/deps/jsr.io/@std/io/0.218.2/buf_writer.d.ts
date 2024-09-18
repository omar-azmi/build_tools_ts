import type { Writer, WriterSync } from "./types.js";
declare abstract class AbstractBufBase {
    buf: Uint8Array;
    usedBufferBytes: number;
    err: Error | null;
    constructor(buf: Uint8Array);
    /** Size returns the size of the underlying buffer in bytes. */
    size(): number;
    /** Returns how many bytes are unused in the buffer. */
    available(): number;
    /** buffered returns the number of bytes that have been written into the
     * current buffer.
     */
    buffered(): number;
}
/** BufWriter implements buffering for an deno.Writer object.
 * If an error occurs writing to a Writer, no more data will be
 * accepted and all subsequent writes, and flush(), will return the error.
 * After all data has been written, the client should call the
 * flush() method to guarantee all data has been forwarded to
 * the underlying deno.Writer.
 *
 * @deprecated (will be removed after 1.0.0) Use the {@link https://developer.mozilla.org/en-US/docs/Web/API/Streams_API | Web Streams API} instead.
 */
export declare class BufWriter extends AbstractBufBase implements Writer {
    #private;
    /** return new BufWriter unless writer is BufWriter */
    static create(writer: Writer, size?: number): BufWriter;
    constructor(writer: Writer, size?: number);
    /** Discards any unflushed buffered data, clears any error, and
     * resets buffer to write its output to w.
     */
    reset(w: Writer): void;
    /** Flush writes any buffered data to the underlying io.Writer. */
    flush(): Promise<void>;
    /** Writes the contents of `data` into the buffer. If the contents won't fully
     * fit into the buffer, those bytes that are copied into the buffer will be flushed
     * to the writer and the remaining bytes are then copied into the now empty buffer.
     *
     * @return the number of bytes written to the buffer.
     */
    write(data: Uint8Array): Promise<number>;
}
/** BufWriterSync implements buffering for a deno.WriterSync object.
 * If an error occurs writing to a WriterSync, no more data will be
 * accepted and all subsequent writes, and flush(), will return the error.
 * After all data has been written, the client should call the
 * flush() method to guarantee all data has been forwarded to
 * the underlying deno.WriterSync.
 *
 * @deprecated (will be removed after 1.0.0) Use the {@link https://developer.mozilla.org/en-US/docs/Web/API/Streams_API | Web Streams API} instead.
 */
export declare class BufWriterSync extends AbstractBufBase implements WriterSync {
    #private;
    /** return new BufWriterSync unless writer is BufWriterSync */
    static create(writer: WriterSync, size?: number): BufWriterSync;
    constructor(writer: WriterSync, size?: number);
    /** Discards any unflushed buffered data, clears any error, and
     * resets buffer to write its output to w.
     */
    reset(w: WriterSync): void;
    /** Flush writes any buffered data to the underlying io.WriterSync. */
    flush(): void;
    /** Writes the contents of `data` into the buffer.  If the contents won't fully
     * fit into the buffer, those bytes that can are copied into the buffer, the
     * buffer is the flushed to the writer and the remaining bytes are copied into
     * the now empty buffer.
     *
     * @return the number of bytes written to the buffer.
     */
    writeSync(data: Uint8Array): number;
}
export {};
//# sourceMappingURL=buf_writer.d.ts.map