import type { Reader } from "./types.js";
/**
 * @deprecated (will be removed after 1.0.0) Use the {@link https://developer.mozilla.org/en-US/docs/Web/API/Streams_API | Web Streams API} instead.
 */
export declare class BufferFullError extends Error {
    partial: Uint8Array;
    name: string;
    constructor(partial: Uint8Array);
}
/**
 * @deprecated (will be removed after 1.0.0) Use the {@link https://developer.mozilla.org/en-US/docs/Web/API/Streams_API | Web Streams API} instead.
 */
export declare class PartialReadError extends Error {
    name: string;
    partial?: Uint8Array;
    constructor();
}
/**
 * Result type returned by of BufReader.readLine().
 *
 * @deprecated (will be removed after 1.0.0) Use the {@link https://developer.mozilla.org/en-US/docs/Web/API/Streams_API | Web Streams API} instead.
 */
export interface ReadLineResult {
    line: Uint8Array;
    more: boolean;
}
/**
 * @deprecated (will be removed after 1.0.0) Use the {@link https://developer.mozilla.org/en-US/docs/Web/API/Streams_API | Web Streams API} instead.
 */
export declare class BufReader implements Reader {
    #private;
    /** return new BufReader unless r is BufReader */
    static create(r: Reader, size?: number): BufReader;
    constructor(rd: Reader, size?: number);
    /** Returns the size of the underlying buffer in bytes. */
    size(): number;
    buffered(): number;
    /** Discards any buffered data, resets all state, and switches
     * the buffered reader to read from r.
     */
    reset(r: Reader): void;
    /** reads data into p.
     * It returns the number of bytes read into p.
     * The bytes are taken from at most one Read on the underlying Reader,
     * hence n may be less than len(p).
     * To read exactly len(p) bytes, use io.ReadFull(b, p).
     */
    read(p: Uint8Array): Promise<number | null>;
    /** reads exactly `p.length` bytes into `p`.
     *
     * If successful, `p` is returned.
     *
     * If the end of the underlying stream has been reached, and there are no more
     * bytes available in the buffer, `readFull()` returns `null` instead.
     *
     * An error is thrown if some bytes could be read, but not enough to fill `p`
     * entirely before the underlying stream reported an error or EOF. Any error
     * thrown will have a `partial` property that indicates the slice of the
     * buffer that has been successfully filled with data.
     *
     * Ported from https://golang.org/pkg/io/#ReadFull
     */
    readFull(p: Uint8Array): Promise<Uint8Array | null>;
    /** Returns the next byte [0, 255] or `null`. */
    readByte(): Promise<number | null>;
    /** readString() reads until the first occurrence of delim in the input,
     * returning a string containing the data up to and including the delimiter.
     * If ReadString encounters an error before finding a delimiter,
     * it returns the data read before the error and the error itself
     * (often `null`).
     * ReadString returns err !== null if and only if the returned data does not end
     * in delim.
     * For simple uses, a Scanner may be more convenient.
     */
    readString(delim: string): Promise<string | null>;
    /** `readLine()` is a low-level line-reading primitive. Most callers should
     * use `readString('\n')` instead or use a Scanner.
     *
     * `readLine()` tries to return a single line, not including the end-of-line
     * bytes. If the line was too long for the buffer then `more` is set and the
     * beginning of the line is returned. The rest of the line will be returned
     * from future calls. `more` will be false when returning the last fragment
     * of the line. The returned buffer is only valid until the next call to
     * `readLine()`.
     *
     * The text returned from ReadLine does not include the line end ("\r\n" or
     * "\n").
     *
     * When the end of the underlying stream is reached, the final bytes in the
     * stream are returned. No indication or error is given if the input ends
     * without a final line end. When there are no more trailing bytes to read,
     * `readLine()` returns `null`.
     *
     * Calling `unreadByte()` after `readLine()` will always unread the last byte
     * read (possibly a character belonging to the line end) even if that byte is
     * not part of the line returned by `readLine()`.
     */
    readLine(): Promise<ReadLineResult | null>;
    /** `readSlice()` reads until the first occurrence of `delim` in the input,
     * returning a slice pointing at the bytes in the buffer. The bytes stop
     * being valid at the next read.
     *
     * If `readSlice()` encounters an error before finding a delimiter, or the
     * buffer fills without finding a delimiter, it throws an error with a
     * `partial` property that contains the entire buffer.
     *
     * If `readSlice()` encounters the end of the underlying stream and there are
     * any bytes left in the buffer, the rest of the buffer is returned. In other
     * words, EOF is always treated as a delimiter. Once the buffer is empty,
     * it returns `null`.
     *
     * Because the data returned from `readSlice()` will be overwritten by the
     * next I/O operation, most clients should use `readString()` instead.
     */
    readSlice(delim: number): Promise<Uint8Array | null>;
    /** `peek()` returns the next `n` bytes without advancing the reader. The
     * bytes stop being valid at the next read call.
     *
     * When the end of the underlying stream is reached, but there are unread
     * bytes left in the buffer, those bytes are returned. If there are no bytes
     * left in the buffer, it returns `null`.
     *
     * If an error is encountered before `n` bytes are available, `peek()` throws
     * an error with the `partial` property set to a slice of the buffer that
     * contains the bytes that were available before the error occurred.
     */
    peek(n: number): Promise<Uint8Array | null>;
}
//# sourceMappingURL=buf_reader.d.ts.map