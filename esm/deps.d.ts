export type { BuildOptions as DntBuildOptions, PackageJson } from "./deps/jsr.io/@deno/dnt/0.41.2/mod.js";
export { copy as copyDir, emptyDir, ensureDir, ensureFile, expandGlob, walk as walkDir } from "./deps/jsr.io/@std/fs/0.229.3/mod.js";
export { dirname as pathDirname, isAbsolute as pathIsAbsolute, join as pathJoin, relative as pathRelative, toFileUrl as pathToFileUrl } from "./deps/jsr.io/@std/path/0.225.2/mod.js";
export declare const TextToUint8Array: (input: string) => Uint8Array;
/** test if a specified path is potentially a glob pattern */
export declare const pathIsGlobPattern: (path: string) => boolean;
/** convert windows directory slash "\" to unix directory slash "/" */
export declare const pathToUnixPath: (path: string) => string;
/** resolve a file path so that it becomes absolute, with unix directory separator ("/"). */
export declare const pathResolve: (...pathSegments: string[]) => string;
export declare const resolveUri: (path: string) => string;
/** turn optional properties `P` of interface `T` into required */
export type Require<T, P extends keyof T> = Omit<T, P> & Required<Pick<T, P>>;
/** type `T` or promise of type `T` (`Promise<T>`) */
export type MaybePromise<T> = T | Promise<T>;
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
    stream: ReadableStream<T>;
}>;
/** memorize the return value of a single parameter function. further calls with memorized arguments will return the value much quicker. */
export declare const memorize: <V, K>(fn: (arg: K) => V) => (arg: K) => V;
//# sourceMappingURL=deps.d.ts.map