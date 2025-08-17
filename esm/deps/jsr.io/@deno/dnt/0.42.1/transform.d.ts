import type { ScriptTarget } from "./lib/types.js";
/** Specifier to specifier mappings. */
export interface SpecifierMappings {
    /** Map a specifier to another module or npm package. */
    [specifier: string]: PackageMappedSpecifier | string;
}
export interface PackageMappedSpecifier {
    /** Name of the npm package specifier to map to. */
    name: string;
    /** Version to use in the package.json file.
     *
     * Not specifying a version will exclude it from the package.json file.
     * This is useful for built-in modules such as "fs".
     */
    version?: string;
    /** Sub path of the npm package to use in the module specifier.
     *
     * @remarks This should not include the package name and should not
     * include a leading slash. It will be concatenated to the package
     * name in the module specifier like so: `<package-name>/<sub-path>`
     */
    subPath?: string;
    /** If this should be a peer dependency. */
    peerDependency?: boolean;
}
export interface GlobalName {
    /** Name to use as the global name. */
    name: string;
    /** Name of the export from the package.
     * @remarks Defaults to the name. Specify `"default"` to use the default export.
     */
    exportName?: string;
    /** Whether this is a name that only exists as a type declaration. */
    typeOnly?: boolean;
}
export type Shim = PackageShim | ModuleShim;
export interface PackageShim {
    /** Information about the npm package specifier to import. */
    package: PackageMappedSpecifier;
    /** Npm package to include in the dev depedencies that has the type declarations. */
    typesPackage?: Dependency;
    /** Named exports from the shim to use as globals. */
    globalNames: (GlobalName | string)[];
}
export interface ModuleShim {
    /** The module or bare specifier. */
    module: string;
    /** Named exports from the shim to use as globals. */
    globalNames: (GlobalName | string)[];
}
export interface TransformOptions {
    entryPoints: string[];
    testEntryPoints?: string[];
    shims?: Shim[];
    testShims?: Shim[];
    mappings?: SpecifierMappings;
    target: ScriptTarget;
    importMap?: string;
    configFile?: string;
    internalWasmUrl?: string;
    cwd: string;
}
/** Dependency in a package.json file. */
export interface Dependency {
    /** Name of the package. */
    name: string;
    /** Version specifier (ex. `^1.0.0`). */
    version: string;
    /** If this is suggested to be a peer dependency. */
    peerDependency?: boolean;
}
export interface TransformOutput {
    main: TransformOutputEnvironment;
    test: TransformOutputEnvironment;
    warnings: string[];
}
export interface TransformOutputEnvironment {
    entryPoints: string[];
    dependencies: Dependency[];
    files: OutputFile[];
}
export interface OutputFile {
    filePath: string;
    fileText: string;
}
/** Analyzes the provided entry point to get all the dependended on modules and
 * outputs canonical TypeScript code in memory. The output of this function
 * can then be sent to the TypeScript compiler or a bundler for further processing. */
export declare function transform(options: TransformOptions): Promise<TransformOutput>;
//# sourceMappingURL=transform.d.ts.map