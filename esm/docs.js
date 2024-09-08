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
import { emptyDir, ensureFile, pathResolve } from "./deps.js";
import { copyAndCreateFiles, createPackageJson, createTsConfigJson, getDenoJson, gitRepositoryToPagesUrl, gitRepositoryToUrl, joinSlash, trimSlashes } from "./funcdefs.js";
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
`,
};
/** this function generates code documentation of your deno-project, using [`typedoc`](https://github.com/TypeStrong/typedoc).
 * this function first reads your "deno.json" file to generate an equivalent "package.json" and "tsconfig.json" files, and then it runs `typedoc` to generate the documentation html site. <br>
 * take a look at {@link BuildDocsConfig} to see what configuration options are available. <br>
 * moreover, to use this transformer via cli, use the [`./cli/docs.ts`](./cli/docs.ts) script file (or [`jsr:@oazmi/build-tools/cli/docs`](https://jsr.io/@oazmi/build-tools) if using jsr), and take a look at its {@link CliArgs} for list of supported cli args.
*/
export const buildDocs = async (build_config = {}) => {
    const { dir, deno, copy = [], text = [], site, css, typedoc = {}, preserveTemporary = false, log, dryrun = false } = { ...defaultBuildDocsConfig, ...build_config }, abs_dir = pathResolve(dir), abs_deno_dir = pathResolve(deno, "../"), log_is_verbose = log === "verbose", log_is_basic = log_is_verbose || log === "basic";
    if (log_is_verbose) {
        console.log("current docs-build configuration is:", { dir, deno, site, preserveTemporary, copy, text, typedoc, css, log, dryrun });
    }
    // first we generate the "package.json" and "tsconfig.json" files (in the directory of "deno.json"), which are required by "npm:typedoc" to function in deno environment.
    if (log_is_verbose) {
        console.log("[in-memory] creating a \"package.json\" file from your \"deno.json\" file");
    }
    const package_json = await createPackageJson(deno), package_json_abs_path = pathResolve(abs_deno_dir, "package.json");
    if (log_is_verbose) {
        console.log("[in-memory] creating a \"tsconfig.json\" file from your \"deno.json\" file");
    }
    const tsconfig_json = await createTsConfigJson(deno), tsconfig_json_asb_path = pathResolve(abs_deno_dir, "tsconfig.json");
    if (log_is_basic) {
        console.log("[in-memory] generated \"package.json\" and \"tsconfig.json\" files.");
    }
    if (!dryrun) {
        await ensureFile(package_json_abs_path);
        await ensureFile(tsconfig_json_asb_path);
        await dntShim.Deno.writeTextFile(package_json_abs_path, JSON.stringify(package_json));
        await dntShim.Deno.writeTextFile(tsconfig_json_asb_path, JSON.stringify(tsconfig_json));
    }
    if (log_is_verbose) {
        console.log("[in-fs] wrote \"package.json\" to:", package_json_abs_path);
    }
    if (log_is_verbose) {
        console.log("[in-fs] wrote \"tsconfig.json\" to:", tsconfig_json_asb_path);
    }
    const node_project_temp_files = {
        dir: pathResolve(abs_deno_dir),
        files: [package_json_abs_path, tsconfig_json_asb_path],
        cleanup: async () => {
            if (!dryrun) {
                await dntShim.Deno.remove(package_json_abs_path);
                await dntShim.Deno.remove(tsconfig_json_asb_path);
            }
            if (log_is_verbose) {
                console.log("[in-fs] deleted \"package.json\" at:", package_json_abs_path);
            }
            if (log_is_verbose) {
                console.log("[in-fs] deleted \"tsconfig.json\" at:", tsconfig_json_asb_path);
            }
        },
    };
    // generating a custom css file is requested
    let custom_css_temp_files;
    if (css) {
        const temp_dir = pathResolve(abs_deno_dir, "temp"), file_path = pathResolve(temp_dir, "custom.css");
        if (log_is_verbose) {
            console.log("[in-fs] generating a \"custom.css\" file for rendered html at:", file_path);
        }
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
                if (log_is_verbose) {
                    console.log("[in-fs] deleted \"custom.css\" at:", file_path);
                }
            }
        };
    }
    // time to run the `typedoc` documentation generator
    if (log_is_verbose) {
        console.log("[in-fs] emptying your docs-build directory:", abs_dir);
    }
    if (!dryrun) {
        await emptyDir(dir);
    }
    const { exports, repository } = await getDenoJson(deno), repo_url = gitRepositoryToUrl(repository?.url ?? "git+https://github.com/404/404.git"), site_root_path = trimSlashes(site ?? (repository?.url ? gitRepositoryToPagesUrl(repository.url).pathname : "")), { ".": mainEntrypoint = undefined, ...subEntrypoints } = typeof exports === "string"
        ? { ".": exports }
        : exports, entryPoints = [...(mainEntrypoint ? [mainEntrypoint] : []), ...Object.values(subEntrypoints)];
    if (log_is_verbose) {
        console.log("[in-memory] bootstrapping TypeDoc");
    }
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
    });
    if (log_is_basic) {
        console.log("[in-memory] generating TypeDoc documents in-memory.");
    }
    const typedoc_project = await typedoc_app.convert();
    if (log_is_basic) {
        console.log("[in-fs] rendering TypeDoc documents to html and outputting to:", abs_dir);
    }
    if (typedoc_project === undefined) {
        console.log("TypeDoc doument parsing failed");
    }
    if (!dryrun && typedoc_project) {
        await typedoc_app.generateDocs(typedoc_project, dir);
    }
    // creating new text files and copying over files to the destination `dir` folder.
    await copyAndCreateFiles({ dir, deno, copy, text, log, dryrun });
    // clean up temporary files if `preserveTemporary` is false
    if (!preserveTemporary) {
        await node_project_temp_files.cleanup();
        await custom_css_temp_files?.cleanup();
    }
    return {
        dir: abs_dir,
        files: [],
        cleanup: async () => {
            if (log_is_basic) {
                console.log("[in-fs] deleting your docs-build directory:", abs_dir);
            }
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
