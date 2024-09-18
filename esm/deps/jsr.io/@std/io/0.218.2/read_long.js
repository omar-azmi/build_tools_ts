// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import * as dntShim from "../../../../../_dnt.shims.js";
import { readInt } from "./read_int.js";
const MAX_SAFE_INTEGER = BigInt(Number.MAX_SAFE_INTEGER);
/**
 * Read big endian 64bit long from BufReader
 * @param buf
 *
 * @deprecated (will be removed after 1.0.0) Use the {@link https://developer.mozilla.org/en-US/docs/Web/API/Streams_API | Web Streams API} instead.
 */
export async function readLong(buf) {
    const high = await readInt(buf);
    if (high === null)
        return null;
    const low = await readInt(buf);
    if (low === null)
        throw new dntShim.Deno.errors.UnexpectedEof();
    const big = (BigInt(high) << 32n) | BigInt(low);
    // We probably should provide a similar API that returns BigInt values.
    if (big > MAX_SAFE_INTEGER) {
        throw new RangeError("Long value too big to be represented as a JavaScript number.");
    }
    return Number(big);
}