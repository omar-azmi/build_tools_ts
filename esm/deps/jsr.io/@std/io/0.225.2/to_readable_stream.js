// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { DEFAULT_CHUNK_SIZE } from "./_constants.js";
import { isCloser } from "./_common.js";
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
export function toReadableStream(reader, options) {
    const { autoClose = true, chunkSize = DEFAULT_CHUNK_SIZE, strategy, } = options ?? {};
    return new ReadableStream({
        async pull(controller) {
            const chunk = new Uint8Array(chunkSize);
            try {
                const read = await reader.read(chunk);
                if (read === null) {
                    if (isCloser(reader) && autoClose) {
                        reader.close();
                    }
                    controller.close();
                    return;
                }
                controller.enqueue(chunk.subarray(0, read));
            }
            catch (e) {
                controller.error(e);
                if (isCloser(reader)) {
                    reader.close();
                }
            }
        },
        cancel() {
            if (isCloser(reader) && autoClose) {
                reader.close();
            }
        },
    }, strategy);
}
