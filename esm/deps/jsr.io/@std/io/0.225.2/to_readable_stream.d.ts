import type { Closer, Reader } from "./types.js";
/** Options for {@linkcode toReadableStream}. */
export interface ToReadableStreamOptions {
    /** If the `reader` is also a `Closer`, automatically close the `reader`
     * when `EOF` is encountered, or a read error occurs.
     *
     * @default {true}
     */
    autoClose?: boolean;
    /**
     * The size of chunks to allocate to read.
     *
     * @default {16640}
     */
    chunkSize?: number;
    /** The queuing strategy to create the {@linkcode ReadableStream} with. */
    strategy?: QueuingStrategy<Uint8Array>;
}
/**
 * Create a {@linkcode ReadableStream} of {@linkcode Uint8Array}s from a
 * {@linkcode Reader}.
 *
 * When the pull algorithm is called on the stream, a chunk from the reader
 * will be read.  When `null` is returned from the reader, the stream will be
 * closed along with the reader (if it is also a `Closer`).
 *
 * @example Usage
 * ```ts no-assert
 * import { toReadableStream } from "@std/io/to-readable-stream";
 *
 * using file = await Deno.open("./README.md", { read: true });
 * const fileStream = toReadableStream(file);
 * ```
 *
 * @param reader The reader to read from
 * @param options The options
 * @returns The readable stream
 */
export declare function toReadableStream(reader: Reader | (Reader & Closer), options?: ToReadableStreamOptions): ReadableStream<Uint8Array>;
//# sourceMappingURL=to_readable_stream.d.ts.map