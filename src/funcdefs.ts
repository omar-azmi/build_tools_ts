/** this module contains common utility functions used by this package.
 * 
 * @module
*/

import type { MaybePromise, PackageJson } from "./deps.ts"
import { copyDir, detectReadableStreamType, ensureDir, ensureFile, expandGlob, memorize, pathIsGlobPattern, pathResolve, pathToUnixPath, resolveUri } from "./deps.ts"
import type { BaseBuildConfig, DenoJson, TsConfigJson, WritableFileConfig } from "./typedefs.ts"


const default_deno_json_path = "./deno.json" as const

const getDenoJson_FromUri = async (deno_json_path_uri: string) => {
	// unfortunately, dynamic imports can only be published in jsr if we enable the `--allow-dirty` flag,
	// which would then plumet this package's "no-slow-types" score to `0/5`, which I cannot accept.
	// return (await import(deno_json_path_uri, { with: { type: "json" } })).default
	return await (await fetch(deno_json_path_uri)).json()
}
const getDenoJson_FromUri_Memorized = memorize(getDenoJson_FromUri)

/** this function loads your "deno.json" file at the provided path, as a fully statically typed javascript object. <br>
 * to get the typings of your actual "deno.json" file, you will need to do some gymnastics, like in the example at the bottom.
 * 
 * @param deno_json_path the path to your "deno.json" file. it could be either an absolute path, or a path relative to your current working directory (`Deno.cwd()`).
 * @returns a fully typed "deno.json" like javascript object.
 * 
 * @example
 * ```ts
 * import { getDenoJson } from "jsr:@oazmi/build-tools/funcdefs"
 * // Deno LSP annotates json imports done via dynamic static-path imports: `import("./path/to/your/deno.json", {with: "json"})`
 * const get_my_deno_json = async () => {
 * 	return (await import("./deno.json", { with: { type: "json" } })).default
 * }
 * // `get_my_deno_json` is never actually called. it is only used for annotation of the returned `my_deno_json` javascript object, rather than it having a generalized `DenoJson` type.
 * const my_deno_json = await getDenoJson<ReturnType<typeof get_my_deno_json>>("./cwd_path/to/deno.json")
 * ```
*/
export const getDenoJson = async <DENO_JSON extends MaybePromise<DenoJson>>(deno_json_path: string = default_deno_json_path): Promise<DENO_JSON> => {
	return await getDenoJson_FromUri_Memorized(resolveUri(deno_json_path))
}

/** create a "package.json" nodejs-project file, based on your "deno.json" configuration file. <br>
 * the following required fields inside of your "deno.json" will get merged into the output:
 * - `name`, `version`
 * 
 * the following fields inside of your "deno.json" will get merged into the output:
 * - `description`, `author`, `license`, `repository`, `bugs`, and `exports`
 * 
 * the following field inside of your "deno.json" will get spread onto your output:
 * - `packageJson`
 * 
 * note that if you use [dnt (deno-to-node)](https://jsr.io/@deno/dnt), then you will have to delete the `exports` property from the output, otherwise it will ruin/overwrite `dnt`'s output.
 * 
 * @param deno_json_path the path to your "deno.json" file. it could be either an absolute path, or a path relative to your current working directory (`Deno.cwd()`).
 * @param overrides provide additional overrides to apply to your output "package.json" like object.
 * @returns a "package.json" like javascript object.
*/
export const createPackageJson = async (deno_json_path: string = default_deno_json_path, overrides: Partial<PackageJson> = {}): Promise<PackageJson> => {
	const { name, version, description, author, license, repository, bugs, exports, packageJson } = await getDenoJson(deno_json_path)
	return {
		name: name ?? "",
		version: version ?? "0.0.0",
		description, author, license, repository, bugs, exports,
		...packageJson,
		...overrides
	}
}

/** create a "tsconfig.json" file, based on your "deno.json" configuration file.
 * 
 * @param deno_json_path the path to your "deno.json" file. it could be either an absolute path, or a path relative to your current working directory (`Deno.cwd()`).
 * @param overrides provide additional overrides to apply to your output "tsconfig.json" like object.
 * @returns a "tsconfig.json" like javascript object.
*/
export const createTsConfigJson = async (deno_json_path: string = default_deno_json_path, overrides: Partial<TsConfigJson> = {}): Promise<{ "$schema": string } & TsConfigJson> => {
	const
		{ compilerOptions = {} } = await getDenoJson(deno_json_path),
		{ compilerOptions: overridden_compilerOptions, ...rest_overrides } = overrides
	// remove "deno.ns" from compiler options, as it breaks `dnt` (I think)
	compilerOptions.lib = (compilerOptions.lib ?? []).filter((v) => v.toLowerCase() !== "deno.ns")
	Object.assign(compilerOptions,
		{
			target: "ESNext",
			forceConsistentCasingInFileNames: true,
			skipLibCheck: true,
			moduleResolution: "nodenext",
		},
		overridden_compilerOptions,
	)
	return {
		"$schema": "https://json.schemastore.org/tsconfig",
		...rest_overrides,
		compilerOptions,
	} as any
}

/** trim the leading slashes at the beginning of a string. */
export const trimStartSlashes = (str: string): string => {
	return str.replace(/^\/+/, "")
}

/** trim the trailing slashes at the end of a string. */
export const trimEndSlashes = (str: string): string => {
	return str.replace(/\/+$/, "")
}

/** trim leading and trailing slashes, at the beginning and end of a string. */
export const trimSlashes = (str: string): string => {
	return trimEndSlashes(trimStartSlashes(str))
}

/** trim leading and trailing slashes, at the beginning and end of a string. */
export const trimDotSlashes = (str: string): string => {
	return trimEndSlashes(str.replace(/^(\.?\/)+/, ""))
}

/** join path segments with slashes in between. */
export const joinSlash = (...segments: string[]): string => {
	return segments
		.map(trimDotSlashes)
		.reduce((output, subpath) => (output + "/" + subpath), "")
}

/** convert potential git-repository url to a proper repository url.
 * 
 * example:
 * | input                                                 | output (URL.href)                             |
 * |-------------------------------------------------------|-----------------------------------------------|
 * | `git+https://github.com/omar-azmi/build_tools_ts.git` | `https://github.com/omar-azmi/build_tools_ts` |
 * | `https://github.com/omar-azmi/build_tools_ts.git`     | `https://github.com/omar-azmi/build_tools_ts` |
 * | `git+https://github.com/omar-azmi/build_tools_ts`     | `https://github.com/omar-azmi/build_tools_ts` |
 * | `https://github.com/omar-azmi/build_tools_ts`         | `https://github.com/omar-azmi/build_tools_ts` |
*/
export const gitRepositoryToUrl = (repo_git_url: string): URL => {
	return new URL(repo_git_url
		.replace(/^git\+/, "")
		.replace(/.git$/, "")
	)
}

/** convert potential git-repository url to a proper github pages url.
 * 
 * example:
 * | input                                                 | output (URL.href)                            |
 * |-------------------------------------------------------|----------------------------------------------|
 * | `git+https://github.com/omar-azmi/build_tools_ts.git` | `https://oamr-azmi.github.io/build_tools_ts` |
 * | `https://github.com/omar-azmi/build_tools_ts.git`     | `https://oamr-azmi.github.io/build_tools_ts` |
 * | `git+https://github.com/omar-azmi/build_tools_ts`     | `https://oamr-azmi.github.io/build_tools_ts` |
 * | `https://github.com/omar-azmi/build_tools_ts`         | `https://oamr-azmi.github.io/build_tools_ts` |
*/
export const gitRepositoryToPagesUrl = (repo_git_url: string): URL => {
	const
		repo_url = gitRepositoryToUrl(repo_git_url),
		[user_name, repo_name] = trimSlashes(repo_url.pathname).split("/")
	repo_url.hostname = `${user_name}.github.io`
	repo_url.pathname = repo_name
	return repo_url
}

const
	glob_pattern_to_regex_escape_control_chars = /[\.\+\^\$\{\}\(\)\|\[\]\\]/g,
	glob_starstar_wildcard_token = "<<<StarStarWildcard>>>"

// TODO: implement a more featureful glob pattern implementation that uses tokens and has feature switches (like turning ranges on or off, etc...). then move it to `kitchensink`
/** convert a glob string to a regex object. <br>
 * in this implementation, only the wildcards `"*"`, `"**"`, and the optional `"?"` is given meaning.
 * all else, including parenthesis, brackets, dots, and backslash, are escaped when being converted into a regex.
*/
export const globToRegex = (glob_pattern: string): RegExp => {
	const
		// first, convert windows path separator to unix path separator
		unix_pattern = pathToUnixPath(glob_pattern),
		// normalize pattern by removing leading dot-slashes ("./"), so they're treated like the "**/" glob pattern.
		normalized_pattern = trimDotSlashes(unix_pattern),
		regex_str = normalized_pattern
			// escape regex special characters, except for "*", "?", "[", "]", "{", and "}"
			.replace(glob_pattern_to_regex_escape_control_chars, "\\$&")
			// replace "**/" or "**" directory wildcard with a temporary `glob_starstar_wildcard_token`, and later we will convert to ".*"
			.replace(/\*\*\/?/g, glob_starstar_wildcard_token)
			// replace single "*" with "[^/]*" to match anything except directory separators
			.replace(/\*/g, "[^\/]*")
			// replace "?" with "." to match any single character
			.replace(/\?/g, ".")
			// convert negated glob ranges (like "[!abc]") to regex negation ("[^abc]")
			.replace(/\[!(.*)\]/g, "[^$1]")
			// support for character ranges like "[a-z]"
			.replace(/\[(.*)\]/g, "[$1]")
			// support for braces like "{js,ts}"
			.replace(/\{([^,}]+),([^}]+)\}/g, "($1|$2)")
			// put back the ".*" wildcards where they belong
			.replace(glob_starstar_wildcard_token, ".*")
	return new RegExp("^" + regex_str + "$")
}

// TODO: `copyAndCreateFiles` and `createFiles` should return an artifacts info (such as `TemporaryFiles`).
/** this function takes in your {@link BaseBuildConfig | generic config} object,
 * and figures out the files that need to be copied (specified in the {@link BaseBuildConfig.copy} field),
 * and the new text/binary files that need to be written (specified in the {@link BaseBuildConfig.text} field).
*/
export const copyAndCreateFiles = async (config: BaseBuildConfig): Promise<void> => {
	const
		{ dir, deno, copy = [], text = [], log, dryrun = false }: BaseBuildConfig = config,
		abs_deno_dir = pathResolve(deno, "../"),
		log_is_verbose = log === "verbose",
		log_is_basic = log_is_verbose || log === "basic"

	// copying other files
	if (log_is_basic) { console.log("[in-fs] copying additional files from you deno directory over to the build directory") }
	await Promise.all(copy.map(async ([src, dst]): Promise<void> => {
		const
			is_single_file = (
				src.endsWith("/")
				|| dst.endsWith("/")
				|| pathIsGlobPattern(src)
			) ? false : true,
			abs_src = pathResolve(abs_deno_dir, src),
			abs_dst = pathResolve(dir, dst)
		if (is_single_file) {
			if (log_is_verbose) { console.log("[in-fs] copying a file", `from: "${abs_src}"`, `to: "${abs_dst}"`) }
			if (!dryrun) { await Deno.copyFile(abs_src, abs_dst) }
		}
		else {
			console.assert(abs_dst.endsWith("/"), `
provided destination folder ("${abs_dst}") path does not end with a trailing slash ("/").
folder paths MUST end with a slash, and folders and glob-patterns can only be copied over to another folder.
`)
			if (!dryrun) { await ensureDir(abs_dst) }
			for await (const src_dir_entry of expandGlob(src, { root: abs_deno_dir })) {
				const
					abs_src = src_dir_entry.path,
					is_file = src_dir_entry.isFile,
					is_folder = src_dir_entry.isDirectory,
					basename = src_dir_entry.name,
					abs_dst = is_folder
						? pathResolve(dir, dst)
						: pathResolve(dir, dst, basename)
				if (is_file && !dryrun) { await ensureFile(abs_dst) }
				if (is_folder && !dryrun) { await ensureDir(abs_dst) }
				// TODO: how should I handle system links? (i.e. if `isSymlink` was true)
				if (log_is_verbose) { console.log("[in-fs] copying", `from: "${abs_src}"`, `to: "${abs_dst}"`) }
				if (!dryrun) { await copyDir(abs_src, abs_dst, { overwrite: true }) }
			}
		}
	}))

	// writing text or binary files
	await createFiles(text, { dir, log, dryrun })
}

/** configuration options for {@link createFiles}.
 * there are only three configurable fields available: {@link dir}, {@link log}, and {@link dryrun}
*/
export interface CreateFilesConfig extends Pick<BaseBuildConfig, "dir" | "log" | "dryrun"> {
	[key: string]: any
}

/** write a collection of virtual files to your filesystem.
 * this function accepts virtual files that are either in text (`string`), binary (`Uint8Array`), or streamable text/binary (`ReadableStream<string | Uint8Array>`) formats.
 * it is important that you provide the configuration parameter's {@link config["dir"] | `dir`} field, so that relative paths can be resolved according to the provided directory.
*/
export const createFiles = async (input_files: Array<WritableFileConfig>, config: CreateFilesConfig): Promise<void> => {
	const
		{ dir = "./", log = "basic", dryrun = false }: CreateFilesConfig = config,
		log_is_verbose = log === "verbose",
		log_is_basic = log_is_verbose || log === "basic"

	// writing text or binary files
	if (log_is_basic) { console.log("[in-fs] writing additional text/binary files to your build directory") }
	for (let [dst_path, content, options] of input_files) {
		const
			abs_dst = pathResolve(dir, dst_path),
			data_is_stream = (content as ReadableStream<any>).getReader ? true : false
		let is_text = typeof content === "string" ? true : false
		if (data_is_stream) {
			const { kind, stream } = (await detectReadableStreamType(content as ReadableStream<string | Uint8Array>))
			// the `detectReadableStreamType` function consumes the original stream, and so we must replace our stream with a returned untouched cloned-stream
			content = stream as (ReadableStream<string> | ReadableStream<Uint8Array>)
			is_text = kind === "string"
		}
		if (is_text) {
			if (log_is_verbose) { console.log("[in-fs] writing text", `to: "${abs_dst}"`, "with the configuration:", options) }
			if (!dryrun) {
				await ensureFile(abs_dst)
				await Deno.writeTextFile(abs_dst, content as string | ReadableStream<string>, options)
			}
		} else {
			if (log_is_verbose) { console.log("[in-fs] writing binary", `to: "${abs_dst}"`, "with the configuration:", options) }
			if (!dryrun) {
				await ensureFile(abs_dst)
				await Deno.writeFile(abs_dst, content as Uint8Array | ReadableStream<Uint8Array>, options)
			}
		}
	}
}
