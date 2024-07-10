import { build as dntBuild } from "jsr:@deno/dnt@0.41.2"
import { copyDir, emptyDir, ensureDir, ensureFile, expandGlob, pathDirname, pathIsGlobPattern, pathResolve, type dntBuildOptions } from "./deps.ts"
import { createPackageJson, createTsConfigJson, getDenoJson } from "./funcdefs.ts"
import type { TemporaryFiles } from "./typedefs.ts"

export interface BuildNpmConfig {
	/** the path to the folder where you wish to create your npm release.
	 * if a relative path is provided, then it will be resolved as a path relative to Deno's current working directory. (which is generally where `deno.json` resides.)
	 * @defaultValue `"./npm/"`
	*/
	dir: string

	/** the path to your `deno.json` file for this project.
	 * if a relative path is provided, then it will be resolved as a path relative to Deno's current working directory. (which is also where `deno.json`  generally resides.)
	 * @defaultValue `"./deno.json"`
	*/
	deno: string

	/** a list of paths/glob patterns relative to the {@link deno | `deno.json`} directory,
	 * that should be copied over to the {@link dir | `npm`} directory, at the specified path.
	 * note that if the source is a glob pattern, then its destination can only be a folder.
	 * moreover, folder sources and destinations must always end in a trailing slash (i.e. `"./path/to/my/folder/"`)
	 * 
	 * > [!CAUTION]
	 * > be cautious with using glob patterns with folders, as it will generally give you a bad unexpected output.
	 * > when using glob patterns, make sure to execute a {@link dryrun | dryrun} of the build process with {@link log | "verbose" logging}, to ensure that you are getting your desired copy paths.
	*/
	copy?: Array<[source: string, destination: string]>

	/** write (or append) additional text files to the output {@link dir | `npm`} directory, at the specified relative destination.
	 * use the 3rd `options` item to specify text {@link Deno.WriteFileOptions | writing options}, such as `"append"` the new text, or permit the creation (`"create"`) of new file if it doesn't exist, etc...
	 * note that there will always be a new `"tsconfig.json"` text file created in the output {@link dir | `npm`} directory, which will reflect the `compilerOptions` value stored in your `deno.json`.
	*/
	text?: Array<[destination: string, data: string | ReadableStream<string>, options?: Deno.WriteFileOptions]>

	/** [`dnt`](https://jsr.io/deno/dnt) related additional build options for you to configure. */
	dnt?: Omit<dntBuildOptions, "entryPoints" | "outDir" | "scriptModule">

	/** select logging level:
	 * - `undefined` or `"none"`: skip logging (`dnt` itself will still log).
	 * - `"basic"`: log what is being carried out at the top level.
	 * - `"verbose"`: in addition to basic logging, it also logs which files/folders are being copied or generated.
	*/
	log?: "none" | "basic" | "verbose",

	/** enable `dryrun` if you wish for nothing to be written onto the the filesystem.
	 * @defaultValue `false`
	*/
	dryrun?: boolean,
}

export const defaultBuildNpmConfig: BuildNpmConfig = {
	dir: "./npm/",
	deno: "./deno.json",
	copy: [
		["./readme.md", "./readme.md"],
		["./license.md", "./license.md"],
		["./.github/code_of_conduct.md", "./code_of_conduct.md"]
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

export const buildNpm = async (build_config: Partial<BuildNpmConfig> = {}): Promise<TemporaryFiles> => {
	const
		{ dir, deno, copy = [], text = [], dnt, log, dryrun = false }: BuildNpmConfig = { ...defaultBuildNpmConfig, ...build_config },
		abs_dir = pathResolve(dir),
		abs_deno = pathResolve(deno),
		log_is_verbose = log === "verbose",
		log_is_basic = log_is_verbose || log === "basic"

	const {
		name: library_name = "library",
		exports,
		nodePackageManager,
	} = await getDenoJson(deno)

	const mainEntrypoint = typeof exports === "string" ? exports : exports["."]
	if (log_is_verbose) { console.log("the main entry-point of your npm-build will be:", mainEntrypoint) }

	if (log_is_verbose) { console.log("current npm-build configuration is:", { dir, deno, copy, text, dnt, log, dryrun }) }
	if (log_is_verbose) { console.log("[in-memory] creating a \"package.json\" file from your \"deno.json\" file") }
	const package_json = await createPackageJson(deno, {
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

	if (log_is_verbose) { console.log("[in-memory] creating a \"tsconfig.json\" file from your \"deno.json\" file") }
	const tsconfig_json = await createTsConfigJson(deno)
	if (log_is_basic) { console.log("[in-memory] generated \"package.json\" and \"tsconfig.json\" files.") }

	if (log_is_verbose) { console.log("[in-fs] emptying your npm-build directory:", abs_dir) }
	if (!dryrun) { await emptyDir(dir) }
	if (log_is_basic) { console.log("[in-fs] transforming your deno project to an npm-build via \`dnt\`") }
	if (!dryrun) {
		await dntBuild({
			entryPoints: Object.entries(exports).map(([export_path, source_path]) => ({
				name: export_path,
				path: source_path,
			})),
			outDir: dir,
			shims: { deno: "dev" },
			packageManager: nodePackageManager,
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
			// 	["binder", "builtin_aliases_deps", "lambda", "struct", "typedefs",].map((submodule_path) => {
			// 		return [
			// 			"jsr:@oazmi/kitchensink@0.7.5/" + submodule_path,
			// 			{
			// 				name: "@oazmi/kitchensink",
			// 				version: "0.7.5-a",
			// 				subPath: submodule_path,
			// 			}
			// 		]
			// 	})
			// )
			...dnt,
		})
	}

	// copying other files
	if (log_is_basic) { console.log("[in-fs] copy additional files from you deno directory over to the npm-build directory") }
	await Promise.all(copy.map(async ([src, dst]): Promise<void> => {
		const
			cwd = pathDirname(deno),
			is_single_file = (
				src.endsWith("/")
				|| dst.endsWith("/")
				|| pathIsGlobPattern(src)
			) ? false : true,
			abs_src = pathResolve(cwd, src),
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
			for await (const src_dir_entry of expandGlob(src, { root: cwd })) {
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

	// writing text files
	if (log_is_basic) { console.log("[in-fs] writing additional text files to your npm-build directory") }
	// first we add our `tsconfig.json` config to the list of text files to write. we don't push it into `text`, because it will potentially mutate the `text` property in the `defaultBuildNpmConfig` variable.
	const texts: typeof text = [...text, ["./tsconfig.json", JSON.stringify(tsconfig_json)]]
	for (const [dst_path, text_data, options] of texts) {
		const abs_dst = pathResolve(dir, dst_path)
		if (log_is_verbose) { console.log("[in-fs] writing text", `to: "${abs_dst}"`, "with the configuration:", options) }
		if (!dryrun) { await Deno.writeTextFile(abs_dst, text_data, options) }
	}

	return {
		dir: abs_dir,
		files: [],
		cleanup: async () => {
			if (dryrun) { return }
			if (log_is_basic) { console.log("[in-fs] deleting your npm-build directory:", abs_dir) }
			await emptyDir(abs_dir)
			await Deno.remove(abs_dir)
		}
	}
}
