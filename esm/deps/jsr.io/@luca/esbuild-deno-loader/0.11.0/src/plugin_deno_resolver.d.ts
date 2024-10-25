import type * as esbuild from "./esbuild_types.js";
/** Options for the {@link denoResolverPlugin}. */
export interface DenoResolverPluginOptions {
    /**
     * Specify the path to a deno.json config file to use. This is equivalent to
     * the `--config` flag to the Deno executable. This path must be absolute.
     *
     * If not specified, the plugin will attempt to find the nearest deno.json and
     * use that. If the deno.json is part of a workspace, the plugin will
     * automatically find the workspace root.
     */
    configPath?: string;
    /**
     * Specify a URL to an import map file to use when resolving import
     * specifiers. This is equivalent to the `--import-map` flag to the Deno
     * executable. This URL may be remote or a local file URL.
     *
     * If this option is not specified, the deno.json config file is consulted to
     * determine what import map to use, if any.
     */
    importMapURL?: string;
}
/**
 * The Deno resolver plugin performs relative->absolute specifier resolution
 * and import map resolution.
 *
 * If using the {@link denoLoaderPlugin}, this plugin must be used before the
 * loader plugin.
 */
export declare function denoResolverPlugin(options?: DenoResolverPluginOptions): esbuild.Plugin;
//# sourceMappingURL=plugin_deno_resolver.d.ts.map