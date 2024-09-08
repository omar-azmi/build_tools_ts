/** this module contains common utility functions used by this package.
 *
 * @module
*/
import "./_dnt.polyfills.js";
import type { MaybePromise, PackageJson } from "./deps.js";
import type { BaseBuildConfig, DenoJson, TsConfigJson, WritableFileConfig } from "./typedefs.js";
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
export declare const getDenoJson: <DENO_JSON extends MaybePromise<DenoJson>>(deno_json_path?: string) => Promise<DENO_JSON>;
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
 * @param overrides provide additional overrides to apply to your output "package.json" like object.
 * @returns a "package.json" like javascript object.
*/
export declare const createPackageJson: (deno_json_path?: string, overrides?: Partial<PackageJson>) => Promise<PackageJson>;
/** create a "tsconfig.json" file, based on your "deno.json" configuration file.
 *
 * @param deno_json_path the path to your "deno.json" file. it could be either an absolute path, or a path relative to your current working directory (`Deno.cwd()`).
 * @param overrides provide additional overrides to apply to your output "tsconfig.json" like object.
 * @returns a "tsconfig.json" like javascript object.
*/
export declare const createTsConfigJson: (deno_json_path?: string, overrides?: Partial<TsConfigJson>) => Promise<{
    "$schema": string;
} & TsConfigJson>;
/** trim the leading slashes at the beginning of a string. */
export declare const trimStartSlashes: (str: string) => string;
/** trim the trailing slashes at the end of a string. */
export declare const trimEndSlashes: (str: string) => string;
/** trim leading and trailing slashes, at the beginning and end of a string. */
export declare const trimSlashes: (str: string) => string;
/** trim leading and trailing slashes, at the beginning and end of a string. */
export declare const trimDotSlashes: (str: string) => string;
/** join path segments with slashes in between. */
export declare const joinSlash: (...segments: string[]) => string;
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
export declare const gitRepositoryToUrl: (repo_git_url: string) => URL;
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
export declare const gitRepositoryToPagesUrl: (repo_git_url: string) => URL;
/** convert a glob string to a regex object. <br>
 * in this implementation, only the wildcards `"*"`, `"**"`, and the optional `"?"` is given meaning.
 * all else, including parenthesis, brackets, dots, and backslash, are escaped when being converted into a regex.
*/
export declare const globToRegex: (glob_pattern: string) => RegExp;
/** this function takes in your {@link BaseBuildConfig | generic config} object,
 * and figures out the files that need to be copied (specified in the {@link BaseBuildConfig.copy} field),
 * and the new text/binary files that need to be written (specified in the {@link BaseBuildConfig.text} field).
*/
export declare const copyAndCreateFiles: (config: BaseBuildConfig) => Promise<void>;
/** configuration options for {@link createFiles}.
 * there are only three configurable fields available: {@link dir}, {@link log}, and {@link dryrun}
*/
export interface CreateFilesConfig extends Pick<BaseBuildConfig, "dir" | "log" | "dryrun"> {
    [key: string]: any;
}
/** write a collection of virtual files to your filesystem.
 * this function accepts virtual files that are either in text (`string`), binary (`Uint8Array`), or streamable text/binary (`ReadableStream<string | Uint8Array>`) formats.
 * it is important that you provide the configuration parameter's {@link config["dir"] | `dir`} field, so that relative paths can be resolved according to the provided directory.
*/
export declare const createFiles: (input_files: Array<WritableFileConfig>, config: CreateFilesConfig) => Promise<void>;
//# sourceMappingURL=funcdefs.d.ts.map