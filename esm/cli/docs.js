/** this is a cli tool for generating a documentation site for your deno project, using [`typedoc`](https://github.com/TypeStrong/typedoc) under the hood. <br>
 * this tool reads your "deno.json" file and generates a equivalent "package.json" and "tsconfig.json" files, which can then be used by `TypeDoc` for generating the documentation site's html files.
 * this tool comes with a handful of useful preset configurations, so that you won't have to write lengthy cli args. <br>
 * take a look at {@link CliArgs} and {@link CliConfigJson} to see what configuration options are available. <br>
 * moreover, to use this document generator via javascript instead of the shell, use the {@link buildDocsFn | buildDocs} function from the [`docs.ts` file](../docs.ts) (or [`jsr:@oazmi/build-tools/docs`](https://jsr.io/@oazmi/build-tools) if using jsr).
 *
 * @module
*/
import "../_dnt.polyfills.js";
import * as dntShim from "../_dnt.shims.js";
import { buildDocs as buildDocsFn } from "../docs.js";
import { setLog } from "../logger.js";
import { parseArgs } from "./deps.js";
const cli_args = parseArgs(dntShim.Deno.args);
const { config: config_path, ...rest_cli_args } = cli_args;
const config_file = config_path
    ? JSON.parse(await dntShim.Deno.readTextFile(config_path))
    : {};
const { log = false, ...config } = { ...config_file.buildDocs, ...rest_cli_args };
setLog({ log });
const artifacts_info = await buildDocsFn(config);
