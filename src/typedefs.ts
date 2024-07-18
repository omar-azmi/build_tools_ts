/** this module contains type definitions used internally by this package.
 * 
 * @module
*/

import type { PackageJson, dntBuildOptions } from "./deps.ts"
import type { DenoConfigurationFileSchema } from "./types/deno_json.ts"
export type { PackageJson, dntBuildOptions } from "./deps.ts"

/** this is the json schema used for the "deno.json" configuration file. <br>
 * it has been extended to require the `name` and `version` entries, as they are required by "package.json" when converting a deno project to a node project. <br>
 * in addition, the non-standard `repository` and `bugs` optional entries have been added, since they're also useful when publishing your package on "npmjs.com".
 * 
 * the json schema was originally taken from [deno's official config schema file](https://github.com/denoland/deno/blob/v1.44.4/cli/schemas/config-file.v1.json),
 * and then converted to typescript via an [online converter](https://app.quicktype.io/).
*/
export interface DenoJson extends DenoConfigurationFileSchema {
	name: string
	version: string
	exports: string | ExportsWithMain
	repository?: {
		type: string
		url: string
	}
	bugs?: {
		url: string
	}
	packageJson?: Partial<PackageJson>
}

/** you must have a main export (i.e. `key = "."`) in your "deno.json", when converting your deno project to a node project via the provided `jsr:@oazmi/build-tools/npm` conversion tool. */
export interface ExportsWithMain {
	".": string
	[alias: string]: string
}

/** the json schema for a "tsconfig.json" typescript configuration file. */
export interface TsConfigJson {
	compilerOptions: dntBuildOptions["compilerOptions"]
}

/** any artifacts created by a process in this package, can be cleaned up (deleted) later on by calling the {@link cleanup} function. */
export interface LeftoverArtifacts {
	cleanup: () => Promise<void>
}

/** an extension of {@link LeftoverArtifacts}, with additional meta data for the user to examine. */
export interface TemporaryFiles extends LeftoverArtifacts {
	/** the root directory of where the temporary files exist */
	dir: string

	/** the temporary file paths, relative to the {@link dir | root directory}, which shall be deleted post operation. */
	files: string[]
}

/** the base configuration used by the `npm` and `docs` submodules for their building functions. */
export interface BaseBuildConfig {
	/** the desired output directory.
	 * if a relative path is provided, then it will be resolved as a path relative to Deno's current working directory. (which is generally where `deno.json` resides.)
	*/
	dir: string

	/** the path to your `deno.json` file for this project.
	 * if a relative path is provided, then it will be resolved as a path relative to Deno's current working directory. (which is also where `deno.json`  generally resides.)
	 * 
	 * @defaultValue `"./deno.json"`
	*/
	deno: string

	/** a list of paths/glob patterns relative to the {@link deno | `deno.json`} directory,
	 * that should be copied over to the {@link dir | `build`} directory, at the specified path.
	 * note that if the source is a glob pattern, then its destination can only be a folder.
	 * moreover, folder sources and destinations must always end in a trailing slash (i.e. `"./path/to/my/folder/"`)
	 * 
	 * > [!CAUTION]
	 * > be cautious with using glob patterns with folders, as it will generally give you a bad unexpected output.
	 * > when using glob patterns, make sure to execute a {@link dryrun | `dryrun`} of the build process with {@link log | "verbose" logging}, to ensure that you are getting your desired copy paths.
	*/
	copy?: Array<[source: string, destination: string]>

	/** write (or append) additional text files to the output {@link dir | `build`} directory, at the specified relative destination.
	 * use the 3rd `options` item to specify text {@link Deno.WriteFileOptions | writing options}, such as `"append"` the new text, or permit the creation (`"create"`) of new file if it doesn't exist, etc...
	*/
	text?: Array<[destination: string, content: string | ReadableStream<string>, options?: Deno.WriteFileOptions]>

	/** select logging level:
	 * - `undefined` or `"none"`: skip logging (`dnt` itself will still log).
	 * - `"basic"`: log what is being carried out at the top level.
	 * - `"verbose"`: in addition to basic logging, it also logs which files/folders are being copied or generated.
	*/
	log?: "none" | "basic" | "verbose"

	/** enable `dryrun` if you wish for nothing to be written onto the the filesystem.
	 * 
	 * @defaultValue `false`
	*/
	dryrun?: boolean
}
