import type { EntryPoint, ShimOptions } from "../mod.js";
import type { TransformOutput } from "../transform.js";
import type { PackageJson } from "./types.js";
export interface GetPackageJsonOptions {
    transformOutput: TransformOutput;
    entryPoints: EntryPoint[];
    package: PackageJson;
    includeEsModule: boolean | undefined;
    includeScriptModule: boolean | undefined;
    includeDeclarations: boolean | undefined;
    includeTsLib: boolean | undefined;
    testEnabled: boolean | undefined;
    shims: ShimOptions;
}
export declare function getPackageJson({ transformOutput, entryPoints, package: packageJsonObj, includeEsModule, includeScriptModule, includeDeclarations, includeTsLib, testEnabled, shims, }: GetPackageJsonOptions): Record<string, unknown>;
//# sourceMappingURL=package_json.d.ts.map