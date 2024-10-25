/** the {@link buildNpm} function in this module provides way for you to transform your deno-project to a node-project, using [`dnt`](https://jsr.io/@deno/dnt) under the hood. <br>
 * this tool reads your "deno.json" file to figure out most of what needs to be transformed, and comes with a handful of useful preset configurations. <br>
 * take a look at {@link BuildNpmConfig} to see what configuration options are available. <br>
 * moreover, to use this transformer via cli, use the [`./cli/npm.ts`](./cli/npm.ts) script file (or [`jsr:@oazmi/build-tools/cli/npm`](https://jsr.io/@oazmi/build-tools) if using jsr), and take a look at its {@link CliArgs} for list of supported cli args.
 *
 * @module
*/
import "./_dnt.polyfills.js";
import { type BuildOptions as DntBuildOptions } from "./deps/jsr.io/@deno/dnt/0.41.3/mod.js";
import type { BaseBuildConfig, TemporaryFiles } from "./typedefs.js";
/** the configuration for the npm-release building function {@link buildNpm}. */
export interface BuildNpmConfig extends BaseBuildConfig {
    /** the path to the folder where you wish to create your npm release.
     * if a relative path is provided, then it will be resolved as a path relative to Deno's current working directory. (which is generally where `deno.json` resides.)
     *
     * @defaultValue `"./npm/"`
    */
    dir: string;
    /** [`dnt`](https://jsr.io/@deno/dnt) related additional build options for you to configure. */
    dnt?: Omit<Partial<DntBuildOptions>, "entryPoints" | "outDir" | "scriptModule">;
}
/** the default configuration used by the {@link buildNpm} function, for missing/unprovided configuration fields. */
export declare const defaultBuildNpmConfig: BuildNpmConfig;
/** this function transforms your deno-project to a node-project, using [`dnt`](https://jsr.io/@deno/dnt) under the hood.
 * this function reads your "deno.json" file to figure out most of what needs to be transformed, and comes with a handful of useful preset configurations. <br>
 * take a look at {@link BuildNpmConfig} to see what configuration options are available. <br>
 * moreover, to use this transformer via cli, use the [`./cli/npm.ts`](./cli/npm.ts) script file (or [`jsr:@oazmi/build-tools/cli/npm`](https://jsr.io/@oazmi/build-tools) if using jsr), and take a look at its {@link CliArgs} for list of supported cli args.
*/
export declare const buildNpm: (build_config?: Partial<BuildNpmConfig>) => Promise<TemporaryFiles>;
//# sourceMappingURL=npm.d.ts.map