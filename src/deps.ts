import {
	resolve as _pathResolve,
	isAbsolute as pathIsAbsolute,
	toFileUrl as pathToFileUrl
} from "jsr:@std/path@0.225.2"


export type {
	BuildOptions as DntBuildOptions,
	PackageJson
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

// TODO: unify logging, by implementing a function that takes in what you wish to log, and then logs conditionally based on your gloal logging level setting.
// TODO: also maybe unify writing text files and copying files in the same way (controlled by a global dryrun option)

const text_encoder = new TextEncoder()

export const TextToUint8Array = (input: string) => text_encoder.encode(input)

const glob_pattern_regex = new RegExp("[*?]")

/** test if a specified path is potentially a glob pattern */
export const pathIsGlobPattern = (path: string) => glob_pattern_regex.test(path)

/** convert windows directory slash "\" to unix directory slash "/" */
export const pathToUnixPath = (path: string) => path.replaceAll(/\\+/g, "/")

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

/** type `T` or promise of type `T` (`Promise<T>`) */
export type MaybePromise<T> = T | Promise<T>


// TODO: maybe add the `detectReadableStreamType` function to kitchensink
type ReadableStreamKind<T> = T extends string
	? "string"
	: "uint8array"

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
export const detectReadableStreamType = async <
	T extends string | Uint8Array,
	K extends ReadableStreamKind<T>,
>(stream: ReadableStream<T>): Promise<{ kind: K, stream: typeof stream }> => {
	const
		[clone1, clone2] = stream.tee(),
		content = await clone1.getReader().read(),
		content_type: K = typeof content.value === "string"
			? "string" as K
			: "uint8array" as K
	clone1.cancel()
	stream.cancel()
	return {
		kind: content_type,
		stream: clone2,
	}
}

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

