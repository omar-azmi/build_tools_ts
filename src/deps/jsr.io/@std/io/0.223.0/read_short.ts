// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import * as dntShim from "../../../../../_dnt.shims.js";


import type { BufReader } from "./buf_reader.js";

/**
 * Read big endian 16bit short from BufReader
 * @param buf
 *
 * @deprecated (will be removed after 1.0.0) Use the {@link https://developer.mozilla.org/en-US/docs/Web/API/Streams_API | Web Streams API} instead.
 */
export async function readShort(buf: BufReader): Promise<number | null> {
  const high = await buf.readByte();
  if (high === null) return null;
  const low = await buf.readByte();
  if (low === null) throw new dntShim.Deno.errors.UnexpectedEof();
  return (high << 8) | low;
}
