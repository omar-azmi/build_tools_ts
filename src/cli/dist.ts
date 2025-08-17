/** this is a cli tool for generating distribution files for your deno project, using [`esbuild`](https://github.com/evanw/esbuild) + [@oazmi/esbuild-plugin-deno](https://jsr.io/@oazmi/esbuild-plugin-deno). <br>
 * to provide input file(s), list them as `--input="./path/to/file.ts"` (or `-i="./path/to/file.ts"` for shorthand), and do it for each input file that you have.
 * the paths that you provide must be relative to your configured "deno.json" file (which is also usually your working dir). <br>
 * if no input is provided, this tool reads your "deno.json" file to figure out the entry-points of your library (specified in the {@link DenoJson.exports | exports field}), and then runs esbuild to get your javascript distribution files ready.
 * 
 * this tool comes with a handful of useful preset configurations, so that you won't have to write lengthy cli args. <br>
 * take a look at {@link CliArgs} and {@link CliConfigJson} to see what configuration options are available. <br>
 * moreover, to use this document generator via javascript instead of the shell, use the {@link buildDistFn | buildDist} function from the [`dist.ts` file](../dist.ts) (or [`jsr:@oazmi/build-tools/dist`](https://jsr.io/@oazmi/build-tools) if using jsr).
 * 
 * @example
 * ```shell
 * # bundle the three files "./src/mod.ts", "./src/plugins/hello.ts", and "./src/plugins/world.ts" in the "./dist/" folder, with code-splitting and minification enabled.
 * deno run -A "jsr:@oazmi/build-tools/cli/dist" --dir="./dist/" --passes=2 --log="basic" --minify --split --input="./src/mod.ts" -i="./src/plugins/hello.ts" -i="./src/plugins/world.ts"
 * ```
 * 
 * @example
 * ```shell
 * # do a mock-run (dryrun) of the bundling process of your "deno.json" exports in the "./dist/" folder, with code-splitting and minification enabled.
 * deno run -A "jsr:@oazmi/build-tools/cli/dist" --dir="./dist/" --passes=2 --log="verbose" --minify --split --dryrun
 * ```
 * 
 * @module
*/
import * as dntShim from "../_dnt.shims.js";


import { isAbsolutePath, pathResolve, relativePath } from "../deps.js"
import {
	buildDist as buildDistFn,
	bundle as bundleFn,
	esStop,
	transform as transformFn,
	type BuildDistConfig,
	type EsBuildOptions,
	type TransformationConfig,
	type VirtualFileOutput,
} from "../dist.js"
import { copyAndCreateFiles, createFiles } from "../funcdefs.js"
import { setLog } from "../logger.js"
import type { DenoJson, TemporaryFiles } from "../typedefs.js"
import { parseArgs } from "./deps.js"


/** the cli args for generating the documentation of your deno project to via the {@link buildDistFn | buildDist} function. */
export interface CliArgs {
	/** {@inheritDoc dist!BuildDistConfig.dir} */
	dir?: BuildDistConfig["dir"]

	/** {@inheritDoc dist!BuildDistConfig.deno} */
	deno?: BuildDistConfig["deno"]

	/** {@inheritDoc dist!BuildDistConfig.log} */
	log?: BuildDistConfig["log"]

	/** {@inheritDoc dist!BuildDistConfig.dryrun} */
	dryrun?: BuildDistConfig["dryrun"]

	/** specify the number of compilation passes to perform:
	 * - `"1"` implies a single-pass compilation, and only uses the {@link buildDistFn | buildDist} function under the hood.
	 * - `"2"` implies a double-pass compilation, which consists of two compilations, and is performed in the following set of steps:
	 *   1) your source files are first bundled in-memory via the {@link bundleFn | bundle} function (which uses esbuild's build api).
	 *   2) the resulting virtual files are then individually transformed via the {@link transformFn | transform} function (which uses esbuild's transform api). <br>
	 *     you can configure this step through custom transformation functions and capture patterns, by specifying them in the {@link TransformationCliConfig.pattern} field of your {@link CliConfigJson}.
	 *     but by default, only javascript files are further minified. (no css minification or transformation of other file/content types). see the default transformation {@link CliDistConfig.transform | here}.
	 *   3) the virtual files emitted by the {@link transformFn | transform} function are then fed to the {@link createFiles} utility function which writes them onto your filesystem.
	 * 
	 * @defaultValue `"1"`
	*/
	passes?: "1" | "2"

	/** enable esbuild's code splitting option. <br>
	 * you will probably want this turned on if you are transpiling multiple entry-points, so that the distribution files are overall shared and smaller in size.
	 * 
	 * @defaultValue `false`
	*/
	split?: boolean

	/** minify the output code, or apply minification of only one type (`"syntax"`, `"whitespace"`, or `"identifiers"`). <br>
	 * note that when `minify` is `true`, {@link EsBuildOptions.treeShaking} also occurs by default.
	 * 
	 * @defaultValue `"syntax"`
	*/
	minify?: boolean | "syntax" | "whitespace" | "identifiers"

	/** {@inheritDoc dist!EsBuildOptions.format}
	 * 
	 * @defaultValue `"esm"`
	*/
	format?: EsBuildOptions["format"]

	/** a path to an dist-build configuration json file that provides additional modifiable parameters.
	 * see {@link CliConfigJson} for more details on the available extended configurations.
	 * in case there is a contradiction between the {@link CliConfigJson} setting and the current cli args, the cli arg will take precedence.
	*/
	config?: string
}

/** contains the relevant fields within the {@link CliConfigJson | configuration json file}, that are used for configuring distribution generation. */
export interface CliDistConfig extends Omit<CliArgs, "config"> {
	/** {@inheritDoc dist!BuildDistConfig.input} */
	input?: BuildDistConfig["input"]

	/** {@inheritDoc dist!BuildDistConfig.copy} */
	copy?: BuildDistConfig["copy"]

	/** {@inheritDoc dist!BuildDistConfig.text} */
	text?: BuildDistConfig["text"]

	/** {@inheritDoc dist!BuildDistConfig.esbuild} */
	esbuild?: BuildDistConfig["esbuild"]

	/** when using two {@link passes} (i.e. `passes === "2"`), in the second stage compilation (transformation),
	 * the transformations listed in this array will be applied sequentially to whichever output file that matches the given {@link TransformationCliConfig.pattern | glob pattern}.
	 * 
	 * by default, when nothing is provided, only javascript esm-minification transformation will take place.
	 * meaning that it will take shape of the following default value:
	 * 
	 * @defaultValue `[{ pattern: "./**\/*.js", loader: "js", options: { minify: true, platform: "browser", format: "esm", target: "esnext" } }, ]`
	*/
	transform?: Array<TransformationCliConfig>

	// TODO: add plugin support via a built-in registry of plugins. for instance, "@oazmi/esbuild-plugin-deno" would imply using "jsr:@oazmi/esbuild-plugin-deno@0.4.3" (via dynamic import?), and "esbuild-plugin-css" would import "jsr:@oazmi/esbuild-plugin-css@0.1.1"
}

/** the schema of a docs-generation configuration json file, which can be referenced in the {@link CliArgs}, by passing its file-path with the `--config` switch. <br>
 * notice that there is only one property named {@link buildDist | `buildDist`}, which then holds all of the relevant configuration (as specified in {@link CliDistConfig}).
 * this is because doing so allows one to embed this configuration within other json files, such as "deno.json" itself, or a single dedicated configuration json file,
 * containing the configurations of different build tools altogether. <br>
 * in case there is a contradiction between the configurations in this json file and the current cli args, the cli arg will take precedence.
*/
export interface CliConfigJson {
	buildDist?: CliDistConfig
}

export interface TransformationCliConfig extends TransformationConfig {
	/** in cli mode, only glob string patterns are accepted. for details on what the pattern does, see {@link TransformationConfig.pattern}. */
	pattern?: null | undefined | string
}

const { input, i, ...cli_args } = parseArgs(dntShim.Deno.args, {
	collect: ["input"],
	alias: { input: ["i"] },
}) as unknown as (CliArgs & { input?: string[], i?: string[] })
const { config: config_path, ...rest_cli_args } = cli_args
const config_file: CliConfigJson = config_path
	? JSON.parse(await dntShim.Deno.readTextFile(config_path))
	: {}
if (input && (input.length > 0)) {
	(config_file.buildDist ??= {}).input = input
}
const {
	deno = "./deno.json", dir = "./dist/",
	log = false, passes = "1", format = "esm", minify = "syntax", split = false,
	transform = [{ pattern: "./**/*.js", loader: "js", options: { minify: true, platform: "browser", format: "esm", target: "esnext" } }],
	esbuild: esbuild_config,
	...combined_config
} = { ...config_file.buildDist, ...rest_cli_args }
const esbuild: EsBuildOptions = {
	...esbuild_config,
	format,
	splitting: split,
	minify: (minify === true || minify === false) ? minify : undefined,
	minifyIdentifiers: minify === "identifiers" ? true : undefined,
	minifySyntax: minify === "syntax" ? true : undefined,
	minifyWhitespace: minify === "whitespace" ? true : undefined,
}
const config: Partial<BuildDistConfig> = {
	...combined_config, esbuild, dir, deno
}
setLog({ log })

let artifacts_info: TemporaryFiles
if (passes == "2") {
	// we shall now perform double compilation (bundling then transformation)
	const
		{ copy, text, dryrun, ...bundle_config } = config,
		bundled_files = (await bundleFn(bundle_config)).map(([abs_dst_path, content]): VirtualFileOutput => {
			// the paths generated by `bundleFn` are usually absolute (esbuild is in hold of that).
			// however, the user would typically provide their transform glob-pattern as relative to the output directory (`dir`).
			// thus, we convert all absolute `abs_dst_path`s and convert them to be relative to `dir`, before passing them over to `transformFn`.
			const rel_dst_path = isAbsolutePath(abs_dst_path)
				? relativePath(pathResolve(dir), abs_dst_path)
				: relativePath(dir, abs_dst_path)
			return [rel_dst_path, content]
		}),
		transformed_files = await transformFn(bundled_files, transform)
	// at this point, even thought the paths of the `transformed_files` is relative to the `dir` folder, we can safely send it over to the
	// `createFiles` function to generate our files, since that function also takes in the base directory `dir` as a configurable option.
	// so there is no need for us to transform our relative paths back to absolute paths.
	await createFiles(transformed_files, { dir, dryrun })
	await copyAndCreateFiles({ deno, dir, copy, text, dryrun })
} else {
	// a single pass compilation can be done by esbuild natively
	artifacts_info = await buildDistFn(config)
}

// it is important that we stop esbuild manually, otherwise the deno process will not quit automatically.
await esStop()
