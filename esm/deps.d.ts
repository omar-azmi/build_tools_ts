export type { BuildOptions as DntBuildOptions, PackageJson } from "./deps/jsr.io/@deno/dnt/0.41.3/mod.js";
export { decode_str as decodeText, encode_str as encodeText } from "./deps/jsr.io/@oazmi/kitchensink/0.8.4/src/eightpack.js";
export { memorize } from "./deps/jsr.io/@oazmi/kitchensink/0.8.4/src/lambda.js";
export type { MaybePromise, Require } from "./deps/jsr.io/@oazmi/kitchensink/0.8.4/src/typedefs.js";
export { isAbsolutePath, joinPaths, relativePath } from "./deps/jsr.io/@oazmi/kitchensink/0.8.4/src/pathman.js";
export { defaultStopwatch } from "./deps/jsr.io/@oazmi/kitchensink/0.8.4/src/timeman.js";
export { copy as copyDir, emptyDir, ensureDir, ensureFile, expandGlob } from "./deps/jsr.io/@std/fs/1.0.5/mod.js";
export { globToRegExp, isGlob as pathIsGlobPattern } from "./deps/jsr.io/@std/path/1.0.7/mod.js";
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
type ReadableStreamKind<T> = T extends string ? "string" : "uint8array";
/** detects the type of a `ReadableStream`.
 * note that the original stream is partially consumed, and you will not be able to use it any longer.
 * instead, you will have to use the new stream returned by this function for consumption.
 *
 * the implementation works as follows:
 * - create 2 clones of the original-stream via the `tee` method
 * - read the first-stream-clone's first chunk, and guess the type based on it
 * - cancel the original-stream and the first-stream-clone
 * - return the untouched second-stream-clone and the guessed type in an `Object` wrapper
*/
export declare const detectReadableStreamType: <T extends string | Uint8Array, K extends ReadableStreamKind<T>>(stream: ReadableStream<T>) => Promise<{
    kind: K;
    stream: typeof stream;
}>;
//# sourceMappingURL=deps.d.ts.map