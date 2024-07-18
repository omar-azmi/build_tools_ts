export type {
	PackageJson,
	BuildOptions as dntBuildOptions
} from "jsr:@deno/dnt@0.41.2"
export {
	copy as copyDir,
	emptyDir,
	ensureDir,
	ensureFile,
	expandGlob,
	walk as walkDir
} from "jsr:@std/fs@0.229.3"
export {
	dirname as pathDirname,
	isAbsolute as pathIsAbsolute,
	join as pathJoin,
	relative as pathRelative,
	toFileUrl as pathToFileUrl
} from "jsr:@std/path@0.225.2"


import {
	resolve as _pathResolve,
	isAbsolute as pathIsAbsolute,
	toFileUrl as pathToFileUrl
} from "jsr:@std/path@0.225.2"


const glob_pattern_regex = new RegExp("[*?]")

/** test if a specified path is potentially a glob pattern */
export const pathIsGlobPattern = (path: string) => glob_pattern_regex.test(path)

/** convert windows directory slash "\" to unix directory slash "/" */
const pathToUnixPath = (path: string) => path.replaceAll(/\\+/g, "/")

/** resolve a file path so that it becomes absolute, with unix directory separator ("/"). */
export const pathResolve = (...pathSegments: string[]) => {
	const is_folder = pathSegments.at(-1)?.endsWith("/") ? true : false
	return pathToUnixPath(_pathResolve(...pathSegments)) + (is_folder ? "/" : "")
}

const
	uri_prefixes = ["http://", "https://", "file://", "blob://", "data://"],
	path_has_uri_prefix = (path: string): boolean => {
		for (const prefix of uri_prefixes) {
			if (path.startsWith(prefix)) { return true }
		}
		return false
	}
export const resolveUri = (path: string) => {
	const path_url = path_has_uri_prefix(path)
		? new URL(path)
		: pathToFileUrl(
			pathIsAbsolute(path)
				? pathResolve(path)
				: pathResolve(Deno.cwd(), path)
		)
	return path_url.href
}

/** turn optional properties `P` of interface `T` into required */
export type Require<T, P extends keyof T> = Omit<T, P> & Required<Pick<T, P>>

export type MaybePromise<T> = T | Promise<T>

// memorization code is copied from from "jsr:@oazmi/kitchensink@0.7.5/lambda" and then modified.
interface MemorizeCoreControls<V, K> {
	fn: (arg: K) => V
	memory: Map<K, V>
}

const memorizeCore = <V, K>(fn: (arg: K) => V): MemorizeCoreControls<V, K> => {
	const
		memory = new Map<K, V>(),
		memorized_fn: typeof fn = (arg: K): V => {
			const
				arg_exists = memory.has(arg),
				value = arg_exists ? memory.get(arg)! : fn(arg)
			if (!arg_exists) { memory.set(arg, value) }
			return value
		}
	return { fn: memorized_fn, memory }
}

/** memorize the return value of a single parameter function. further calls with memorized arguments will return the value much quicker. */
export const memorize = <V, K>(fn: (arg: K) => V): (typeof fn) => {
	return memorizeCore(fn).fn
}

