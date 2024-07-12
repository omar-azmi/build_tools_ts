/** type definitions used internally by this package. */

import type { PackageJson, dntBuildOptions } from "./deps.ts"
import type { DenoConfigurationFileSchema } from "./types/deno_json.ts"
export type { PackageJson, dntBuildOptions } from "./deps.ts"

/** this is the json schema used for the "deno.json" configuration file. <br>
 * it has been extended to require the `name` and `version` entries, as they are required by "package.json" when converting a deno project to a node project. <br>
 * in addition, the non-standard `repository` and `bugs` optional entries have been added, since they're also useful when publishing your package on "npmjs.com". <br>
 * finally, you can configure your deno-to-node project conversion parameters using the newly added `packageJson` and `nodePackageManager` entries.
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
	nodePackageManager?: "npm" | "pnpm" | string
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
