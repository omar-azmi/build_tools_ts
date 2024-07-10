import type { MaybePromise, PackageJson } from "./deps.ts"
import { memorize, resolveUri } from "./deps.ts"
import type { DenoJson, TsConfigJson } from "./typedefs.ts"

const default_deno_json_path = "./deno.json" as const

const getDenoJson_FromUri = async (deno_json_path_uri: string) => {
	return (await import(deno_json_path_uri, { with: { type: "json" } })).default
}
const getDenoJson_FromUri_Memorized = memorize(getDenoJson_FromUri)

export const getDenoJson = async <DENO_JSON extends MaybePromise<DenoJson>>(deno_json_path: string = default_deno_json_path): Promise<DENO_JSON> => {
	return await getDenoJson_FromUri_Memorized(resolveUri(deno_json_path))
}

/** create a "package.json" nodejs-project file, based on your "deno.json" configuration file. <br>
 * the following required fields inside of your "deno.json" will get merged into the output:
 * - `name`, `version`
 * 
 * the following fields inside of your "deno.json" will get merged into the output:
 * - `description`, `author`, `license`, `repository`, `bugs`, and `exports`
 * 
 * the following field inside of your "deno.json" will get spread onto your output:
 * - `package_json`
 * 
 * note that if you use [dnt (deno-to-node)](https://jsr.io/@deno/dnt), then you will have to delete the `exports` property from the output, otherwise it will ruin/overwrite `dnt`'s output.
 * 
 * @param deno_json_path the path to your "deno.json" file. it could be either an absolute path, or a path relative to your current working directory (`Deno.cwd()`).
 * @param overrides provide additional overrides to apply to your output "package.json" like object.
 * @returns a "package.json" like javascript object.
*/
export const createPackageJson = async (deno_json_path: string = default_deno_json_path, overrides: Partial<PackageJson> = {}): Promise<PackageJson> => {
	const { name, version, description, author, license, repository, bugs, exports, package_json } = await getDenoJson(deno_json_path)
	return {
		name: name ?? "",
		version: version ?? "0.0.0",
		description, author, license, repository, bugs, exports,
		...package_json,
		...overrides
	}
}

export const createTsConfigJson = async (deno_json_path: string = default_deno_json_path, overrides: Partial<TsConfigJson> = {}): Promise<{ "$schema": string } & TsConfigJson> => {
	const
		{ compilerOptions = {} } = await getDenoJson(deno_json_path),
		{ compilerOptions: overridden_compilerOptions, ...rest_overrides } = overrides
	// remove "deno.ns" from compiler options, as it breaks `dnt` (I think)
	compilerOptions.lib = (compilerOptions.lib ?? []).filter((v) => v.toLowerCase() !== "deno.ns")
	Object.assign(compilerOptions,
		{
			target: "ESNext",
			forceConsistentCasingInFileNames: true,
			skipLibCheck: true,
			moduleResolution: "nodenext",
		},
		overridden_compilerOptions,
	)
	return {
		"$schema": "https://json.schemastore.org/tsconfig",
		...rest_overrides,
		compilerOptions,
	} as any
}
