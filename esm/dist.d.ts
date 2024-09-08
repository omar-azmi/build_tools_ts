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
 * const minified_files = await transform(bundled_files, [{}], "verbose")
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
import "./_dnt.polyfills.js";
import { type BuildOptions as EsBuildOptions, type TransformOptions as EsTransformOptions } from "esbuild";
import { type MaybePromise } from "./deps.js";
import type { BaseBuildConfig, TemporaryFiles } from "./typedefs.js";
export { build as esBuild, stop as esStop, transform as esTransform, type BuildOptions as EsBuildOptions, type OutputFile as EsOutputFile, type TransformOptions as EsTransformOptions } from "esbuild";
export { denoPlugins } from "./deps/jsr.io/@luca/esbuild-deno-loader/0.10.3/mod.js";
/** the configuration for in-memory bundling of your typescript code to javascript text, using the transformation function {@link bundle}. <br>
 * the {@link dir} you provide here shall point to a *virtual* path where you wish for your distribution files to exist.
*/
export interface BundleConfig extends BuildDistConfig {
    copy?: never;
    text?: never;
    dryrun?: never;
    esbuild?: Omit<Partial<EsBuildOptions>, "outdir" | "outfile" | "plugins" | "entryPoints" | "write">;
}
/** the configuration for the distribution-building function {@link buildDist}. */
export interface BuildDistConfig extends BaseBuildConfig {
    /** the path to the folder where you wish to create your distribution release.
     * if a relative path is provided, then it will be resolved as a path relative to Deno's current working directory. (which is generally where `deno.json` resides.)
     * the directory provided here will serve as esbuild configuration's {@link esbuild["outdir"] | `outdir` option}.
     *
     * @defaultValue `"./dist/"`
    */
    dir: string;
    /** the collection of files to compile. this option translates into esbuild's {@link EsBuildOptions.entryPoints | entryPoints} configuration field. <br>
     * if this is not provided, then the {@link DenoJson.exports | `exports` field} is used from your {@link deno | `deno.json`} as the entry points for esbuild.
     *
     * @defaultValue `undefined`, so that your `deno.json`'s `exports` are used as entry points.
    */
    input?: null | undefined | string | string[] | {
        [output_name: string]: string;
    };
    /** [`esbuild`](https://www.npmjs.com/package/esbuild) related additional build options for you to configure. <br>
     * note that `outdir` and `outfile` options are made unavailable, since they are controlled by your {@link dir} value. <br>
     * in addition, esbuild `plugins` must be configured via {@link plugins}.
    */
    esbuild?: Omit<Partial<EsBuildOptions>, "outdir" | "outfile" | "plugins" | "entryPoints">;
    /** apply a collection of optional [`esbuild`](https://www.npmjs.com/package/esbuild) plugins.
     *
     * @defaultValue {@link denoPlugins} (via [esbuild-deno-loader](https://jsr.io/@luca/esbuild-deno-loader))
    */
    plugins?: EsBuildOptions["plugins"];
    /** stop running esbuild's wasm-service after compilation?
     * booting up wasm takes a little while, so you'll want to turn this option to `false` if you are calling the {@link buildDist} function multiple times for multiple compilations.
     * on the other hand, it is good to stop the service on your very last compilation-run, as keeping the service alive results in prolonging the time it takes for deno to exit it process.
     * (at least this is how it was in the earlier releases of esbuild, but I do recall seeing a PR that supposedly addressed this issue)
     *
     * @defaultValue `false`
    */
    stop?: boolean;
}
/** a single configuration for the re-transformation function {@link transform}. */
export interface TransformationConfig {
    /** specify the output file-path capturing pattern for applying this transformation onto.
     * you have the ability to use a glob-string, or a regular expression (`RegExp`), or a function that returns `true` when the input file name is accepted.
     * if no pattern is provided, then all of your input im-memory files will be processed through this transformation.
     *
     * @defaultValue `undefined`
    */
    pattern?: null | undefined | string | RegExp | PathPatternMatchingFn;
    /** the `esbuild` loader to use for transforming the captured file's contents.
     * if nothing is provided, then it defaults to javascript (`"js"`).
     *
     * @defaultValue `"js"`
    */
    loader?: EsTransformOptions["loader"];
    /** specify additional `esbuild` transformer api options to configure. */
    options?: Omit<EsTransformOptions, "loader">;
}
/** a function, used by {@link TransformationConfig}, for testing if a certain file by the given `file_path` name should be transformed or not.
 * - if the function returns a `false`, then the file shall not be transformed.
 * - if the function returns a `true`, then the file will be transformed, and its name will remain the same as before (unchanged).
 * - if the function returns a `string`, then the file will be transformed, and it will be renamed to the output `string` of the function.
*/
export type PathPatternMatchingFn = (file_path: string) => boolean | string;
/** a virtual file is described as a tuple of its location/destination path name and its file contents as a `Uint8Array` binary. */
export type VirtualFileOutput = [destination: string, content: Uint8Array];
/** the {@link bundle} function's returned value is an array of virtual in-memory files. */
export type BundleOutput = Array<VirtualFileOutput>;
/** this function bundles your deno-project's {@link DenoJson.exports | exports} in-memory, using the blazing fast [`esbuild`](https://github.com/evanw/esbuild) bundler,
 * along with the useful [`esbuild-deno-loader`](https://jsr.io/@luca/esbuild-deno-loader) default plugin. <br>
 * the output of this function is an array of {@link WritableFileConfig}, consisting of the destination path and the content of the bundled javascript/css code (as a binary `Uint8Array`).
 *
 * by default, this function reads your "deno.json" file's {@link DenoJson.exports | exports field},
 * but you can manually modify the `entryPoints` by specifying them in the {@link bundle_config | configuration's} `esbuild.entryPoints` field. <br>
 * take a look at {@link BundleConfig} to see what configuration options are available. <br>
*/
export declare const bundle: (bundle_config?: Partial<BundleConfig>) => Promise<BundleOutput>;
/** this function bundles your deno-project's {@link DenoJson.exports | exports} and outputs to your configuration's {@link build_config["dir"] | `dir`} directory on your filesystem.
 * under the hood, it uses the blazing fast [`esbuild`](https://github.com/evanw/esbuild) tool for bundling and for its native filesystem writing capabilities.
 *
 * by default, this function reads your "deno.json" file's {@link DenoJson.exports | exports field},
 * but you can manually modify the `entryPoints` by specifying them in the {@link bundle_config | configuration's} `esbuild.entryPoints` field. <br>
 * take a look at {@link BuildDistConfig} to see what configuration options are available. <br>
*/
export declare const buildDist: (build_config: Partial<BuildDistConfig>) => Promise<TemporaryFiles>;
/** apply additional transformations onto your {@link BundleOutput | virtual files}.
 * this is especially useful when you wish to further minify a bundled javascript output (double minification).
*/
export declare const transform: (input_files: MaybePromise<BundleOutput>, transformation_configs: Array<TransformationConfig>, log?: BaseBuildConfig["log"]) => Promise<BundleOutput>;
//# sourceMappingURL=dist.d.ts.map