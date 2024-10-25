import type { MediaType } from "./deno.js";
import type * as esbuild from "./esbuild_types.js";
import { WasmWorkspace } from "./wasm/loader.generated.js";
import type { BuildOptions } from "./esbuild_types.js";
export interface Loader {
    resolve(specifier: URL): Promise<LoaderResolution>;
    loadEsm(specifier: URL): Promise<esbuild.OnLoadResult | undefined>;
    packageIdFromNameInPackage?(name: string, parentPackageId: string): string | null;
    nodeModulesDirForPackage?(npmPackageId?: string): Promise<string>;
    [Symbol.dispose]?(): void;
}
export declare function findWorkspace(cwd: string, entryPoints: BuildOptions["entryPoints"], configPath: string | undefined): WasmWorkspace;
export type LoaderResolution = LoaderResolutionEsm | LoaderResolutionNpm | LoaderResolutionNode;
export interface LoaderResolutionEsm {
    kind: "esm";
    specifier: URL;
}
export interface LoaderResolutionNpm {
    kind: "npm";
    packageId: string;
    packageName: string;
    path: string;
}
export interface LoaderResolutionNode {
    kind: "node";
    path: string;
}
export declare function mediaTypeToLoader(mediaType: MediaType): esbuild.Loader | null;
/** Esbuild's representation of a module specifier. */
export interface EsbuildResolution {
    /** The namespace, like `file`, `https`, or `npm`. */
    namespace: string;
    /** The path. When the namespace is `file`, this is a file path. Otherwise
     * this is everything in a URL with the namespace as the scheme, after the
     * `:` of the scheme. */
    path: string;
}
/**
 * Turn a URL into an {@link EsbuildResolution} by splitting the URL into a
 * namespace and path.
 *
 * For file URLs, the path returned is a file path not a URL path representing a
 * file.
 */
export declare function urlToEsbuildResolution(url: URL): EsbuildResolution;
/**
 * Turn an {@link EsbuildResolution} into a URL by joining the namespace and
 * path into a URL string.
 *
 * For file URLs, the path is interpreted as a file path not as a URL path
 * representing a file.
 */
export declare function esbuildResolutionToURL(specifier: EsbuildResolution): URL;
export declare function mapContentType(specifier: URL, contentType: string | null): MediaType;
export declare function mediaTypeFromSpecifier(specifier: URL): MediaType;
export interface NpmSpecifier {
    name: string;
    version: string | null;
    path: string | null;
}
export declare function parseNpmSpecifier(specifier: URL): NpmSpecifier;
export interface JsrSpecifier {
    name: string;
    version: string | null;
    path: string | null;
}
export declare function parseJsrSpecifier(specifier: URL): JsrSpecifier;
export declare function isInNodeModules(path: string): boolean;
export declare function isNodeModulesResolution(args: esbuild.OnResolveArgs): boolean;
//# sourceMappingURL=shared.d.ts.map