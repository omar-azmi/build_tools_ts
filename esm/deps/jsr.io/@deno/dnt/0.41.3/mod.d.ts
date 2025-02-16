import { ts } from "../../../@ts-morph/bootstrap/0.24.0/mod.js";
import { type LibName, type SourceMapOptions } from "./lib/compiler.js";
import { type ShimOptions } from "./lib/shims.js";
import type { PackageJson, ScriptTarget } from "./lib/types.js";
import { type SpecifierMappings } from "./transform.js";
export { emptyDir } from "../../../@std/fs/1.0.13/empty_dir.js";
export type { PackageJson } from "./lib/types.js";
export type { LibName, SourceMapOptions } from "./lib/compiler.js";
export type { ShimOptions } from "./lib/shims.js";
export interface EntryPoint {
    /**
     * If the entrypoint is for an npm binary or export.
     * @default "export"
     */
    kind?: "bin" | "export";
    /** Name of the entrypoint in the "binary" or "exports". */
    name: string;
    /** Path to the entrypoint. */
    path: string;
}
export interface BuildOptions {
    /** Entrypoint(s) to the Deno module. Ex. `./mod.ts` */
    entryPoints: (string | EntryPoint)[];
    /** Directory to output to. */
    outDir: string;
    /** Shims to use. */
    shims: ShimOptions;
    /** Type check the output.
     * * `"both"` - Type checks both the ESM and script modules separately. This
     *   is the recommended option when publishing a dual ESM and script package,
     *   but it runs slower so it's not the default.
     * * `"single"` - Type checks the ESM module only or the script module if not emitting ESM.
     * * `false` - Do not type check the output.
     * @default "single"
     */
    typeCheck?: "both" | "single" | false;
    /** Collect and run test files.
     * @default true
     */
    test?: boolean;
    /** Create declaration files.
     *
     * * `"inline"` - Emit declaration files beside the .js files in both
     *   the esm and script folders. This is the recommended option when publishing
     *   a dual ESM and script package to npm.
     * * `"separate"` - Emits declaration files to the `types` folder where both
     *   the ESM and script code share the same type declarations.
     * * `false` - Do not emit declaration files.
     * @default "inline"
     */
    declaration?: "inline" | "separate" | false;
    /** Create declaration map files. Defaults to `true` if `declaration` is enabled and `skipSourceOutput` is `false`.
     */
    declarationMap?: boolean;
    /** Include a CommonJS or UMD module.
     * @default "cjs"
     */
    scriptModule?: "cjs" | "umd" | false;
    /** Whether to emit an ES module.
     * @default true
     */
    esModule?: boolean;
    /** Skip running `npm install`.
     * @default false
     */
    skipNpmInstall?: boolean;
    /** Skip outputting the canonical TypeScript in the output directory before emitting.
     * @default false
     */
    skipSourceOutput?: boolean;
    /** Root directory to find test files in. Defaults to the cwd. */
    rootTestDir?: string;
    /** Glob pattern to use to find tests files. Defaults to `deno test`'s pattern. */
    testPattern?: string;
    /**
     * Specifiers to map from and to.
     *
     * This can be used to create a node specific file:
     *
     * ```
     * mappings: {
     *   "./file.deno.ts": "./file.node.ts",
     * }
     * ```
     *
     * Or map a specifier to an npm package:
     *
     * ```
     * mappings: {
     * "https://deno.land/x/code_block_writer@11.0.0/mod.ts": {
     *   name: "code-block-writer",
     *   version: "^11.0.0",
     * }
     * ```
     */
    mappings?: SpecifierMappings;
    /** Package.json output. You may override dependencies and dev dependencies in here. */
    package: PackageJson;
    /** Path or url to import map. */
    importMap?: string;
    /** Package manager used to install dependencies and run npm scripts.
     * This also can be an absolute path to the executable file of package manager.
     * @default "npm"
     */
    packageManager?: "npm" | "yarn" | "pnpm" | string;
    /** Optional TypeScript compiler options. */
    compilerOptions?: {
        /** Uses tslib to import helper functions once per project instead of including them per-file if necessary.
         * @default false
         */
        importHelpers?: boolean;
        stripInternal?: boolean;
        strictBindCallApply?: boolean;
        strictFunctionTypes?: boolean;
        strictNullChecks?: boolean;
        strictPropertyInitialization?: boolean;
        noImplicitAny?: boolean;
        noImplicitReturns?: boolean;
        noImplicitThis?: boolean;
        noStrictGenericChecks?: boolean;
        noUncheckedIndexedAccess?: boolean;
        target?: ScriptTarget;
        /**
         * Use source maps from the canonical typescript to ESM/CommonJS emit.
         *
         * Specify `true` to include separate files or `"inline"` to inline the source map in the same file.
         * @remarks Using this option will cause your sources to be included in the npm package.
         * @default false
         */
        sourceMap?: SourceMapOptions;
        /**
         * Whether to include the source file text in the source map when using source maps.
         * @remarks It's not recommended to do this if you are distributing both ESM and CommonJS
         * sources as then it will duplicate the the source data being published.
         */
        inlineSources?: boolean;
        /** Default set of library options to use. See https://www.typescriptlang.org/tsconfig/#lib */
        lib?: LibName[];
        /**
         * Skip type checking of declaration files (those in dependencies).
         * @default true
         */
        skipLibCheck?: boolean;
        /**
         * @default false
         */
        emitDecoratorMetadata?: boolean;
        useUnknownInCatchVariables?: boolean;
    };
    /** Filter out diagnostics that you want to ignore during type checking and emitting.
     * @returns `true` to surface the diagnostic or `false` to ignore it.
     */
    filterDiagnostic?: (diagnostic: ts.Diagnostic) => boolean;
    /** Action to do after emitting and before running tests. */
    postBuild?: () => void | Promise<void>;
    /** Custom Wasm URL for the internal Wasm module used by dnt. */
    internalWasmUrl?: string;
}
/** Builds the specified Deno module to an npm package using the TypeScript compiler. */
export declare function build(options: BuildOptions): Promise<void>;
//# sourceMappingURL=mod.d.ts.map