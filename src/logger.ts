/** a module for simplifying logging with a global state.
 * intended mostly for internal use.
 * 
 * @module
*/

import type { BaseBuildConfig } from "./typedefs.js"


export type LogLevel = Exclude<NonNullable<BaseBuildConfig["log"]>, boolean>

export interface LogConfig {
	log?: BaseBuildConfig["log"]
	[ignored_props: string]: any
}

// there are three logging level:
// "none": `log_is_basic` and `log_is_verbose` are both `false` => no logging occurs
// "basic": `log_is_basic` is `true` but `log_is_verbose` is `false` => basic logging occurs
// "verbose": `log_is_basic` and `log_is_verbose` are both `true` => basic logging + verbose logging occurs
let
	log_level: LogLevel = "basic",
	log_is_basic: boolean = true,
	log_is_verbose: boolean = false

export const {
	assert: console_assert,
	clear: console_clear,
	debug: console_debug,
	dir: console_dir,
	error: console_error,
	log: console_log,
	table: console_table,
	warn: console_warn,
} = console

/** set the logging to a certain level.
 * the value passed to this function affects the logging behavior of the {@link logBasic} and {@link logVerbose} functions.
 * 
 * possible options:
 * - `{ log: undefined }`: logging level is unchanged. by default, it starts with `"basic"`.
 * - `{ log: "none" }`: no logging occurs (neither {@link logBasic} nor {@link logVerbose} print anything).
 * - `{ log: "basic" }`: basic logging occurs ({@link logBasic} prints, but {@link logVerbose} does not print).
 * - `{ log: "verbose" }`: basic logging + verbose logging occurs ({both @link logBasic} and {@link logVerbose} print).
*/
export const setLog = (config: LogConfig): void => {
	const { log } = config
	if (log || log === false) {
		log_level = typeof log === "string"
			? log
			: log ? "basic" : "none"
		log_is_verbose = log_level === "verbose"
		log_is_basic = log_is_verbose || log_level === "basic"
	}
}

export const
	logBasic = (...data: any[]): void => {
		if (log_is_basic) { console_log(...data) }
	},
	logVerbose = (...data: any[]): void => {
		if (log_is_verbose) { console_log(...data) }
	}
