import {
	getRuntimeCwd,
	identifyCurrentRuntime
} from "./deps/jsr.io/@oazmi/kitchensink/0.9.10/src/crossenv.js"
import {
	resolveAsUrl as _resolveAsUrl,
	ensureEndSlash,
	pathToPosixPath,
	resolvePathFactory
} from "./deps/jsr.io/@oazmi/kitchensink/0.9.10/src/pathman.js"

export type {
	BuildOptions as DntBuildOptions,
	PackageJson
} from "./deps/jsr.io/@deno/dnt/0.41.3/mod.js"
export {
	console_log,
	console_warn,
	object_assign,
	object_entries,
	object_keys,
	object_values
} from "./deps/jsr.io/@oazmi/kitchensink/0.9.10/src/alias.js"
export {
	detectReadableStreamType
} from "./deps/jsr.io/@oazmi/kitchensink/0.9.10/src/browser.js"
export {
	decode_str as decodeText,
	encode_str as encodeText
} from "./deps/jsr.io/@oazmi/kitchensink/0.9.10/src/eightpack.js"
export {
	memorize
} from "./deps/jsr.io/@oazmi/kitchensink/0.9.10/src/lambda.js"
export {
	ensureEndSlash,
	ensureStartDotSlash,
	ensureStartSlash,
	isAbsolutePath,
	joinPaths,
	parseFilepathInfo,
	relativePath,
	trimSlashes
} from "./deps/jsr.io/@oazmi/kitchensink/0.9.10/src/pathman.js"
export {
	isArray,
	isObject
} from "./deps/jsr.io/@oazmi/kitchensink/0.9.10/src/struct.js"
export {
	defaultStopwatch
} from "./deps/jsr.io/@oazmi/kitchensink/0.9.10/src/timeman.js"
export type {
	MaybePromise,
	Require
} from "./deps/jsr.io/@oazmi/kitchensink/0.9.10/src/typedefs.js"
export {
	copy as copyDir,
	emptyDir,
	ensureDir,
	ensureFile,
	expandGlob
} from "./deps/jsr.io/@std/fs/1.0.13/mod.js"
export {
	globToRegExp,
	isGlob as pathIsGlobPattern
} from "./deps/jsr.io/@std/path/1.0.8/mod.js"

// DONE: unify logging, by implementing a function that takes in what you wish to log, and then logs conditionally based on your gloal logging level setting.
// TODO: also maybe unify writing text files and copying files in the same way (controlled by a global dryrun option)
// TODO: develop a more robust esbuild resolver and loader plugin for deno specific specifiers (such as `npm:` and `jsr:`), that does not interrupt other npm-based esbuild plugins.
// DONE: use `globToRegExp` and `isGlob` from "jsr:@std/path" instead of your wonky implementations.
// TODO: in version `0.3.0` of this library, add a new "directory-server" tool, and accompany it with a cli. 

const cwd = /*@__PURE__*/ ensureEndSlash(pathToPosixPath(getRuntimeCwd(identifyCurrentRuntime())))

/** get the current working directory (`Deno.cwd`) in posix path format. */
export const getCwdPath = () => { return cwd }

/** resolve a file path so that it becomes absolute, with unix directory separator ("/").
 * TODO: refactor the name `pathResolve` to `resolvePath`
*/
export const pathResolve = resolvePathFactory(getCwdPath)

/** resolve a `path` (with an optional `base` path) as a `URL` object.
 * if a relative `path` is provided, and no `base` path is given, then it will be assumed that the `base` path is the current working directory (`Deno.cwd()`).
*/
export const resolveAsUrl = (path: string | URL, base?: string | URL): URL => {
	return _resolveAsUrl(path, base ?? getCwdPath())
}
