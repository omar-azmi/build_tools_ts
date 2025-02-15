/** the {@link buildNpm} function in this module provides way for you to transform your deno-project to a node-project, using [`dnt`](https://jsr.io/@deno/dnt) under the hood. <br>
 * this tool reads your "deno.json" file to figure out most of what needs to be transformed, and comes with a handful of useful preset configurations. <br>
 * take a look at {@link BuildNpmConfig} to see what configuration options are available. <br>
 * moreover, to use this transformer via cli, use the [`./cli/npm.ts`](./cli/npm.ts) script file (or [`jsr:@oazmi/build-tools/cli/npm`](https://jsr.io/@oazmi/build-tools) if using jsr), and take a look at its {@link CliArgs} for list of supported cli args.
 * 
 * @module
*/
// TODO: allow for user-customization of `entryPoints`, using an approach similar to `/src/dist.ts`.

import { build as dntBuild, type BuildOptions as DntBuildOptions } from "jsr:@deno/dnt@0.41.3"
import type { CliArgs } from "./cli/npm.ts"
import { emptyDir, pathResolve } from "./deps.ts"
import { copyAndCreateFiles, createPackageJson, createTsConfigJson, getDenoJson } from "./funcdefs.ts"
import { logBasic, logVerbose, setLog } from "./logger.ts"
import type { BaseBuildConfig, TemporaryFiles } from "./typedefs.ts"


/** the configuration for the npm-release building function {@link buildNpm}. */
export interface BuildNpmConfig extends BaseBuildConfig {
	/** the path to the folder where you wish to create your npm release.
	 * if a relative path is provided, then it will be resolved as a path relative to Deno's current working directory. (which is generally where `deno.json` resides.)
	 * 
	 * @defaultValue `"./npm/"`
	*/
	dir: string

	/** [`dnt`](https://jsr.io/@deno/dnt) related additional build options for you to configure. */
	dnt?: Omit<Partial<DntBuildOptions>, "entryPoints" | "outDir" | "scriptModule">
}

/** the default configuration used by the {@link buildNpm} function, for missing/unprovided configuration fields. */
export const defaultBuildNpmConfig: BuildNpmConfig = {
	dir: "./npm/",
	deno: "./deno.json",
	copy: [
		["./assets/", "./assets/"],
		["./readme.md", "./readme.md"],
		["./license.md", "./license.md"],
		["./.github/code_of_conduct.md", "./code_of_conduct.md"],
	],
	text: [
		["./.gitignore", "/node_modules/\n"],
		[".npmignore", `
code_of_conduct.md
dist/
docs/
docs_config/
test/
tsconfig.json
typedoc.json
`, { append: true }],
	],
}

/** this function transforms your deno-project to a node-project, using [`dnt`](https://jsr.io/@deno/dnt) under the hood.
 * this function reads your "deno.json" file to figure out most of what needs to be transformed, and comes with a handful of useful preset configurations. <br>
 * take a look at {@link BuildNpmConfig} to see what configuration options are available. <br>
 * moreover, to use this transformer via cli, use the [`./cli/npm.ts`](./cli/npm.ts) script file (or [`jsr:@oazmi/build-tools/cli/npm`](https://jsr.io/@oazmi/build-tools) if using jsr), and take a look at its {@link CliArgs} for list of supported cli args.
*/
export const buildNpm = async (build_config: Partial<BuildNpmConfig> = {}): Promise<TemporaryFiles> => {
	setLog(build_config)
	const
		{ dir, deno, copy = [], text = [], dnt, dryrun = false }: BuildNpmConfig = { ...defaultBuildNpmConfig, ...build_config },
		abs_dir = pathResolve(dir),
		abs_deno = pathResolve(deno)

	const {
		name: library_name = "library",
		exports,
	} = await getDenoJson(deno)

	const mainEntrypoint = typeof exports === "string" ? exports : exports["."]
	logVerbose("the main entry-point of your npm-build will be:", mainEntrypoint)

	logVerbose("current npm-build configuration is:", { dir, deno, copy, text, dnt, dryrun })
	logVerbose("[in-memory] creating a \"package.json\" file from your \"deno.json\" file")
	const package_json = await createPackageJson(deno, {
		sideEffects: false,
		scripts: {
			"build-dist": `npm run build-esm && npm run build-esm-minify && npm run build-iife && npm run build-iife-minify`,
			"build-esm": `npx esbuild "${mainEntrypoint}" --bundle --format=esm --outfile="./dist/${library_name}.esm.js"`,
			"build-esm-minify": `npx esbuild "${mainEntrypoint}" --bundle --minify --format=esm --outfile="./dist/${library_name}.esm.min.js"`,
			"build-iife": `npx esbuild "${mainEntrypoint}" --bundle --format=iife --outfile="./dist/${library_name}.iife.js"`,
			"build-iife-minify": `npx esbuild "${mainEntrypoint}" --bundle --minify --format=iife --outfile="./dist/${library_name}.iife.min.js"`,
		}
	})
	// we must delete the `exports` property, as it will override the correct version generated by `dntBuild`.
	delete package_json["exports"]

	logVerbose("[in-memory] creating a \"tsconfig.json\" file from your \"deno.json\" file")
	const tsconfig_json = await createTsConfigJson(deno)
	logBasic("[in-memory] generated \"package.json\" and \"tsconfig.json\" files.")

	logVerbose("[in-fs] emptying your npm-build directory:", abs_dir)
	if (!dryrun) { await emptyDir(dir) }
	logBasic("[in-fs] transforming your deno project to an npm-build via \`dnt\`")
	if (!dryrun) {
		await dntBuild({
			entryPoints: Object.entries(exports).map(([export_path, source_path]) => ({
				name: export_path,
				path: source_path,
			})),
			outDir: dir,
			shims: { deno: "dev" },
			package: package_json,
			compilerOptions: { ...tsconfig_json.compilerOptions, target: "Latest" },
			typeCheck: false,
			declaration: "inline",
			esModule: true,
			scriptModule: false,
			test: false,
			skipNpmInstall: true,
			// override the test pattern, so that no tests are included, and no Deno.test shims are created for the entirety of the transpiled package.
			// see the details here: "https://github.com/denoland/dnt?tab=readme-ov-file#test-file-matching"
			testPattern: "TEST_NOTHING",
			// TODO: there's no need for mapping, as jsr imports are converted into npm-compatible packages on the fly.
			// however, I loose the ability to map it from my package's npm releases as a consequence.
			// consider whether or not I'd like to have my dependencies as jsr imports or npm imports.
			// mappings: Object.fromEntries(
			// 	["alias", "binder", "browser", "eightpack", "lambda", "pathman", "timeman", "struct", "typedefs",].map((submodule_path) => {
			// 		return [
			// 			"jsr:@oazmi/kitchensink@0.9.1/" + submodule_path,
			// 			{
			// 				name: "@oazmi/kitchensink",
			// 				version: "0.9.1",
			// 				subPath: submodule_path,
			// 			}
			// 		]
			// 	})
			// ),
			...dnt,
		})
	}

	// first we add our `tsconfig.json` config to the list of text files to write.
	// we don't push it into `text`, because it will potentially mutate the `text` property in the `defaultBuildNpmConfig` variable.
	const tsconfig_text_creation = ["./tsconfig.json", JSON.stringify(tsconfig_json)] as [destination: string, content: string]
	// creating new text files and copying over files to the destination `dir` folder.
	await copyAndCreateFiles({ dir, deno, copy, text: [...text, tsconfig_text_creation], dryrun })

	return {
		dir: abs_dir,
		files: [],
		cleanup: async () => {
			logBasic("[in-fs] deleting your npm-build directory:", abs_dir)
			if (dryrun) { return }
			await emptyDir(abs_dir)
			await Deno.remove(abs_dir)
		}
	}
}
