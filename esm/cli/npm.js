/** this is a cli tool for transforming your deno project to a node project using [`dnt`](https://jsr.io/@deno/dnt) under the hood. <br>
 * this tool reads your "deno.json" file to figure out most of what needs to be transformed, and comes with a handful of useful preset configurations, so that you won't have to write lengthy cli args. <br>
 * take a look at {@link CliArgs} and {@link CliConfigJson} to see what configuration options are available. <br>
 * moreover, to use this transformer via javascript instead of the shell, use the {@link buildNpmFn | buildNpm} function from [`npm.ts` file](../npm.ts) (or [`jsr:@oazmi/build-tools/npm`](https://jsr.io/@oazmi/build-tools) if using jsr).
 *
 * @module
*/
import "../_dnt.polyfills.js";
import * as dntShim from "../_dnt.shims.js";
import { buildNpm as buildNpmFn } from "../npm.js";
import { parseArgs } from "./deps.js";
const cli_args = parseArgs(dntShim.Deno.args);
const { config: config_path, ...rest_cli_args } = cli_args;
const config_file = config_path
    ? JSON.parse(await dntShim.Deno.readTextFile(config_path))
    : {};
const { install, log = false, ...combined_config } = { ...config_file.buildNpm, ...rest_cli_args };
const dnt = (combined_config.dnt ??= {});
dnt.skipNpmInstall ??= (install ? false : true);
if (typeof install === "string") {
    dnt.packageManager = install;
}
const config = {
    ...combined_config,
    log: (log === false ? undefined
        : (log === true ? "basic" : log)),
};
const artifacts_info = await buildNpmFn(config);
