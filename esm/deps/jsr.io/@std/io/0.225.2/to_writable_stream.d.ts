import type { Writer } from "./types.js";
/** Options for {@linkcode toWritableStream}. */
export interface toWritableStreamOptions {
    /**
     * If the `writer` is also a `Closer`, automatically close the `writer`
     * when the stream is closed, aborted, or a write error occurs.
     *
     * @default {true}
     */
    autoClose?: boolean;
}
/**
 * Create a {@linkcode WritableStream} from a {@linkcode Writer}.
 *
 * @example Usage
 * ```ts no-assert
 * import { toWritableStream } from "@std/io/to-writable-stream";
 *
 * const a = toWritableStream(Deno.stdout); // Same as `Deno.stdout.writable`
 * ```
 *
 * @param writer The writer to write to
 * @param options The options
 * @returns The writable stream
 */
export declare function toWritableStream(writer: Writer, options?: toWritableStreamOptions): WritableStream<Uint8Array>;
//# sourceMappingURL=to_writable_stream.d.ts.map