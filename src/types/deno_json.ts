/** this module consists of type definitions for the `deno.json` configuration file.
 * it is for internal use, and probably irrelevant to the end-user.
 * 
 * @module
*/

/** the json schema for `deno.json` deno configuration file. <br>
 * taken from [deno's official config schema](https://github.com/denoland/deno/blob/v1.44.4/cli/schemas/config-file.v1.json),
 * and converted to typescript via an [online converter](https://app.quicktype.io/).
*/
export interface DenoConfigurationFileSchema {
	/** Configuration for deno bench */
	bench?: Bench
	/** Instructs the TypeScript compiler how to compile .ts files. */
	compilerOptions?: CompilerOptions
	/** List of files, directories or globs that will be ignored by all other configurations.
	 * Requires Deno 1.34 or later. */
	exclude?: string[]
	exports?: Exports
	/** Configuration for formatter */
	fmt?: Fmt
	/** The location of an import map to be used when resolving modules.
	 * If an import map is specified as an `--importmap` flag or using "imports" and "scopes" properties, they will override this value.
	*/
	importMap?: string
	/** A map of specifiers to their remapped specifiers. */
	imports?: {
		/** The key is the specifier or partial specifier to match, with a value that represents the target specifier. */
		[alias: string]: string
	}
	/** Configuration for linter */
	lint?: Lint
	/** Whether to use a lock file or the path to use for the lock file. Can be overridden by CLI arguments. */
	lock?: Lock
	/** The name of this JSR package. Must be scoped */
	name?: string
	/** Enables or disables the use of a local node_modules folder for npm packages.
	 * Alternatively, use the `--node-modules-dir` flag or override the config via `--node-modules-dir=false`. Requires Deno 1.34 or later.
	*/
	nodeModulesDir?: boolean
	/** Configuration for deno publish */
	publish?: Publish
	/** Define a scope which remaps a specifier in only a specified scope */
	scopes?: {
		/** A definition of a scoped remapping. */
		[key: string]: {
			/** The key is the specifier or partial specifier to match within the referring scope, with a value that represents the target specifier. */
			[key: string]: string
		}
	}
	/** Configuration for deno task */
	tasks?: Tasks
	/** Configuration for deno test */
	test?: Test
	/** List of unstable features to enable. */
	unstable?: string[]
	/** UNSTABLE: Enables or disables the use of a local vendor folder as a local cache for remote modules and node_modules folder for npm packages.
	 * Alternatively, use the `--vendor` flag or override the config via `--vendor=false`.
	 * Requires Deno 1.36.1 or later.
	*/
	vendor?: boolean
	/** The version of this JSR package. */
	version?: string
	/** The members of this workspace. */
	workspace?: string[]
	[property: string]: any
}

/** Configuration for deno bench */
interface Bench {
	/** List of files, directories or globs that will not be searched for benchmarks. */
	exclude?: string[]
	files?: BenchFiles
	/** List of files, directories or globs that will be searched for benchmarks. */
	include?: string[]
	// [property: string]: unknown
}

interface BenchFiles {
	/** List of files, directories or globs that will not be searched for benchmarks. */
	exclude?: string[]
	/** List of files, directories or globs that will be searched for benchmarks. */
	include?: string[]
	// [property: string]: unknown
}

/** Instructs the TypeScript compiler how to compile .ts files. */
interface CompilerOptions {
	/** Allow JavaScript files to be a part of your program. Use the `checkJS` option to get errors from these files. */
	allowJS?: boolean
	/** Disable error reporting for unreachable code. */
	allowUnreachableCode?: boolean
	/** Disable error reporting for unused labels. */
	allowUnusedLabels?: boolean
	/** Enable error reporting in type-checked JavaScript files. */
	checkJS?: boolean
	/** Differentiate between undefined and not present when type checking */
	exactOptionalPropertyTypes?: boolean
	/** Enable experimental support for TC39 stage 2 draft decorators. */
	experimentalDecorators?: boolean
	/** Specify what JSX code is generated. */
	jsx?: Jsx
	/** Specify the JSX factory function used when targeting React JSX emit, e.g. 'React.createElement' or 'h' */
	jsxFactory?: string
	/** Specify the JSX Fragment reference used for fragments when targeting React JSX emit e.g.
	 * 'React.Fragment' or 'Fragment'. */
	jsxFragmentFactory?: string
	/** Specify module specifier used to import the JSX factory functions when using jsx:
	 * 'react-jsx*'. */
	jsxImportSource?: string
	/** Specify module specifier used to import the types for the JSX factory functions when using jsx: 'react-jsx*'.
	 * This is the logical equivalent of prefixing an import to the jsxImportSource with `// @deno-types="..."`.
	*/
	jsxImportSourceTypes?: string
	/** Specify list of elements that should be exempt from being precompiled when the jsx 'precompile' transform is used. */
	jsxPrecompileSkipElements?: string[]
	/** Make keyof only return strings instead of string, numbers or symbols. Legacy option. */
	keyofStringsOnly?: boolean
	/** Specify a set of bundled library declaration files that describe the target runtime environment. */
	lib?: string[]
	/** Do not truncate error messages. */
	noErrorTruncation?: boolean
	/** Enable error reporting for fallthrough cases in switch statements. */
	noFallthroughCasesInSwitch?: boolean
	/** Enable error reporting for expressions and declarations with an implied `any` type.. */
	noImplicitAny?: boolean
	/** Ensure overriding members in derived classes are marked with an override modifier. */
	noImplicitOverride?: boolean
	/** Enable error reporting for codepaths that do not explicitly return in a function. */
	noImplicitReturns?: boolean
	/** Enable error reporting when `this` is given the type `any`. */
	noImplicitThis?: boolean
	/** Disable adding 'use strict' directives in emitted JavaScript files. */
	noImplicitUseStrict?: boolean
	/** Disable strict checking of generic signatures in function types. */
	noStrictGenericChecks?: boolean
	/** Add `undefined` to a type when accessed using an index. */
	noUncheckedIndexedAccess?: boolean
	/** Enable error reporting when a local variables aren't read. */
	noUnusedLocals?: boolean
	/** Raise an error when a function parameter isn't read */
	noUnusedParameters?: boolean
	/** Enable all strict type checking options. */
	strict?: boolean
	/** Check that the arguments for `bind`, `call`, and `apply` methods match the original function. */
	strictBindCallApply?: boolean
	/** When assigning functions, check to ensure parameters and the return values are subtype-compatible. */
	strictFunctionTypes?: boolean
	/** When type checking, take into account `null` and `undefined`. */
	strictNullChecks?: boolean
	/** Check for class properties that are declared but not set in the constructor. */
	strictPropertyInitialization?: boolean
	/** Disable reporting of excess property errors during the creation of object literals. */
	suppressExcessPropertyErrors?: boolean
	/** Suppress `noImplicitAny` errors when indexing objects that lack index signatures. */
	suppressImplicitAnyIndexErrors?: boolean
	// [property: string]: unknown
}

/** Specify what JSX code is generated. */
type Jsx =
	| "precompile"
	| "preserve"
	| "react"
	| "react-jsx"
	| "react-jsxdev"
	| "react-native"

type Exports = string | {
	/** export aliases must follow the regex "^\.(/.*)?$" */
	[alias: string]: string
}

/** Configuration for formatter */
interface Fmt {
	/** List of files, directories or globs that will not be formatted. */
	exclude?: string[]
	files?: FmtFiles
	/** List of files, directories or globs that will be formatted. */
	include?: string[]
	/** The number of characters for an indent. */
	indentWidth?: number
	/** The width of a line the printer will try to stay under.
	 * Note that the printer may exceed this width in certain cases.
	*/
	lineWidth?: number
	options?: Options
	/** Define how prose should be wrapped in Markdown files. */
	proseWrap?: ProseWrap
	/** Whether to prefer using semicolons. */
	semiColons?: boolean
	/** Whether to use single quote (true) or double quote (false) for quotation. */
	singleQuote?: boolean
	/** Whether to use tabs (true) or spaces (false) for indentation. */
	useTabs?: boolean
	// [property: string]: unknown
}

interface FmtFiles {
	/** List of files, directories or globs that will not be formatted. */
	exclude?: string[]
	/** List of files, directories or globs that will be formatted. */
	include?: string[]
	[property: string]: unknown
}

interface Options {
	/** The number of characters for an indent. */
	indentWidth?: number
	/** The width of a line the printer will try to stay under.
	 * Note that the printer may exceed this width in certain cases.
	*/
	lineWidth?: number
	/** Define how prose should be wrapped in Markdown files. */
	proseWrap?: ProseWrap
	/** Whether to prefer using semicolons. */
	semiColons?: boolean
	/** Whether to use single quote (true) or double quote (false) for quotation. */
	singleQuote?: boolean
	/** Whether to use tabs (true) or spaces (false) for indentation. */
	useTabs?: boolean
	// [property: string]: unknown
}

/** Define how prose should be wrapped in Markdown files. */
type ProseWrap =
	| "always"
	| "never"
	| "preserve"
	| string

/** Configuration for linter */
interface Lint {
	/** List of files, directories or globs that will not be linted. */
	exclude?: string[]
	files?: LintFiles
	/** List of files, directories or globs that will be linted. */
	include?: string[]
	/** The default report format to use when linting */
	report?: Report
	rules?: Rules
	// [property: string]: unknown
}

interface LintFiles {
	/** List of files, directories or globs that will not be linted. */
	exclude?: string[]
	/** List of files, directories or globs that will be linted. */
	include?: string[]
	// [property: string]: unknown
}

/** The default report format to use when linting */
type Report =
	| "compact"
	| "json"
	| "pretty"

interface Rules {
	/** List of rule names that will be excluded from configured tag sets. If the same rule is in `include` it will be run. */
	exclude?: string[]
	/** List of rule names that will be run. Even if the same rule is in `exclude` it will be run. */
	include?: string[]
	/** List of tag names that will be run. Empty list disables all tags and will only use rules from `include`. */
	tags?: string[]
	// [property: string]: unknown
}

/** Whether to use a lock file or the path to use for the lock file. Can be overridden by CLI arguments. */
type Lock = boolean | string

/** Configuration for deno publish */
interface Publish {
	/** List of files, directories or globs that will be excluded from the published package. */
	exclude?: string[]
	/** List of files, directories or globs that will be included in the published package. */
	include?: string[]
	// [property: string]: unknown
}

/** Configuration for deno task */
interface Tasks {
	/** Shell command to execute for this task name. */
	[task_name: string]: string
}

/** Configuration for deno test */
interface Test {
	/** List of files, directories or globs that will not be searched for tests. */
	exclude?: string[]
	files?: TestFiles
	/** List of files, directories or globs that will be searched for tests. */
	include?: string[]
	// [property: string]: unknown
}

interface TestFiles {
	/** List of files, directories or globs that will not be searched for tests. */
	exclude?: string[]
	/** List of files, directories or globs that will be searched for tests. */
	include?: string[]
	// [property: string]: unknown
}

