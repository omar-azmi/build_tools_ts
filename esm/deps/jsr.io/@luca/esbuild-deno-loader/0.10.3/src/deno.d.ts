export interface RootInfoOutput {
    denoDir: string;
    npmCache: string;
}
export declare function rootInfo(): Promise<RootInfoOutput>;
export type MediaType = "JavaScript" | "Mjs" | "Cjs" | "JSX" | "TypeScript" | "Mts" | "Cts" | "Dts" | "Dmts" | "Dcts" | "TSX" | "Json" | "Wasm" | "TsBuildInfo" | "SourceMap" | "Unknown";
export type ModuleEntry = ModuleEntryError | ModuleEntryEsm | ModuleEntryJson | ModuleEntryNpm | ModuleEntryNode;
export interface ModuleEntryBase {
    specifier: string;
}
export interface ModuleEntryError extends ModuleEntryBase {
    error: string;
}
export interface ModuleEntryEsm extends ModuleEntryBase {
    kind: "esm";
    local: string | null;
    emit: string | null;
    map: string | null;
    mediaType: MediaType;
    size: number;
}
export interface ModuleEntryJson extends ModuleEntryBase {
    kind: "asserted" | "json";
    local: string | null;
    mediaType: MediaType;
    size: number;
}
export interface ModuleEntryNpm extends ModuleEntryBase {
    kind: "npm";
    npmPackage: string;
}
export interface ModuleEntryNode extends ModuleEntryBase {
    kind: "node";
    moduleName: string;
}
export interface NpmPackage {
    name: string;
    version: string;
    dependencies: string[];
}
export interface InfoOptions {
    cwd?: string;
    config?: string;
    importMap?: string;
    lock?: string;
    nodeModulesDir?: boolean;
}
export declare class InfoCache {
    #private;
    constructor(options?: InfoOptions);
    get(specifier: string): Promise<ModuleEntry>;
    getNpmPackage(id: string): NpmPackage | undefined;
}
export interface Lockfile {
    version: string;
    packages?: {
        specifiers?: Record<string, string>;
    };
}
//# sourceMappingURL=deno.d.ts.map