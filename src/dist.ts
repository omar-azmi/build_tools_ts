/** create distribution file(s) for your deno project.
 * 
 * the {@link buildDist} function in this module provides a convenient way for you to bundle your deno-project using [`esbuild`](https://github.com/evanw/esbuild).
 * 
 * for more advanced bundling, use the {@link bundle} function, then proceed with additional transformations via the {@link transform} function,
 * and then finally write the output to your filesystem via the {@link createFiles} utility function.
 * @example
 * ```ts
 * import { bundle, transform, esStop } from "jsr:@oazmi/build-tools/dist"
 * import { createFiles } from "jsr:@oazmi/build-tools/funcdefs"
 * 
 * const bundled_files = await bundle({
 * 	deno: "./deno.json",
 * 	dir: "./dist/",
 * 	log: "verbose",
 * 	esbuild: { splitting: true }
 * })
 * const minified_files = await transform(bundled_files, [{}], "verbose")
 * await createFiles(minified_files, {
 * 	dir: "./dist/", // this information is not really needed, as the file paths in `minified_files` are absolute.
 * 	dryrun: false,
 * 	log: "verbose",
 * })
 * 
 * // it is important that you stop esbuild manually, otherwise the deno process will not quit automatically.
 * await esStop()
 * ```
 * 
 * @module
*/

import {
	build as esBuild,
	stop as esStop,
	transform as esTransform,
	type BuildOptions as EsBuildOptions,
	type TransformOptions as EsTransformOptions,
} from "http://deno.land/x/esbuild@v0.23.0/mod.js"
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@0.10.3"
import { emptyDir, pathResolve, TextToUint8Array, type MaybePromise } from "./deps.ts"
import { copyAndCreateFiles, getDenoJson, globToRegex, type createFiles } from "./funcdefs.ts"
import type { BaseBuildConfig, DenoJson, ExportsWithMain, TemporaryFiles, WritableFileConfig } from "./typedefs.ts"


export {
	build as esBuild,
	stop as esStop,
	transform as esTransform,
	type BuildOptions as EsBuildOptions,
	type OutputFile as EsOutputFile,
	type TransformOptions as EsTransformOptions
} from "http://deno.land/x/esbuild@v0.23.0/mod.js"
export { denoPlugins } from "jsr:@luca/esbuild-deno-loader@0.10.3"

/** the configuration for in-memory bundling of your typescript code to javascript text, using the transformation function {@link bundle}. */
export interface BundleConfig extends BaseBuildConfig {
	copy?: never
	text?: never
	dryrun?: never

	/** the *virtual* path to the folder where you wish to create your distribution release.
	 * if a relative path is provided, then it will be resolved as a path relative to Deno's current working directory. (which is generally where `deno.json` resides.)
	 * the directory provided here will serve as esbuild configuration's {@link esbuild["outdir"] | `outdir` option}.
	 * 
	 * @defaultValue `"./dist/"`
	*/
	dir: string

	/** [`esbuild`](https://deno.land/x/esbuild) related additional build options for you to configure. <br>
	 * note that `outdir` and `outfile` options are made unavailable, since they are controlled by your {@link dir} value. <br>
	 * in addition, esbuild `plugins` must be configured via {@link plugins}.
	 * 
	 * > [!TIP]
	 * > if you wish to declare a set of bundling `entryPoints` that are different from your {@link deno | `deno.json`} file's `exports` field,
	 * > simply modify the {@link EsBuildOptions.entryPoints} option in this field.
	*/
	esbuild?: Omit<Partial<EsBuildOptions>, "outdir" | "outfile" | "plugins" | "write">

	/** apply a collection of optional [`esbuild`](https://deno.land/x/esbuild) plugins.
	 * 
	 * @defaultValue {@link denoPlugins} (via [esbuild-deno-loader](jsr:@luca/esbuild-deno-loader@0.10.3))
	*/
	plugins?: EsBuildOptions["plugins"]

	/** stop running esbuild's wasm-service after compilation?
	 * booting up wasm takes a little while, so you'll want to turn this option to `false` if you are calling the {@link buildDist} function multiple times for multiple compilations.
	 * on the other hand, it is good to stop the service on your very last compilation-run, as keeping the service alive results in prolonging the time it takes for deno to exit it process.
	 * (at least this is how it was in the earlier releases of esbuild, but I do recall seeing a PR that supposedly addressed this issue)
	 * 
	 * @defaultValue `false`
	*/
	stop?: boolean
}

/** the configuration for the distribution-building function {@link buildDist}. */
export interface BuildDistConfig extends BaseBuildConfig {
	/** the path to the folder where you wish to create your distribution release.
	 * if a relative path is provided, then it will be resolved as a path relative to Deno's current working directory. (which is generally where `deno.json` resides.)
	 * the directory provided here will serve as esbuild configuration's {@link esbuild["outdir"] | `outdir` option}.
	 * 
	 * @defaultValue `"./dist/"`
	*/
	dir: string

	/** [`esbuild`](https://deno.land/x/esbuild) related additional build options for you to configure. <br>
	 * note that `outdir` and `outfile` options are made unavailable, since they get controlled by the {@link dir} value.
	 * in addition, esbuild `plugins` must be configured via {@link plugins}.
	 * 
	 * @defaultValue {@link denoPlugins} (via [esbuild-deno-loader](jsr:@luca/esbuild-deno-loader@0.10.3))
	*/
	esbuild?: Omit<Partial<EsBuildOptions>, "outdir" | "outfile" | "plugins">

	/** apply a collection of optional [`esbuild`](https://deno.land/x/esbuild) plugins.
	 * 
	 * @defaultValue {@link denoPlugins} (via [esbuild-deno-loader](jsr:@luca/esbuild-deno-loader@0.10.3))
	*/
	plugins?: EsBuildOptions["plugins"]

	/** stop running esbuild's wasm-service after compilation?
	 * booting up wasm takes a little while, so you'll want to turn this option to `false` if you are calling the {@link buildDist} function multiple times for multiple compilations.
	 * on the other hand, it is good to stop the service on your very last compilation-run, as keeping the service alive results in prolonging the time it takes for deno to exit it process.
	 * (at least this is how it was in the earlier releases of esbuild, but I do recall seeing a PR that supposedly addressed this issue)
	 * 
	 * @defaultValue `false`
	*/
	stop?: boolean
}

/** a single configuration for the re-transformation function {@link transform}. */
export interface TransformationConfig {
	/** specify the output file-path capturing pattern for applying this transformation onto.
	 * you have the ability to use a glob-string, or a regular expression (`RegExp`), or a function that returns `true` when the input file name is accepted.
	 * if no pattern is provided, then all of your input im-memory files will be processed through this transformation.
	 * 
	 * @defaultValue `undefined`
	*/
	pattern?:
	| undefined
	| string
	| RegExp
	| PathPatternMatchingFn

	/** the `esbuild` loader to use for transforming the captured file's contents.
	 * if nothing is provided, then it defaults to javascript (`"js"`).
	 * 
	 * @defaultValue `"js"`
	*/
	loader?: EsTransformOptions["loader"]

	/** specify additional `esbuild` transformer api options to configure. */
	options?: Omit<EsTransformOptions, "loader">
}

/** a function, used by {@link TransformationConfig}, for testing if a certain file by the given `file_path` name should be transformed or not.
 * - if the function returns a `false`, then the file shall not be transformed.
 * - if the function returns a `true`, then the file will be transformed, and its name will remain the same as before (unchanged).
 * - if the function returns a `string`, then the file will be transformed, and it will be renamed to the output `string` of the function.
*/
export type PathPatternMatchingFn = (file_path: string) => boolean | string

/** a virtual file is described as a tuple of its location/destination path name and its file contents as a `Uint8Array` binary. */
export type VirtualFileOutput = [destination: string, content: Uint8Array]

/** the {@link bundle} function's returned value is an array of virtual in-memory files. */
export type BundleOutput = Array<VirtualFileOutput>

const defaultBundleConfig: BundleConfig = {
	dir: "./dist/",
	deno: "./deno.json",
	plugins: [...denoPlugins()],
}

const defaultBuildDistConfig: BuildDistConfig = {
	dir: "./dist/",
	deno: "./deno.json",
	plugins: [...denoPlugins()],
}

const defaultTransformationConfig: Required<TransformationConfig> = {
	pattern: "**/*.js",
	loader: "js",
	options: {
		minify: true,
		platform: "browser",
		format: "esm",
		target: "esnext",
	}
}

/** this function bundles your deno-project's {@link DenoJson.exports | exports} in-memory, using the blazing fast [`esbuild`](https://github.com/evanw/esbuild) bundler,
 * along with the useful [`esbuild-deno-loader`](https://jsr.io/@luca/esbuild-deno-loader) default plugin. <br>
 * the output of this function is an array of {@link WritableFileConfig}, consisting of the destination path and the content of the bundled javascript/css code (as a binary `Uint8Array`).
 * 
 * by default, this function reads your "deno.json" file's {@link DenoJson.exports | exports field},
 * but you can manually modify the `entryPoints` by specifying them in the {@link bundle_config | configuration's} `esbuild.entryPoints` field. <br>
 * take a look at {@link BundleConfig} to see what configuration options are available. <br>
*/
export const bundle = async (bundle_config: Partial<BundleConfig> = {}): Promise<BundleOutput> => {
	const
		{ dir, deno, esbuild = {}, plugins, stop = false, log }: BundleConfig = { ...defaultBundleConfig, ...bundle_config },
		abs_dir = pathResolve(dir),
		abs_deno = pathResolve(deno),
		log_is_verbose = log === "verbose",
		log_is_basic = log_is_verbose || log === "basic",
		{ exports = {} } = await getDenoJson(deno),
		entryPoints = typeof exports === "string" ? [exports] : Object.values(exports as ExportsWithMain)
	let delta_time = performance.now()
	if (log_is_verbose) { console.log("bundling the following entry-points:", entryPoints) }
	const bundled_code = await esBuild({
		entryPoints,
		outdir: abs_dir,
		bundle: true,
		minifySyntax: true,
		platform: "neutral",
		format: "esm",
		target: "esnext",
		plugins,
		...esbuild,
		write: false,
	})
	delta_time = performance.now() - delta_time
	if (log_is_basic) { console.log("bundling time:", delta_time, "ms") }
	if (stop) { await esStop() }
	return bundled_code.outputFiles.map(({ path, contents }) => {
		return [path, contents]
	})
}

/** this function bundles your deno-project's {@link DenoJson.exports | exports} and outputs to your configuration's {@link build_config["dir"] | `dir`} directory on your filesystem.
 * under the hood, it uses the blazing fast [`esbuild`](https://github.com/evanw/esbuild) tool for bundling and for its native filesystem writing capabilities.
 * 
 * by default, this function reads your "deno.json" file's {@link DenoJson.exports | exports field},
 * but you can manually modify the `entryPoints` by specifying them in the {@link bundle_config | configuration's} `esbuild.entryPoints` field. <br>
 * take a look at {@link BuildDistConfig} to see what configuration options are available. <br>
*/
export const buildDist = async (build_config: Partial<BuildDistConfig>): Promise<TemporaryFiles> => {
	const
		{ dir, deno, esbuild = {}, plugins, stop = true, copy = [], text = [], log, dryrun = false }: BuildDistConfig = { ...defaultBuildDistConfig, ...build_config },
		abs_dir = pathResolve(dir),
		abs_deno = pathResolve(deno),
		log_is_verbose = log === "verbose",
		log_is_basic = log_is_verbose || log === "basic",
		{ exports } = await getDenoJson(deno),
		entryPoints = typeof exports === "string" ? [exports] : Object.values(exports)
	let delta_time = performance.now()
	if (log_is_verbose) { console.log("bundling the following entry-points:", entryPoints) }
	const bundled_code = await esBuild({
		entryPoints,
		outdir: abs_dir,
		bundle: true,
		minifySyntax: true,
		platform: "neutral",
		format: "esm",
		target: "esnext",
		plugins,
		...esbuild,
		write: dryrun,
	})
	delta_time = performance.now() - delta_time
	if (log_is_basic) { console.log("bundling time:", delta_time, "ms") }
	if (stop) { await esStop() }
	await copyAndCreateFiles({ dir, deno, copy, text, log, dryrun })
	return {
		dir: abs_dir,
		files: [],
		cleanup: async () => {
			if (log_is_basic) { console.log("[in-fs] deleting your distribution-build directory:", abs_dir) }
			if (dryrun) { return }
			await emptyDir(abs_dir)
			await Deno.remove(abs_dir)
		}
	}
}

const parsePathPatternMatching = (pattern: TransformationConfig["pattern"]): PathPatternMatchingFn => {
	switch (typeof pattern) {
		case "function": { return pattern }
		case "undefined": { return (() => true) }
		case "object": { return (file_path: string) => pattern.test(file_path) }
		case "string": {
			const regex = globToRegex(pattern)
			return ((file_path: string) => regex.test(file_path))
		}
	}
}

/** apply additional transformations onto your {@link BundleOutput | virtual files}.
 * this is especially useful when you wish to further minify a bundled javascript output (double minification).
*/
export const transform = async (
	input_files: MaybePromise<BundleOutput>,
	transformation_configs: Array<TransformationConfig>,
	log: BaseBuildConfig["log"] = "basic",
): Promise<BundleOutput> => {
	input_files = await input_files
	const
		log_is_verbose = log === "verbose",
		log_is_basic = log_is_verbose || log === "basic",
		transformations = transformation_configs.map((config) => {
			const
				{ loader, options, pattern } = { ...defaultTransformationConfig, ...config },
				pattern_fn = parsePathPatternMatching(pattern)
			return {
				test: pattern_fn,
				options: { ...options, loader } as EsTransformOptions
			}
		})
	let delta_time = performance.now()

	const transformed_files = await Promise.all(input_files.map(
		async ([path, content], file_number): Promise<VirtualFileOutput> => {
			for (const { test, options } of transformations) {
				const new_file_name = test(path)
				if (new_file_name) {
					const
						results = await esTransform(content, options),
						new_content = TextToUint8Array(results.code),
						new_path = typeof new_file_name === "string" ? new_file_name : path
					if (log_is_verbose) {
						console.log(
							`- transformed file: ${file_number}`,
							"\n\t", `change in output path: "${path}" -> "${new_path}"`,
							"\n\t", `change in binary size: "${content.byteLength / 1024} kb" -> "${new_content.byteLength / 1024} kb"`,
						)
					}
					content = new_content
					path = new_path
				}
			}
			return [path, content]
		}
	))
	delta_time = performance.now() - delta_time
	if (log_is_basic) { console.log("transformation time:", delta_time, "ms") }
	return transformed_files
}
