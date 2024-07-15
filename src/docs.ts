/** create typedoc based documentation.
 * read the documentation of the {@link buildDocs} function, and its configuration interface {@link BuildDocsConfig}.
 * 
 * @module
*/

import { Application as typedocApp, type TypeDocOptions } from "npm:typedoc@0.26.4"
//TODO: import { doubleCompileFiles } from "../build_tools.ts"
import { copyDir, emptyDir, ensureDir, ensureFile, expandGlob, pathIsGlobPattern, pathResolve } from "./deps.ts"
import { createPackageJson, createTsConfigJson, getDenoJson, gitRepositoryToPagesUrl, gitRepositoryToUrl, joinSlash, trimSlashes } from "./funcdefs.ts"
import type { DenoJson, TemporaryFiles } from "./typedefs.ts"


/** the configuration for the documentation building function {@link buildDocs}. */
export interface BuildDocsConfig {
	/** the desired output directory for the generated docs.
	 * if a relative path is provided, then it will be resolved as a path relative to Deno's current working directory. (which is generally where `deno.json` resides.)
	 * @defaultValue `"./docs/"`
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
	 * > when using glob patterns, make sure to execute a {@link dryrun | `dryrun`} of the build process with {@link log | "verbose" logging}, to ensure that you are getting your desired copy paths.
	*/
	copy?: Array<[source: string, destination: string]>

	/** write (or append) additional text files to the output {@link dir | `docs`} directory, at the specified relative destination.
	 * use the 3rd `options` item to specify text {@link Deno.WriteFileOptions | writing options}, such as `"append"` the new text, or permit the creation (`"create"`) of new file if it doesn't exist, etc...
	 * TODO: the following is untrue, instead the tsconfig.json is made in the parent directory. note that there will always be a new `"tsconfig.json"` text file created in the output {@link dir | `docs`} directory, which will reflect the `compilerOptions` value stored in your `deno.json`.
	*/
	text?: Array<[destination: string, data: string | ReadableStream<string>, options?: Deno.WriteFileOptions]>

	/** the root subpath in the website of the documentation (where the readme goes).
	 * for instance, if your domain name is `"www.example.com"`, and your documentation's root should be at `"www.example.com/docs/"`,
	 * then this option should be set to `"docs/"` (leading and trailing slashes will be trimmed, i.e. this option is invariant of them).
	 * if you leave this option `undefined`, then the script will use your {@link deno | "deno.json"} configuration's {@link DenoJson.repository | `"repository"`} key to parse the github-url,
	 * and then assign the site's root subpath to your repository's name, so that it is compatible with github-pages.
	 * otherwise, if no `"repository"` is present in your {@link deno | "deno.json"}, then an empty string (`""`) will be assigned,
	 * so that the webpage's root is also the documentation pages' root.
	*/
	site?: string | undefined

	/** add custom css styles to be applied to your rendered html pages. <br>
	 * you should provide the css content in string-text format here, and the {@link buildDocs} function will convert it to a css file in your "deno.json" directory.
	 * after that, its path will be provided to TypeDoc's {@link TypeDocOptions.customCss} property, which in turn will render the html documentation with the cutom css file referenced.
	*/
	css?: string

	/** [`typedoc`](https://www.npmjs.com/package/typedoc) related additional documentation building options for you to configure. */
	typedoc?: Omit<Partial<TypeDocOptions>, "entryPoints" | "out" | "skipErrorChecking">

	/** select logging level:
	 * - `undefined` or `"none"`: skip logging (`dnt` itself will still log).
	 * - `"basic"`: log what is being carried out at the top level.
	 * - `"verbose"`: in addition to basic logging, it also logs which files/folders are being copied or generated.
	*/
	log?: "none" | "basic" | "verbose"

	/** enable `dryrun` if you wish for nothing to be written onto the the filesystem.
	 * @defaultValue `false`
	*/
	dryrun?: boolean
}


interface NodeArtifacts extends TemporaryFiles {
	files: [`${string}package.json`, `${string}tsconfig.json`]
}


/** the default configuration used by the {@link buildDocs} function, for missing/unprovided configuration fields. */
export const defaultBuildDocsConfig: BuildDocsConfig = {
	dir: "./docs/",
	deno: "./deno.json",
	copy: [
		["./readme.md", "./readme.md"],
		["./license.md", "./license.md"],
		// copy the source code to the docs' "src" subdirectory, so that it can be hosted on github pages similar to a cdn.
		// assuming `site_root` is the root url of the hosted site, `${site_root}/src/*.ts` will contain all of the source typescript files.
		["./src/", "./src/"],
	],
	css: `
table { border-collapse: collapse; }
th { background-color: rgba(128, 128, 128, 0.50); }
th, td { border: 0.1em solid rgba(0, 0, 0, 0.75); padding: 0.1em; }
`,
}

/** this function generates code documentation of your deno-project, using [`typedoc`](https://github.com/TypeStrong/typedoc).
 * this function first reads your "deno.json" file to generate an equivalent "package.json" and "tsconfig.json" files, and then it runs `typedoc` to generate the documentation html site. <br>
 * take a look at {@link BuildDocsConfig} to see what configuration options are available. <br>
 * moreover, to use this transformer via cli, use the [`./cli/docs.ts`](./cli/docs.ts) script file (or [`jsr:@oazmi/build-tools/cli/docs`](https://jsr.io/@oazmi/build-tools) if using jsr), and take a look at its {@link CliArgs} for list of supported cli args.
*/
export const buildDocs = async (build_config: Partial<BuildDocsConfig> = {}): Promise<TemporaryFiles> => {
	const
		{ dir, deno, copy = [], text = [], site, css, typedoc = {}, log, dryrun = false }: BuildDocsConfig = { ...defaultBuildDocsConfig, ...build_config },
		abs_dir = pathResolve(dir),
		abs_deno_dir = pathResolve(deno, "../"),
		log_is_verbose = log === "verbose",
		log_is_basic = log_is_verbose || log === "basic"

	if (log_is_verbose) { console.log("current docs-build configuration is:", { dir, deno, copy, text, typedoc, log, dryrun }) }

	// first we generate the "package.json" and "tsconfig.json" files (in the directory of "deno.json"), which are required by "npm:typedoc" to function in deno environment.
	if (log_is_verbose) { console.log("[in-memory] creating a \"package.json\" file from your \"deno.json\" file") }
	const
		package_json = await createPackageJson(deno),
		package_json_abs_path = pathResolve(abs_deno_dir, "package.json")
	if (log_is_verbose) { console.log("[in-memory] creating a \"tsconfig.json\" file from your \"deno.json\" file") }
	const
		tsconfig_json = await createTsConfigJson(deno),
		tsconfig_json_asb_path = pathResolve(abs_deno_dir, "tsconfig.json")
	if (log_is_basic) { console.log("[in-memory] generated \"package.json\" and \"tsconfig.json\" files.") }
	if (!dryrun) {
		await ensureFile(package_json_abs_path)
		await ensureFile(tsconfig_json_asb_path)
		await Deno.writeTextFile(package_json_abs_path, JSON.stringify(package_json))
		await Deno.writeTextFile(tsconfig_json_asb_path, JSON.stringify(tsconfig_json))
	}
	if (log_is_verbose) { console.log("[in-fs] wrote \"package.json\" to:", package_json_abs_path) }
	if (log_is_verbose) { console.log("[in-fs] wrote \"tsconfig.json\" to:", tsconfig_json_asb_path) }
	const node_project_temp_files: NodeArtifacts = {
		dir: pathResolve(abs_deno_dir),
		files: [package_json_abs_path, tsconfig_json_asb_path] as any,
		cleanup: async () => {
			if (!dryrun) {
				await Deno.remove(package_json_abs_path)
				await Deno.remove(tsconfig_json_asb_path)
			}
			if (log_is_verbose) { console.log("[in-fs] deleted \"package.json\" at:", package_json_abs_path) }
			if (log_is_verbose) { console.log("[in-fs] deleted \"tsconfig.json\" at:", tsconfig_json_asb_path) }
		},
	}

	// generating a custom css file is requested
	let custom_css_temp_files: TemporaryFiles | undefined
	if (css) {
		const
			temp_dir = pathResolve(abs_deno_dir, "temp"),
			file_path = pathResolve(temp_dir, "custom.css")
		if (log_is_verbose) { console.log("[in-fs] generating a \"custom.css\" file for rendered html at:", file_path) }
		typedoc.customCss = file_path
		if (!dryrun) {
			await ensureFile(file_path)
			await Deno.writeTextFile(file_path, css)
		}
		custom_css_temp_files = {
			dir: temp_dir,
			files: ["custom.css"],
			cleanup: async () => {
				if (!dryrun) {
					await Deno.remove(file_path)
					// check if the "./temp/" folder is now empty, and delete it if it is empty.
					let temp_dir_is_empty = true
					for await (const entry of Deno.readDir(temp_dir)) {
						temp_dir_is_empty = false
						break
					}
					if (temp_dir_is_empty) { await Deno.remove(temp_dir) }
				}
				if (log_is_verbose) { console.log("[in-fs] deleted \"custom.css\" at:", file_path) }
			}
		}
	}

	// time to run the `typedoc` documentation generator
	if (log_is_verbose) { console.log("[in-fs] emptying your docs-build directory:", abs_dir) }
	if (!dryrun) { await emptyDir(dir) }
	const
		{ exports, repository } = await getDenoJson(deno),
		repo_url = gitRepositoryToUrl(repository?.url ?? "git+https://github.com/404/404.git"),
		site_root_path = trimSlashes(site ?? (repository?.url ? gitRepositoryToPagesUrl(repository.url).pathname : "")),
		{ ".": mainEntrypoint = undefined, ...subEntrypoints } = typeof exports === "string"
			? { ".": exports }
			: exports,
		entryPoints: string[] = [...(mainEntrypoint ? [mainEntrypoint] : []), ...Object.values(subEntrypoints) as string[]]

	if (log_is_verbose) { console.log("[in-memory] bootstrapping TypeDoc") }
	const typedoc_app = await typedocApp.bootstrapWithPlugins({
		// even though the intermediate "package.json" that we created contains the `exports` field, `typedoc` can't figure out the entrypoints on its own.
		entryPoints,
		out: dir,
		readme: pathResolve(abs_deno_dir, "./readme.md"),
		// TODO: navigation links should be customizable, but shouldn't overwrite the github repo link
		navigationLinks: {
			"github": repo_url.href,
			"readme": joinSlash(site_root_path),
			"source": joinSlash(site_root_path, mainEntrypoint ?? "./src/mod.ts"),
			"examples": joinSlash(site_root_path, "examples", "index.html"),
			"distribution": joinSlash(site_root_path, "dist", "esm.js"),
		},
		skipErrorChecking: true,
		githubPages: true,
		includeVersion: true,
		sort: ["source-order", "required-first", "kind"],
		visibilityFilters: {
			"protected": true,
			"private": true,
			"inherited": true,
			"external": true,
		},
		...typedoc,
	})

	if (log_is_basic) { console.log("[in-memory] generating TypeDoc documents in-memory.") }
	const typedoc_project = await typedoc_app.convert()
	if (log_is_basic) { console.log("[in-fs] rendering TypeDoc documents to html and outputting to:", abs_dir) }
	if (typedoc_project === undefined) { console.log("TypeDoc doument parsing failed") }
	if (!dryrun && typedoc_project) { await typedoc_app.generateDocs(typedoc_project, dir) }

	// copying other files
	if (log_is_basic) { console.log("[in-fs] copy additional files from you deno directory over to the npm-build directory") }
	await Promise.all(copy.map(async ([src, dst]): Promise<void> => {
		const
			cwd = abs_deno_dir,
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
			if (!dryrun) {
				await emptyDir(abs_dir)
				await Deno.remove(abs_dir)
			}
			await node_project_temp_files.cleanup()
			await custom_css_temp_files?.cleanup()
		}
	}
}
