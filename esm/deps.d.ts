export type { BuildOptions as DntBuildOptions, PackageJson } from "./deps/jsr.io/@deno/dnt/0.42.1/mod.js";
export { console_log, console_warn, object_assign, object_entries, object_keys, object_values } from "./deps/jsr.io/@oazmi/kitchensink/0.9.16/src/alias.js";
export { detectReadableStreamType } from "./deps/jsr.io/@oazmi/kitchensink/0.9.16/src/browser.js";
export { decode_str as decodeText, encode_str as encodeText } from "./deps/jsr.io/@oazmi/kitchensink/0.9.16/src/eightpack.js";
export { memorize } from "./deps/jsr.io/@oazmi/kitchensink/0.9.16/src/lambda.js";
export { ensureEndSlash, ensureStartDotSlash, ensureStartSlash, isAbsolutePath, joinPaths, parseFilepathInfo, relativePath, trimSlashes } from "./deps/jsr.io/@oazmi/kitchensink/0.9.16/src/pathman.js";
export { isArray, isObject } from "./deps/jsr.io/@oazmi/kitchensink/0.9.16/src/struct.js";
export { defaultStopwatch } from "./deps/jsr.io/@oazmi/kitchensink/0.9.16/src/timeman.js";
export type { MaybePromise, Require } from "./deps/jsr.io/@oazmi/kitchensink/0.9.16/src/typedefs.js";
export { copy as copyDir, emptyDir, ensureDir, ensureFile, expandGlob } from "./deps/jsr.io/@std/fs/1.0.20/mod.js";
export { globToRegExp, isGlob as pathIsGlobPattern } from "./deps/jsr.io/@std/path/1.1.3/mod.js";
/** get the current working directory (`Deno.cwd`) in posix path format. */
export declare const getCwdPath: () => string;
/** resolve a file path so that it becomes absolute, with unix directory separator ("/").
 * TODO: refactor the name `pathResolve` to `resolvePath`
*/
export declare const pathResolve: (...segments: string[]) => string;
/** resolve a `path` (with an optional `base` path) as a `URL` object.
 * if a relative `path` is provided, and no `base` path is given, then it will be assumed that the `base` path is the current working directory (`Deno.cwd()`).
*/
export declare const resolveAsUrl: (path: string | URL, base?: string | URL) => URL;
//# sourceMappingURL=deps.d.ts.map