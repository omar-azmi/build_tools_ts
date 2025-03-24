/** create typedoc based documentation.
 * read the documentation of the {@link buildDocs} function, and its configuration interface {@link BuildDocsConfig}.
 *
 * @module
*/
import "./_dnt.polyfills.js";
import * as dntShim from "./_dnt.shims.js";
import { Application as typedocApp } from "typedoc";
// TODO: import { bundle, transform } from "./dist.ts" and then create statically hosted distribution version of the library being documented
// TODO: allow for user-customization of `entryPoints`, using an approach similar to `/src/dist.ts`.
import { emptyDir, ensureEndSlash, ensureFile, ensureStartDotSlash, ensureStartSlash, joinPaths, object_values, parseFilepathInfo, pathResolve, trimSlashes } from "./deps.js";
import { denoPlugins, esBuild, esStop } from "./dist.js";
import { copyAndCreateFiles, createPackageJson, createTsConfigJson, getDenoJson, gitRepositoryToPagesUrl, gitRepositoryToUrl } from "./funcdefs.js";
import { console_warn, logBasic, logVerbose, setLog } from "./logger.js";
/** the default configuration used by the {@link buildDocs} function, for missing/unprovided configuration fields. */
export const defaultBuildDocsConfig = {
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
pre code { tab-size: 4; }
`,
};
/** this function generates code documentation of your deno-project, using [`typedoc`](https://github.com/TypeStrong/typedoc).
 * this function first reads your "deno.json" file to generate an equivalent "package.json" and "tsconfig.json" files, and then it runs `typedoc` to generate the documentation html site. <br>
 * take a look at {@link BuildDocsConfig} to see what configuration options are available. <br>
 * moreover, to use this transformer via cli, use the [`./cli/docs.ts`](./cli/docs.ts) script file (or [`jsr:@oazmi/build-tools/cli/docs`](https://jsr.io/@oazmi/build-tools) if using jsr), and take a look at its {@link CliArgs} for list of supported cli args.
*/
export const buildDocs = async (build_config = {}) => {
    setLog(build_config);
    const { dir, deno, copy = [], text = [], site, css, typedoc = {}, preserveTemporary = false, dryrun = false } = { ...defaultBuildDocsConfig, ...build_config }, abs_dir = pathResolve(dir), abs_deno_dir = pathResolve(deno, "./");
    logVerbose("current docs-build configuration is:", { dir, deno, site, preserveTemporary, copy, text, typedoc, css, dryrun });
    // first we generate the "package.json" and "tsconfig.json" files (in the directory of "deno.json"), which are required by "npm:typedoc" to function in deno environment.
    logVerbose("[in-memory] creating a \"package.json\" file from your \"deno.json\" file");
    const package_json = await createPackageJson(deno), package_json_abs_path = pathResolve(abs_deno_dir, "package.json");
    logVerbose("[in-memory] creating a \"tsconfig.json\" file from your \"deno.json\" file");
    const tsconfig_json = await createTsConfigJson(deno), tsconfig_json_asb_path = pathResolve(abs_deno_dir, "tsconfig.json");
    logBasic("[in-memory] generated \"package.json\" and \"tsconfig.json\" files.");
    if (!dryrun) {
        await ensureFile(package_json_abs_path);
        await ensureFile(tsconfig_json_asb_path);
        await dntShim.Deno.writeTextFile(package_json_abs_path, JSON.stringify(package_json));
        await dntShim.Deno.writeTextFile(tsconfig_json_asb_path, JSON.stringify(tsconfig_json));
    }
    logVerbose("[in-fs] wrote \"package.json\" to:", package_json_abs_path);
    logVerbose("[in-fs] wrote \"tsconfig.json\" to:", tsconfig_json_asb_path);
    const node_project_temp_files = {
        dir: pathResolve(abs_deno_dir),
        files: [package_json_abs_path, tsconfig_json_asb_path],
        cleanup: async () => {
            if (!dryrun) {
                await dntShim.Deno.remove(package_json_abs_path);
                await dntShim.Deno.remove(tsconfig_json_asb_path);
            }
            logVerbose("[in-fs] deleted \"package.json\" at:", package_json_abs_path);
            logVerbose("[in-fs] deleted \"tsconfig.json\" at:", tsconfig_json_asb_path);
        },
    };
    // generating a custom css file is requested
    let custom_css_temp_files;
    if (css) {
        const temp_dir = pathResolve(abs_deno_dir, "temp"), file_path = pathResolve(temp_dir, "custom.css");
        logVerbose("[in-fs] generating a \"custom.css\" file for rendered html at:", file_path);
        typedoc.customCss = file_path;
        if (!dryrun) {
            await ensureFile(file_path);
            await dntShim.Deno.writeTextFile(file_path, css);
        }
        custom_css_temp_files = {
            dir: temp_dir,
            files: ["custom.css"],
            cleanup: async () => {
                if (!dryrun) {
                    await dntShim.Deno.remove(file_path);
                    // check if the "./temp/" folder is now empty, and delete it if it is empty.
                    let temp_dir_is_empty = true;
                    for await (const entry of dntShim.Deno.readDir(temp_dir)) {
                        temp_dir_is_empty = false;
                        break;
                    }
                    if (temp_dir_is_empty) {
                        await dntShim.Deno.remove(temp_dir);
                    }
                }
                logVerbose("[in-fs] deleted \"custom.css\" at:", file_path);
            }
        };
    }
    // time to run the `typedoc` documentation generator
    logVerbose("[in-fs] emptying your docs-build directory:", abs_dir);
    if (!dryrun) {
        await emptyDir(dir);
    }
    const { exports, repository } = await getDenoJson(deno), repo_url = gitRepositoryToUrl(repository?.url ?? "git+https://github.com/404/404.git"), site_root_path = ensureStartSlash(ensureEndSlash(trimSlashes(site ?? (repository?.url
        ? gitRepositoryToPagesUrl(repository.url).pathname
        : "")))), { ".": mainEntrypoint = undefined, ...subEntrypoints } = typeof exports === "string"
        ? { ".": exports }
        : exports, entryPoints = [...(mainEntrypoint ? [mainEntrypoint] : []), ...object_values(subEntrypoints)], distribution_file_info = parseFilepathInfo(mainEntrypoint ?? "./src/mod.ts"), distribution_file_name = ensureStartDotSlash(distribution_file_info.basename + ".js");
    logVerbose("[in-memory] bundling the mermaid graphs plugin into a data-uri");
    const mermaid_plugin_data_uri = await typedocPluginToDataUriScript("./extra/docs/mermaid_plugin.ts", { relativeTo: "build-tools" });
    logVerbose("[in-memory] bootstrapping TypeDoc");
    const typedoc_app = await typedocApp.bootstrapWithPlugins({
        // even though the intermediate "package.json" that we created contains the `exports` field, `typedoc` can't figure out the entrypoints on its own.
        entryPoints,
        out: dir,
        readme: pathResolve(abs_deno_dir, "./readme.md"),
        hostedBaseUrl: repository ? gitRepositoryToPagesUrl(repository.url).href : undefined,
        // TODO: navigation links should be customizable, but shouldn't overwrite the github repo link
        navigationLinks: {
            "github": repo_url.href,
            "readme": joinPaths(site_root_path),
            "src": joinPaths(site_root_path, mainEntrypoint ?? "./src/mod.ts"),
            "dist": joinPaths(site_root_path, "./dist/", distribution_file_name),
            "examples": joinPaths(site_root_path, "./examples/", "./index.html"),
        },
        skipErrorChecking: true,
        githubPages: true,
        includeVersion: true,
        logLevel: "Warn",
        sort: ["source-order", "required-first", "kind"],
        visibilityFilters: {
            "protected": true,
            "private": true,
            "inherited": true,
            "external": true,
        },
        plugin: [mermaid_plugin_data_uri],
        ...typedoc,
    });
    logBasic("[in-memory] generating TypeDoc documents in-memory.");
    const typedoc_project = await typedoc_app.convert();
    logBasic("[in-fs] rendering TypeDoc documents to html and outputting to:", abs_dir);
    if (typedoc_project === undefined) {
        console_warn("TypeDoc document parsing failed");
    }
    if (!dryrun && typedoc_project) {
        await typedoc_app.generateDocs(typedoc_project, dir);
    }
    // creating new text files and copying over files to the destination `dir` folder.
    await copyAndCreateFiles({ dir, deno, copy, text, dryrun });
    // clean up temporary files if `preserveTemporary` is false
    if (!preserveTemporary) {
        await node_project_temp_files.cleanup();
        await custom_css_temp_files?.cleanup();
    }
    // stop esbuild if we dynamically bundled the mermaid plugin into a data-uri
    await esStop();
    return {
        dir: abs_dir,
        files: [],
        cleanup: async () => {
            logBasic("[in-fs] deleting your docs-build directory:", abs_dir);
            if (!dryrun) {
                await emptyDir(abs_dir);
                await dntShim.Deno.remove(abs_dir);
            }
            // if the temporary files were originally presereved/kept, then we should clean them up now, since their cleaning got skipped earlier.
            if (preserveTemporary) {
                await node_project_temp_files.cleanup();
                await custom_css_temp_files?.cleanup();
            }
        }
    };
};
const defaultTypedocPluginToDataUriScriptConfig = {
    relativeTo: "cwd"
};
const typedocPluginToDataUriScript = async (plugin_script_path, config) => {
    const { relativeTo } = { ...defaultTypedocPluginToDataUriScriptConfig, ...config }, plugin_script_path_fileinfo = parseFilepathInfo(plugin_script_path), plugin_script_path_without_ext = joinPaths(plugin_script_path_fileinfo.dirpath, plugin_script_path_fileinfo.basename), plugin_script_paths_to_try = [
        plugin_script_path, // try using the original path
        plugin_script_path_without_ext + ".ts", // try using typescirpt extension (works for deno and node with typsecript support)
        plugin_script_path_without_ext + ".js", // try using javascript extension (works for transpiled and distributed version of this library)
        plugin_script_path_without_ext + ".mts",
        plugin_script_path_without_ext + ".mjs",
        plugin_script_path_without_ext + ".cts",
        plugin_script_path_without_ext + ".cjs",
        plugin_script_path_without_ext + ".tsx",
        plugin_script_path_without_ext + ".jsx",
        plugin_script_path_without_ext + "index.js",
        plugin_script_path_without_ext + "index.ts",
    ].map((path) => {
        return relativeTo === "build-tools"
            ? new URL(path, import.meta.url).href : path;
    });
    let working_script_path;
    for await (const script_path of plugin_script_paths_to_try) {
        // why am I not using `method: "HEAD"`? that's because "file://" urls do not support the head method unfortunately (at least not on windows).
        if ((await fetch(script_path, { method: "GET" })).ok) {
            working_script_path = script_path;
            break;
        }
    }
    if (!working_script_path) {
        logBasic(`[error] failed to find the typedoc plugin with the path: "${plugin_script_path}"\n\tnow using a dummy plugin instead.\n\ttried fetching the following paths:`, plugin_script_paths_to_try);
        return "data:application/javascript;utf8,export const load = (app) => { }";
    }
    logBasic("[in-memory] resolved mermaid plugin script path to:", working_script_path);
    const script_contents = await (await fetch(working_script_path)).text();
    const bundle_result = (await esBuild({
        stdin: {
            contents: script_contents,
            sourcefile: working_script_path,
            loader: "ts",
        },
        // entryPoints: [working_script_path],
        plugins: [...denoPlugins()],
        outdir: "./virtual-dist/",
        format: "esm",
        platform: "node",
        minify: true,
        bundle: true,
        write: false,
    }));
    const bundled_code = bundle_result.outputFiles.find((outfile) => outfile.path.endsWith(".js"));
    logVerbose("[in-memory] successfully transpiled the typedoc plugin:", working_script_path);
    return "data:application/javascript;base64," + btoa(bundled_code.text);
};
