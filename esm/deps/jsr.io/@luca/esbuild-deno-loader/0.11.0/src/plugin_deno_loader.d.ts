import type * as esbuild from "./esbuild_types.js";
/** Options for the {@link denoLoaderPlugin}. */
export interface DenoLoaderPluginOptions {
    /**
     * Specify which loader to use. By default this will use the `native` loader,
     * unless the `--allow-run` permission has not been given.
     *
     * See {@link denoLoaderPlugin} for more information on the different loaders.
     */
    loader?: "native" | "portable";
    /**
     * Specify the path to a deno.json config file to use. This is equivalent to
     * the `--config` flag to the Deno executable. This path must be absolute.
     *
     * NOTE: Import maps in the config file are not used to inform resolution, as
     * this has already been done by the `denoResolverPlugin`. This option is only
     * used when specifying `loader: "native"` to more efficiently load modules
     * from the cache. When specifying `loader: "native"`, this option must be in
     * sync with the `configPath` option for `denoResolverPlugin`.
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
     *
     * NOTE: Import maps in the config file are not used to inform resolution, as
     * this has already been done by the `denoResolverPlugin`. This option is only
     * used when specifying `loader: "native"` to more efficiently load modules
     * from the cache. When specifying `loader: "native"`, this option must be in
     * sync with the `importMapURL` option for `denoResolverPlugin`.
     */
    importMapURL?: string;
    /**
     * Specify the path to a lock file to use. This is equivalent to the `--lock`
     * flag to the Deno executable. This path must be absolute.
     *
     * If this option is not specified, the deno.json config file is consulted to
     * determine what import map to use, if any.
     *
     * A lockfile must be present to resolve `jsr:` specifiers with the `portable`
     * loader. When using the `native` loader, a lockfile is not required, but to
     * ensure dependencies are de-duplicated correctly, it is recommended to use a
     * lockfile.
     *
     * NOTE: when using `loader: "portable"`, integrity checks are not performed
     * for ESM modules.
     */
    lockPath?: string;
    /**
     * Specify how the loader should handle NPM packages. By default and if this
     * option is set to `none`, the loader will use the global cache to resolve
     * NPM packages. If this option is set to `manual`, the loader will use a
     * manually managed `node_modules` directory. If this option is set to `auto`,
     * the loader will use a local `node_modules` directory.
     *
     * If this option is not specified, the deno.json config file is consulted to
     * determine which mode to use. If no config file is present, or the config
     * file does not specify this option, the default is `none` if no package.json
     * is present, and `auto` if a package.json is present.
     *
     * This option is ignored when using the `portable` loader, as the portable
     * loader always uses a manual `node_modules` directory (equivalent of
     * `nodeModulesDir: "manual"`).
     */
    nodeModulesDir?: "auto" | "manual" | "none";
}
/** The default loader to use. */
export declare const DEFAULT_LOADER: "native" | "portable";
/**
 * The Deno loader plugin for esbuild. This plugin will load fully qualified
 * `file`, `http`, `https`, and `data` URLs.
 *
 * **Note** that this plugin does not do relative->absolute specifier
 * resolution, or import map resolution. You must use the `denoResolverPlugin`
 * _before_ the `denoLoaderPlugin` to do that.
 *
 * This plugin can be backed by two different loaders, the `native` loader and
 * the `portable` loader.
 *
 * ### Native Loader
 *
 * The native loader shells out to the Deno executable under the hood to load
 * files. Requires `--allow-read` and `--allow-run`. In this mode the download
 * cache is shared with the Deno executable. This mode respects deno.lock,
 * DENO_DIR, DENO_AUTH_TOKENS, and all similar loading configuration. Files are
 * cached on disk in the same Deno cache as the Deno executable, and will not be
 * re-downloaded on subsequent builds.
 *
 * NPM specifiers can be used in the native loader without requiring a local
 * `node_modules` directory. NPM packages are resolved, downloaded, cached, and
 * loaded in the same way as the Deno executable does.
 *
 * JSR specifiers can be used without restrictions in the native loader. To
 * ensure dependencies are de-duplicated correctly, it is recommended to use a
 * lockfile.
 *
 * ### Portable Loader
 *
 * The portable loader does module downloading and caching with only Web APIs.
 * Requires `--allow-read` and/or `--allow-net`. This mode does not respect
 * deno.lock, DENO_DIR, DENO_AUTH_TOKENS, or any other loading configuration. It
 * does not cache downloaded files. It will re-download files on every build.
 *
 * NPM specifiers can be used in the portable loader, but require a local
 * `node_modules` directory. The `node_modules` directory must be created prior
 * using Deno's `--node-modules-dir` flag.
 *
 * JSR specifiers require a lockfile to be present to resolve.
 */
export declare function denoLoaderPlugin(options?: DenoLoaderPluginOptions): esbuild.Plugin;
//# sourceMappingURL=plugin_deno_loader.d.ts.map