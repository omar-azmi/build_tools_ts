/** this is a cli tool for generating a documentation site for your deno project, using [`typedoc`](https://github.com/TypeStrong/typedoc) under the hood. <br>
 * this tool reads your "deno.json" file and generates a equivalent "package.json" and "tsconfig.json" files, which can then be used by `TypeDoc` for generating the documentation site's html files.
 * this tool comes with a handful of useful preset configurations, so that you won't have to write lengthy cli args. <br>
 * take a look at {@link CliArgs} and {@link CliConfigJson} to see what configuration options are available. <br>
 * moreover, to use this document generator via javascript instead of the shell, use the {@link builDocs} function from the [`docs.ts` file](../docs.ts) (or [`jsr:@oazmi/build-tools/docs`](https://jsr.io/@oazmi/build-tools) if using jsr).
 * 
 * @module
*/

import { buildDocs, type BuildDocsConfig } from "../docs.ts"
import { parseArgs } from "./deps.ts"

/** the cli args for transforming your deno project to a node based project via the {@link buildNpm} function. */
export interface CliArgs {
	/** {@inheritDoc BuildDocsConfig.dir} */
	dir?: BuildDocsConfig["dir"]

	/** {@inheritdoc BuildDocsConfig.deno} */
	deno?: BuildDocsConfig["deno"]

	/** {@inheritdoc BuildDocsConfig.log} */
	log?: boolean | BuildDocsConfig["log"]

	/** {@inheritdoc BuildDocsConfig.dryrun} */
	dryrun?: BuildDocsConfig["dryrun"]

	/** {@inheritdoc BuildDocsConfig.site} */
	site?: BuildDocsConfig["site"]

	/** {@inheritdoc BuildDocsConfig.preserveTemporary} */
	preserveTemporary?: BuildDocsConfig["preserveTemporary"]

	/** a path to an docs-build configuration json file that provides additional modifiable parameters.
	 * see {@link CliConfigJson} for more details on the available extended configurations.
	 * in case there is a contradiction between the {@link CliConfigJson} setting and the current cli args, the cli arg will take precedence.
	*/
	config?: string
}

/** a configuration json file path can be passed with the `--config` switch in the {@link CliArgs}. */
export interface CliConfigJson extends Omit<CliArgs, "config"> {
	/** {@inheritdoc BuildDocsConfig.copy} */
	copy?: BuildDocsConfig["copy"]

	/** {@inheritdoc BuildDocsConfig.text} */
	text?: BuildDocsConfig["text"]

	/** {@inheritdoc BuildDocsConfig.css} */
	css?: BuildDocsConfig["css"]

	/** {@inheritdoc BuildDocsConfig.typedoc} */
	typedoc?: BuildDocsConfig["typedoc"]
}

const cli_args = parseArgs(Deno.args) as CliArgs
const { config: config_path, ...rest_cli_args } = cli_args
const config_file: CliConfigJson = config_path
	? JSON.parse(await Deno.readTextFile(config_path))
	: {}
const { log = false, ...combined_config } = { ...config_file, ...rest_cli_args }

const config: Partial<BuildDocsConfig> = {
	...combined_config,
	log: (log === false ? undefined
		: (log === true ? "basic" : log)
	),
}

const artifacts_info = await buildDocs(config)
