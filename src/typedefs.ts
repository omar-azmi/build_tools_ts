import type { PackageJson, dntBuildOptions } from "./deps.ts"
import type { DenoConfigurationFileSchema } from "./types/deno_json.ts"
export type { PackageJson, dntBuildOptions } from "./deps.ts"

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
	package_json?: Partial<PackageJson>
	nodePackageManager?: "npm" | "pnpm" | string
}

export interface ExportsWithMain {
	".": string
	[alias: string]: string
}

export interface TsConfigJson {
	compilerOptions: dntBuildOptions["compilerOptions"]
}


export interface LeftoverArtifacts {
	cleanup: () => Promise<void>
}

export interface TemporaryFiles extends LeftoverArtifacts {
	/** the root directory of where the temporary files exist */
	dir: string

	/** the temporary file paths, relative to the {@link dir | root directory}, which shall be deleted post operation. */
	files: string[]
}
