import {
	getRuntimeCwd,
	identifyCurrentRuntime
} from "@oazmi/kitchensink/crossenv"
import {
	resolveAsUrl as _resolveAsUrl,
	ensureEndSlash,
	pathToPosixPath,
	resolvePathFactory
} from "@oazmi/kitchensink/pathman"

export type {
	BuildOptions as DntBuildOptions,
	PackageJson
} from "@deno/dnt"
export {
	console_log,
	console_warn,
	object_assign,
	object_entries,
	object_keys,
	object_values
} from "@oazmi/kitchensink/alias"
export {
	detectReadableStreamType
} from "@oazmi/kitchensink/browser"
export {
	decode_str as decodeText,
	encode_str as encodeText
} from "@oazmi/kitchensink/eightpack"
export {
	memorize
} from "@oazmi/kitchensink/lambda"
export {
	ensureEndSlash,
	ensureStartDotSlash,
	ensureStartSlash,
	isAbsolutePath,
	joinPaths,
	parseFilepathInfo,
	relativePath,
	trimSlashes
} from "@oazmi/kitchensink/pathman"
export {
	isArray,
	isObject
} from "@oazmi/kitchensink/struct"
export {
	defaultStopwatch
} from "@oazmi/kitchensink/timeman"
export type {
	MaybePromise,
	Require
} from "@oazmi/kitchensink/typedefs"
export {
	copy as copyDir,
	emptyDir,
	ensureDir,
	ensureFile,
	expandGlob
} from "@std/fs"
export {
	globToRegExp,
	isGlob as pathIsGlobPattern
} from "@std/path"

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
