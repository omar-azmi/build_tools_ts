/** this module contains common utility functions used by this package.
 * 
 * @module
*/

import type { MaybePromise, PackageJson } from "./deps.ts"
import { copyDir, detectReadableStreamType, ensureDir, ensureFile, expandGlob, isArray, isObject, memorize, object_assign, object_keys, pathIsGlobPattern, pathResolve, resolveAsUrl, trimSlashes } from "./deps.ts"
import { logBasic, logVerbose, setLog } from "./logger.ts"
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
export const getDenoJson = async <DENO_JSON extends MaybePromise<DenoJson>>(deno_json_path: string | URL = default_deno_json_path): Promise<DENO_JSON> => {
	return await getDenoJson_FromUri_Memorized(resolveAsUrl(deno_json_path).href)
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
 * @param merge_defaults provide default "package.json" fields to merge with the acquired `packageJson` object from "deno.json", at a depth of `1` for records.
 * @returns a "package.json" like javascript object.
*/
export const createPackageJson = async (deno_json_path: string = default_deno_json_path, merge_defaults: Partial<PackageJson> = {}): Promise<PackageJson> => {
	const
		{ name = "", version = "0.0.0", type: moduleType = "module", description, author, license, repository, bugs, exports, packageJson = {} } = await getDenoJson(deno_json_path),
		merged_package_json: Partial<PackageJson> = {}
	for (const key of new Set([...object_keys(merge_defaults), ...object_keys(packageJson)])) {
		// merging all record objects, at a depth of 1
		const
			default_value = merge_defaults[key],
			current_value = packageJson[key],
			default_is_dict = isObject(default_value) && !isArray(default_value),
			current_is_dict = isObject(current_value) && !isArray(current_value),
			current_is_undefined = current_value === undefined
		merged_package_json[key] = current_is_undefined
			? default_value : (current_is_dict && default_is_dict)
				? { ...default_value, ...current_value }
				: current_value
	}
	return {
		name, version, type: moduleType, description,
		author, license, repository, bugs, exports,
		...merged_package_json,
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
	// remove all "deno" namespace libraries (such as "deno.ns", "deno.unstable", etc...).ns" from compiler options, as they break `dnt`.
	compilerOptions.lib = (compilerOptions.lib ?? []).filter((v) => !v.toLowerCase().startsWith("deno."))
	object_assign(compilerOptions,
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

// TODO: PURGE your `globToRegex` function, or consider implementing a more full featured one in `kitchensink`.
//       for now, I will be using `globToRegExp` from `"jsr:@std/path"` instead.

// TODO: implement a more featureful glob pattern implementation that uses tokens and has feature switches (like turning ranges on or off, etc...). then move it to `kitchensink`
// DONE: guess what? don't reinvent the wheel. a good implementation already exists in `import { globToRegExp } from "jsr:@std/path"`

// TODO: `copyAndCreateFiles` and `createFiles` should return an artifacts info (such as `TemporaryFiles`).
/** this function takes in your {@link BaseBuildConfig | generic config} object,
 * and figures out the files that need to be copied (specified in the {@link BaseBuildConfig.copy} field),
 * and the new text/binary files that need to be written (specified in the {@link BaseBuildConfig.text} field).
*/
export const copyAndCreateFiles = async (config: BaseBuildConfig): Promise<void> => {
	setLog(config)
	const
		{ dir, deno, copy = [], text = [], log, dryrun = false }: BaseBuildConfig = config,
		abs_deno_dir = pathResolve(deno, "./")

	// copying other files
	logBasic("[in-fs] copying additional files from you deno directory over to the build directory")
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
			logVerbose("[in-fs] copying a file", `from: "${abs_src}"`, `to: "${abs_dst}"`)
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
				logVerbose("[in-fs] copying", `from: "${abs_src}"`, `to: "${abs_dst}"`)
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
	setLog(config)
	const { dir = "./", dryrun = false }: CreateFilesConfig = config

	// writing text or binary files
	logBasic("[in-fs] writing additional text/binary files to your build directory")
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
			logVerbose("[in-fs] writing text", `to: "${abs_dst}"`, "with the configuration:", options)
			if (!dryrun) {
				await ensureFile(abs_dst)
				await Deno.writeTextFile(abs_dst, content as string | ReadableStream<string>, options)
			}
		} else {
			logVerbose("[in-fs] writing binary", `to: "${abs_dst}"`, "with the configuration:", options)
			if (!dryrun) {
				await ensureFile(abs_dst)
				await Deno.writeFile(abs_dst, content as Uint8Array | ReadableStream<Uint8Array>, options)
			}
		}
	}
}
