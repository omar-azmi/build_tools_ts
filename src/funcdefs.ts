import type { MaybePromise, PackageJson } from "./deps.ts"
import { memorize, resolveUri } from "./deps.ts"
import type { DenoJson, TsConfigJson } from "./typedefs.ts"

const default_deno_json_path = "./deno.json" as const

const getDenoJson_FromUri = async (deno_json_path_uri: string) => {
	return (await import(deno_json_path_uri, { with: { type: "json" } })).default
}
const getDenoJson_FromUri_Memorized = memorize(getDenoJson_FromUri)

/** this function loads your "deno.json" file at the provided path, as a fully statically typed javascript object. <br>
 * to get the typings of your actual "deno.json" file, you will need to do some gymnastics, like in the example at the bottom.
 * 
 * @param deno_json_path the path to your "deno.json" file. it could be either an absolute path, or a path relative to your current working directory (`Deno.cwd()`).
 * @returns a fully typed "deno.json" like javascript object.
 * 
 * @example
 * ```ts
 * import { getDenoJson } from "jsr:@oazmi/build-tools/funcdefs"
 * // Deno LSP annotates json imports done via dynamic static-path imports: `import("./path/to/your/deno.json", {with: "json"})`
 * const get_my_deno_json = async () => {
 * 	return (await import("./deno.json", { with: { type: "json" } })).default
 * }
 * // `get_my_deno_json` is never actually called. it is only used for annotation of the returned `my_deno_json` javascript object, rather than it having a generalized `DenoJson` type.
 * const my_deno_json = await getDenoJson<ReturnType<typeof get_my_deno_json>>("./cwd_path/to/deno.json")
 * ```
*/
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
 * - `packageJson`
 * 
 * note that if you use [dnt (deno-to-node)](https://jsr.io/@deno/dnt), then you will have to delete the `exports` property from the output, otherwise it will ruin/overwrite `dnt`'s output.
 * 
 * @param deno_json_path the path to your "deno.json" file. it could be either an absolute path, or a path relative to your current working directory (`Deno.cwd()`).
 * @param overrides provide additional overrides to apply to your output "package.json" like object.
 * @returns a "package.json" like javascript object.
*/
export const createPackageJson = async (deno_json_path: string = default_deno_json_path, overrides: Partial<PackageJson> = {}): Promise<PackageJson> => {
	const { name, version, description, author, license, repository, bugs, exports, packageJson } = await getDenoJson(deno_json_path)
	return {
		name: name ?? "",
		version: version ?? "0.0.0",
		description, author, license, repository, bugs, exports,
		...packageJson,
		...overrides
	}
}

/** create a "tsconfig.json" file, based on your "deno.json" configuration file.
 * 
 * @param deno_json_path the path to your "deno.json" file. it could be either an absolute path, or a path relative to your current working directory (`Deno.cwd()`).
 * @param overrides provide additional overrides to apply to your output "tsconfig.json" like object.
 * @returns a "tsconfig.json" like javascript object.
*/
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
