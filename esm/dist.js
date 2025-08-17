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
 * 	// when no input files are provided, the function reads your "deno.json" file to use its "exports" field as the input.
 * 	input: {
 * 		"my-lib.js": "./src/mod.ts",
 * 		"plugins/hello.js": "./src/plugins/hello.ts",
 * 		"plugins/world.js": "./src/plugins/world.ts",
 * 	},
 * 	deno: "./deno.json",
 * 	dir: "./dist/",
 * 	log: "verbose",
 * 	esbuild: { splitting: true }
 * })
 * const minified_files = await transform(bundled_files, [{}])
 * await createFiles(minified_files, {
 * 	dir: "./dist/", // this information is not really needed, as the file paths in `minified_files` are absolute.
 * 	dryrun: false,
 * 	log: "verbose",
 * })
 * // your output files are now saved to: "./dist/my-lib.js", "./dist/plugins/hello.js", and "./dist/plugins/world.js"
 *
 * // it is important that you stop esbuild manually, otherwise the deno process will not quit automatically.
 * await esStop()
 * ```
 *
 * @module
*/
import * as dntShim from "./_dnt.shims.js";
import { denoPlugins } from "./deps/jsr.io/@oazmi/esbuild-plugin-deno/0.4.4/src/mod.js";
import { build as esBuild, stop as esStop, transform as esTransform, } from "esbuild";
import { defaultStopwatch, emptyDir, encodeText, globToRegExp, object_values, pathResolve } from "./deps.js";
import { copyAndCreateFiles, getDenoJson } from "./funcdefs.js";
import { logBasic, logVerbose, setLog } from "./logger.js";
export { denoPlugins } from "./deps/jsr.io/@oazmi/esbuild-plugin-deno/0.4.4/src/mod.js";
export { build as esBuild, stop as esStop, transform as esTransform } from "esbuild";
const defaultBundleConfig = {
    dir: "./dist/",
    deno: "./deno.json",
};
const defaultBuildDistConfig = {
    dir: "./dist/",
    deno: "./deno.json",
};
const defaultTransformationConfig = {
    pattern: "**/*.js",
    loader: "js",
    options: {
        minify: true,
        platform: "browser",
        format: "esm",
        target: "esnext",
    }
};
// TODO: move this function to `/src/funcdefs.ts` if the other modules also accept user-customizable inputs.
// TODO: move the `BundleConfig.input` field to `BaseBuildConfig` if the other modules also begin to accept alternate inputs different from the one in "deno.json".
const parse_entry_points = async (deno, input) => {
    input ??= undefined;
    if (input) {
        return typeof input === "string" ? [input] : input;
    }
    input = (await getDenoJson(deno)).exports ?? {};
    return typeof input === "string"
        ? [input]
        // we treat `input`s from our `deno.json`'s `exports` field differently, because it is customary to not include the extension part of the exported module,
        // but it is required by esbuild in the output's file name. thus we simply convert the exports dictionary to an array to let esbuild name the exports itself.
        : object_values(input);
};
/** this function bundles your deno-project's {@link DenoJson.exports | exports} in-memory, using the blazing fast [`esbuild`](https://github.com/evanw/esbuild) bundler,
 * along with the useful [`@oazmi/esbuild-plugin-deno`](https://jsr.io/@oazmi/esbuild-plugin-deno) default plugin. <br>
 * the output of this function is an array of {@link WritableFileConfig}, consisting of the destination path and the content of the bundled javascript/css code (as a binary `Uint8Array`).
 *
 * by default, this function reads your "deno.json" file's {@link DenoJson.exports | exports field},
 * but you can manually modify the `entryPoints` by specifying them in the {@link bundle_config | configuration's} `esbuild.entryPoints` field. <br>
 * take a look at {@link BundleConfig} to see what configuration options are available. <br>
*/
export const bundle = async (bundle_config = {}) => {
    setLog(bundle_config);
    const { dir, deno, input, esbuild = {}, plugins: _plugins, stop = false } = { ...defaultBundleConfig, ...bundle_config }, abs_dir = pathResolve(dir), abs_deno = pathResolve(deno), entryPoints = await parse_entry_points(deno, input), plugins = _plugins ?? denoPlugins({
        scanAncestralWorkspaces: true,
        autoInstall: "auto-cli",
        initialPluginData: { runtimePackage: abs_deno },
    });
    logVerbose("current dist-bundle configuration (excluding \"input\" and \"plugins\") is:", { dir, deno, esbuild, stop });
    logVerbose("bundling the following entry-points:", entryPoints);
    defaultStopwatch.push();
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
    });
    logBasic("bundling time:", defaultStopwatch.popDelta(), "ms");
    if (stop) {
        await esStop();
    }
    return bundled_code.outputFiles.map(({ path, contents }) => {
        return [path, contents];
    });
};
/** this function bundles your deno-project's {@link DenoJson.exports | exports} and outputs to your configuration's {@link build_config["dir"] | `dir`} directory on your filesystem.
 * under the hood, it uses the blazing fast [`esbuild`](https://github.com/evanw/esbuild) tool for bundling and for its native filesystem writing capabilities.
 *
 * by default, this function reads your "deno.json" file's {@link DenoJson.exports | exports field},
 * but you can manually modify the `entryPoints` by specifying them in the {@link bundle_config | configuration's} `esbuild.entryPoints` field. <br>
 * take a look at {@link BuildDistConfig} to see what configuration options are available. <br>
*/
export const buildDist = async (build_config) => {
    setLog(build_config);
    const { dir, deno, input, esbuild = {}, plugins: _plugins, stop = true, copy = [], text = [], dryrun = false } = { ...defaultBuildDistConfig, ...build_config }, abs_dir = pathResolve(dir), abs_deno = pathResolve(deno), entryPoints = await parse_entry_points(deno, input), plugins = _plugins ?? denoPlugins({
        scanAncestralWorkspaces: true,
        autoInstall: "auto-cli",
        initialPluginData: { runtimePackage: abs_deno },
    });
    defaultStopwatch.push();
    logVerbose("current dist-build configuration (excluding \"input\" and \"plugins\") is:", { dir, deno, esbuild, stop, copy, text, dryrun });
    logVerbose("bundling the following entry-points:", entryPoints);
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
        write: !dryrun,
    });
    logBasic("bundling time:", defaultStopwatch.popDelta(), "ms");
    if (stop) {
        await esStop();
    }
    await copyAndCreateFiles({ dir, deno, copy, text, dryrun });
    return {
        dir: abs_dir,
        files: [],
        cleanup: async () => {
            logBasic("[in-fs] deleting your distribution-build directory:", abs_dir);
            if (dryrun) {
                return;
            }
            await emptyDir(abs_dir);
            await dntShim.Deno.remove(abs_dir);
        }
    };
};
const parsePathPatternMatching = (pattern) => {
    pattern ??= undefined;
    switch (typeof pattern) {
        case "function": {
            return pattern;
        }
        case "undefined": {
            return (() => true);
        }
        case "object": {
            return (file_path) => pattern.test(file_path);
        }
        case "string": {
            return parsePathPatternMatching(globToRegExp(pattern));
        }
    }
};
/** apply additional transformations onto your {@link BundleOutput | virtual files}.
 * this is especially useful when you wish to further minify a bundled javascript output (double minification).
*/
export const transform = async (input_files, transformation_configs) => {
    input_files = await input_files;
    const transformations = transformation_configs.map((config) => {
        const { loader, options, pattern } = { ...defaultTransformationConfig, ...config }, pattern_fn = parsePathPatternMatching(pattern);
        return {
            test: pattern_fn,
            options: { ...options, loader }
        };
    });
    defaultStopwatch.push();
    const transformed_files = await Promise.all(input_files.map(async ([path, content], file_number) => {
        for (const { test, options } of transformations) {
            const new_file_name = test(path);
            if (new_file_name) {
                const results = await esTransform(content, options), new_content = encodeText(results.code), new_path = typeof new_file_name === "string" ? new_file_name : path;
                logVerbose(`- transformed file: ${file_number}`, "\n\t", `change in output path: "${path}" -> "${new_path}"`, "\n\t", `change in binary size: "${content.byteLength / 1024} kb" -> "${new_content.byteLength / 1024} kb"`);
                content = new_content;
                path = new_path;
            }
        }
        return [path, content];
    }));
    logBasic("transformation time:", defaultStopwatch.popDelta(), "ms");
    return transformed_files;
};
