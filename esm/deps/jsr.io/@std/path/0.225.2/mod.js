// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported mostly from https://github.com/browserify/path-browserify/
// This module is browser compatible.
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
 * Example, for POSIX:
 *
 * ```ts
 * import { fromFileUrl } from "@std/path/posix/from-file-url";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * assertEquals(fromFileUrl("file:///home/foo"), "/home/foo");
 * ```
 *
 * Or, for Windows:
 *
 * ```ts
 * import { fromFileUrl } from "@std/path/windows/from-file-url";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * assertEquals(fromFileUrl("file:///home/foo"), "\\home\\foo");
 * ```
 *
 * This module is browser compatible.
 *
 * @module
 */
import * as _windows from "./windows/mod.js";
import * as _posix from "./posix/mod.js";
/**
 * Module for working with Windows file paths.
 *
 * @deprecated This will be removed in 1.0.0. Import from
 * {@link https://jsr.io/@std/path/doc/windows/~ | @std/path/windows} instead.
 */
export const win32 = _windows;
/**
 * Module for working with POSIX file paths.
 *
 * @deprecated This will be removed in 1.0.0. Import from
 * {@link https://jsr.io/@std/path/doc/posix/~ | @std/path/posix} instead.
 */
export const posix = _posix;
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
export * from "./_interface.js";
export * from "./glob_to_regexp.js";
export * from "./is_glob.js";
export * from "./join_globs.js";
export * from "./normalize_glob.js";
