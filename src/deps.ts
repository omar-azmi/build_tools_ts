import {
	getRuntimeCwd,
	identifyCurrentRuntime
} from "jsr:@oazmi/kitchensink@0.9.8/crossenv"
import {
	resolveAsUrl as _resolveAsUrl,
	ensureEndSlash,
	pathToPosixPath,
	resolvePathFactory
} from "jsr:@oazmi/kitchensink@0.9.8/pathman"

export type {
	BuildOptions as DntBuildOptions,
	PackageJson
} from "jsr:@deno/dnt@0.41.3"
export {
	console_log,
	console_warn,
	object_assign,
	object_entries,
	object_keys,
	object_values
} from "jsr:@oazmi/kitchensink@0.9.8/alias"
export {
	detectReadableStreamType
} from "jsr:@oazmi/kitchensink@0.9.8/browser"
export {
	decode_str as decodeText,
	encode_str as encodeText
} from "jsr:@oazmi/kitchensink@0.9.8/eightpack"
export {
	memorize
} from "jsr:@oazmi/kitchensink@0.9.8/lambda"
export {
	ensureEndSlash,
	ensureStartDotSlash,
	isAbsolutePath,
	joinPaths,
	parseFilepathInfo,
	relativePath,
	trimSlashes
} from "jsr:@oazmi/kitchensink@0.9.8/pathman"
export {
	isArray,
	isObject
} from "jsr:@oazmi/kitchensink@0.9.8/struct"
export {
	defaultStopwatch
} from "jsr:@oazmi/kitchensink@0.9.8/timeman"
export type {
	MaybePromise,
	Require
} from "jsr:@oazmi/kitchensink@0.9.8/typedefs"
export {
	copy as copyDir,
	emptyDir,
	ensureDir,
	ensureFile,
	expandGlob
} from "jsr:@std/fs@1.0.13"
export {
	globToRegExp,
	isGlob as pathIsGlobPattern
} from "jsr:@std/path@1.0.8"

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
