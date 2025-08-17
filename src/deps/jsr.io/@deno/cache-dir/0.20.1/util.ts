// Copyright 2018-2025 the Deno authors. MIT license.
import * as dntShim from "../../../../../_dnt.shims.js";


export const CACHE_PERM = 0o644;

export function assert(cond: unknown, msg = "Assertion failed."): asserts cond {
  if (!cond) {
    throw new Error(msg);
  }
}

export function isFileSync(filePath: string): boolean {
  try {
    const stats = dntShim.Deno.lstatSync(filePath);
    return stats.isFile;
  } catch (err) {
    if (err instanceof dntShim.Deno.errors.NotFound) {
      return false;
    }
    throw err;
  }
}
