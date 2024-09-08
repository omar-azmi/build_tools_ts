// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { _common } from "../_common/common.js";
import { SEPARATOR } from "./constants.js";
/** Determines the common path from a set of paths, using an optional separator,
 * which defaults to the OS default separator.
 *
 * @example Usage
 * ```ts
 * import { common } from "@std/path/posix/common";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * const path = common([
 *   "./deno/std/path/mod.ts",
 *   "./deno/std/fs/mod.ts",
 * ]);
 * assertEquals(path, "./deno/std/");
 * ```
 *
 * @param paths The paths to compare.
 * @param sep The separator to use. Defaults to `/`.
 * @returns The common path.
 */
export function common(paths, sep = SEPARATOR) {
    return _common(paths, sep);
}
