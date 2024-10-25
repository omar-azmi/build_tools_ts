// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
const decoder = new TextDecoder();
/**
 * Writer utility for buffering string chunks.
 *
 * @example
 * ```ts
 * import {
 *   copyN,
 *   StringReader,
 *   StringWriter,
 * } from "@std/io";
 * import { copy } from "@std/io/copy";
 *
 * const w = new StringWriter("base");
 * const r = new StringReader("0123456789");
 * await copyN(r, w, 4); // copy 4 bytes
 *
 * // Number of bytes read
 * console.log(w.toString()); //base0123
 *
 * await copy(r, w); // copy all
 * console.log(w.toString()); // base0123456789
 * ```
 *
 * **Output:**
 *
 * ```text
 * base0123
 * base0123456789
 * ```
 *
 * @deprecated (will be removed after 1.0.0) Use the {@link https://developer.mozilla.org/en-US/docs/Web/API/Streams_API | Web Streams API} instead.
 */
export class StringWriter {
    base;
    #chunks = [];
    #byteLength = 0;
    #cache;
    constructor(base = "") {
        this.base = base;
        const c = new TextEncoder().encode(base);
        this.#chunks.push(c);
        this.#byteLength += c.byteLength;
    }
    write(p) {
        return Promise.resolve(this.writeSync(p));
    }
    writeSync(p) {
        this.#chunks.push(new Uint8Array(p));
        this.#byteLength += p.byteLength;
        this.#cache = undefined;
        return p.byteLength;
    }
    toString() {
        if (this.#cache) {
            return this.#cache;
        }
        const buf = new Uint8Array(this.#byteLength);
        let offs = 0;
        for (const chunk of this.#chunks) {
            buf.set(chunk, offs);
            offs += chunk.byteLength;
        }
        this.#cache = decoder.decode(buf);
        return this.#cache;
    }
}
