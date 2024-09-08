/** this is a cli tool for transforming your deno project to a node project using [`dnt`](https://jsr.io/@deno/dnt) under the hood. <br>
 * this tool reads your "deno.json" file to figure out most of what needs to be transformed, and comes with a handful of useful preset configurations, so that you won't have to write lengthy cli args. <br>
 * take a look at {@link CliArgs} and {@link CliConfigJson} to see what configuration options are available. <br>
 * moreover, to use this transformer via javascript instead of the shell, use the {@link buildNpmFn | buildNpm} function from [`npm.ts` file](../npm.ts) (or [`jsr:@oazmi/build-tools/npm`](https://jsr.io/@oazmi/build-tools) if using jsr).
 * 
 * @module
*/

import { buildNpm as buildNpmFn, type BuildNpmConfig } from "../npm.ts"
import { parseArgs } from "./deps.ts"


/** the cli args for transforming your deno project to a node based project via the {@link buildNpmFn | buildNpm} function. */
export interface CliArgs {
	/** {@inheritDoc BuildNpmConfig.dir} */
	dir?: BuildNpmConfig["dir"]

	/** {@inheritdoc BuildNpmConfig.deno} */
	deno?: BuildNpmConfig["deno"]

	/** {@inheritdoc BuildNpmConfig.log} */
	log?: boolean | BuildNpmConfig["log"]

	/** {@inheritdoc BuildNpmConfig.dryrun} */
	dryrun?: BuildNpmConfig["dryrun"]

	/** should `npm install` be invoked after the node project's creation?
	 * you could also specify the binary-name of the node-installer, such as `pnpm`, `npm`, `yarn`,
	 * or provide the binary's path if it is not available in the system-path, such as `~/.pnpm/pnpm` or `/usr/bin/npm`.
	 * - if you do specify the binary name, then the generated package will be installed.
	 * - if you specify this option as a `true` boolean, then the installation will default to using `npm` for installation.
	 * - if the you don't provide the `install` option, or leave it `false`, then no package installation will occur.
	 * 
	 * @defaultValue `false`
	*/
	install?: NonNullable<BuildNpmConfig["dnt"]>["skipNpmInstall"] | NonNullable<BuildNpmConfig["dnt"]>["packageManager"]

	/** a path to an npm-build configuration json file that provides additional modifiable parameters.
	 * see {@link CliConfigJson} for more details on the available extended configurations.
	 * in case there is a contradiction between the {@link CliConfigJson} setting and the current cli args, the cli arg will take precedence.
	*/
	config?: string
}

/** contains the relevant fields within the {@link CliConfigJson | configuration json file}, that are used for configuring the npm build of the project. */
export interface CliNpmConfig extends Omit<CliArgs, "config"> {
	/** {@inheritdoc BuildNpmConfig.copy} */
	copy?: BuildNpmConfig["copy"]

	/** {@inheritdoc BuildNpmConfig.text} */
	text?: BuildNpmConfig["text"]

	/** {@inheritdoc BuildNpmConfig.dnt} */
	dnt?: BuildNpmConfig["dnt"]
}

/** the schema of an npm-building configuration json file, which can be referenced in the {@link CliArgs}, by passing its file-path with the `--config` switch. <br>
 * notice that there is only one property named {@link buildNpm | `buildNpm`}, which then holds all of the relevant configuration (as specified in {@link CliNpmConfig}).
 * this is because doing so allows one to embed this configuration within other json files, such as "deno.json" itself, or a single dedicated configuration json file,
 * containing the configurations of different build tools altogether. <br>
 * in case there is a contradiction between the configurations in this json file and the current cli args, the cli arg will take precedence.
*/
export interface CliConfigJson {
	buildNpm?: CliNpmConfig
}

const cli_args = parseArgs(Deno.args) as CliArgs
const { config: config_path, ...rest_cli_args } = cli_args
const config_file: CliConfigJson = config_path
	? JSON.parse(await Deno.readTextFile(config_path))
	: {}
const { install, log = false, ...combined_config } = { ...config_file.buildNpm, ...rest_cli_args }
const dnt = (combined_config.dnt ??= {})
dnt.skipNpmInstall ??= (install ? false : true)
if (typeof install === "string") { dnt.packageManager = install }

const config: Partial<BuildNpmConfig> = {
	...combined_config,
	log: (log === false ? undefined
		: (log === true ? "basic" : log)
	),
}

const artifacts_info = await buildNpmFn(config)
