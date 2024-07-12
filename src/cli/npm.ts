/** this is a cli tool for transforming your deno project to a node project using [`dnt`](https://jsr.io/@deno/dnt) under the hood. <br>
 * this tool reads your "deno.json" file to figure out most of what needs to be transformed, and comes with a handful of useful preset configurations, so that you won't have to write lengthy cli args. <br>
 * take a look at {@link CliArgs} and {@link CliConfigJson} to see what configuration options are available. <br>
 * moreover, to use this transformer via javascript instead of the shell, use the {@link buildNpm} function from [`npm.ts` file](../npm.ts) (or [`jsr:@oazmi/build-tools/npm`](https://jsr.io/@oazmi/build-tools) if using jsr).
 * 
 * @module
*/

import { buildNpm, type BuildNpmConfig } from "../npm.ts"
import { parseArgs } from "./deps.ts"

/** the cli args for transforming your deno project to a node based project via the {@link buildNpm} function. */
export interface CliArgs {
	/** {@inheritDoc BuildNpmConfig.dir} */
	dir?: BuildNpmConfig["dir"]

	/** {@inheritdoc BuildNpmConfig.deno} */
	deno?: BuildNpmConfig["deno"]

	/** {@inheritdoc BuildNpmConfig.log} */
	log?: boolean | BuildNpmConfig["log"]

	/** {@inheritdoc BuildNpmConfig.dryrun} */
	dryrun?: BuildNpmConfig["dryrun"]

	/** should `npm install` be invoked after the node project's creation? */
	install?: NonNullable<BuildNpmConfig["dnt"]>["skipNpmInstall"]

	/** a path to an npm-build configuration json file that provides additional modifiable parameters.
	 * see {@link CliConfigJson} for more details on the available extended configurations.
	 * in case there is a contradiction between the {@link CliConfigJson} setting and the current cli args, the cli arg will take precedence.
	*/
	config?: string
}

/** a configuration json file path can be passed with the `--config` switch in the {@link CliArgs} */
export interface CliConfigJson extends Omit<CliArgs, "config"> {
	/** {@inheritdoc BuildNpmConfig.copy} */
	copy?: BuildNpmConfig["copy"]

	/** {@inheritdoc BuildNpmConfig.text} */
	text?: BuildNpmConfig["text"]

	/** {@inheritdoc BuildNpmConfig.dnt} */
	dnt?: BuildNpmConfig["dnt"]
}

const cli_args = parseArgs(Deno.args) as CliArgs
const { config: config_path, ...rest_cli_args } = cli_args
const config_file: CliConfigJson = config_path
	? JSON.parse(await Deno.readTextFile(config_path))
	: {}
const { install, log = false, ...combined_config } = { ...config_file, ...rest_cli_args }
if (install) { (combined_config.dnt ??= {}).skipNpmInstall = false }

const config: Partial<BuildNpmConfig> = {
	...combined_config,
	log: (log === false ? undefined
		: (log === true ? "basic" : log)
	),
}

const artifacts_info = await buildNpm(config)
