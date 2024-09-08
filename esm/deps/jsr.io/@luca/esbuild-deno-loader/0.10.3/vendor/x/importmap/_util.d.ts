export interface SpecifierMap {
    [url: string]: string | null;
}
export interface Scopes {
    [url: string]: SpecifierMap;
}
export interface ImportMap {
    imports?: SpecifierMap;
    scopes?: Scopes;
}
export declare function isObject(object: unknown): object is Record<string, unknown>;
export declare function sortObject(normalized: Record<string, unknown>): Record<string, unknown>;
export declare function isImportMap(importMap: unknown): importMap is ImportMap;
export declare function isImports(importsMap: unknown): importsMap is ImportMap;
export declare function isScopes(scopes: unknown): scopes is Scopes;
export declare function isSpecifierMap(specifierMap: unknown): specifierMap is SpecifierMap;
export declare function isURL(url: unknown): boolean;
//# sourceMappingURL=_util.d.ts.map