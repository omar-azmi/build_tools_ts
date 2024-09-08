/**
 * Utilities for working with OS-specific file paths.
 *
 * Functions from this module will automatically switch to support the path style
 * of the current OS, either `windows` for Microsoft Windows, or `posix` for
 * every other operating system, eg. Linux, MacOS, BSD etc.
 *
 * To use functions for a specific path style regardless of the current OS
 * import the modules from the platform sub directory instead.
 *
 * Example, for `posix`:
 *
 * ```ts
 * import { fromFileUrl } from "@std/path/posix/from_file_url";
 * const p = fromFileUrl("file:///home/foo");
 * console.log(p); // "/home/foo"
 * ```
 *
 * or, for `windows`:
 *
 * ```ts
 * import { fromFileUrl } from "@std/path/windows/from_file_url";
 * const p = fromFileUrl("file:///home/foo");
 * console.log(p); // "\\home\\foo"
 * ```
 *
 * This module is browser compatible.
 *
 * @module
 */
import * as _windows from "./windows/mod.js";
import * as _posix from "./posix/mod.js";
/** @deprecated (will be removed after 1.0.0) Import from {@link https://deno.land/std/path/windows/mod.ts} instead. */
export declare const win32: typeof _windows;
/** @deprecated (will be removed after 1.0.0) Import from {@link https://deno.land/std/posix/mod.ts} instead. */
export declare const posix: typeof _posix;
/**
 * @deprecated (will be removed in 0.215.0) Use {@linkcode SEPARATOR} instead.
 */
export declare const sep: "\\" | "/";
/**
 * @deprecated (will be removed in 0.215.0) Use {@linkcode DELIMITER} instead.
 */
export declare const delimiter: ";" | ":";
export * from "./basename.js";
export * from "./constants.js";
export * from "./dirname.js";
export * from "./extname.js";
export * from "./format.js";
export * from "./from_file_url.js";
export * from "./is_absolute.js";
export * from "./join.js";
export * from "./normalize.js";
export * from "./parse.js";
export * from "./relative.js";
export * from "./resolve.js";
export * from "./to_file_url.js";
export * from "./to_namespaced_path.js";
export * from "./common.js";
export * from "./separator.js";
export * from "./_interface.js";
export * from "./glob_to_regexp.js";
export * from "./is_glob.js";
export * from "./join_globs.js";
export * from "./normalize_glob.js";
//# sourceMappingURL=mod.d.ts.map