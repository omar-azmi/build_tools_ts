/** an esbuild plugin that fetches and loads `"http://"`, `"https://"`, and `"file://"` resources.
 *
 * @module
*/
import { type DeepPartial } from "../../deps.js";
import type { EsbuildLoaderType, EsbuildPlugin, EsbuildPluginSetup, LoggerFunction, OnLoadCallback } from "../typedefs.js";
/** configuration options for the {@link urlLoaderFactory} function. */
export interface UrlLoaderFactoryConfig {
    /** enable logging of the input arguments and preferred loader, when {@link DEBUG.LOG} is ennabled.
     *
     * when set to `true`, the logs will show up in your console via `console.log()`.
     * you may also provide your own custom logger function if you wish.
     *
     * @defaultValue `false`
    */
    log?: boolean | LoggerFunction;
    /** the default loader that the plugin's loader should use for unidentified content types.
     *
     * if you would like to use esbuild's _own_ default loader, set the value to `"default"`.
     *
     * @defaultValue `"copy"`
    */
    defaultLoader: EsbuildLoaderType;
    /** only accept the following subset of loaders when auto content-detection is used for guessing the loader type.
     *
     * > [!note]
     * > if there is no intersection between the set of guessed loaders, and this set of `acceptLoaders`,
     * > then the default loader ({@link defaultLoader}) will be used as a fallback.
     *
     * @defaultValue `undefined` (i.e. all available esbuild loaders)
    */
    acceptLoaders?: undefined | Array<EsbuildLoaderType>;
}
/** a factory function that returns a general purpose url content loading function for your esbuild plugin, tuned to your specific `config`.
 *
 * for the content to be correctly fetched and loaded, your `args.path` **must** be in one of the following formats:
 * - an `"http://"` or an `"https://"` url
 * - a `"file://"` url
 * - or, an absolute local file path (such as `"/home/bin/..."` or `"C:/Users/..."`)
 *
 * make sure that the path is **not** a relative path (even if it's relative to the current working directory).
 *
 * > [!important]
 * > esbuild identifies redundant/duplicate resources by their _resolved path_ and _namespace_ .
 * > if the same resource is being bundled but with either a different resolved path, or under a different namespace,
 * > then esbuild will consider them to be separate resources, instead of being one and the same.
 * > thus, it is extremely crucial that you prepare a uniquely-idenfifiable resolved path in the plugin's resolver,
 * > rather than delaying its resolution in the plugin's loader.
 * >
 * > in other words, for best results minifiable results, you should resolve the following things in the plugin's resolver, rather than the plugin's loader:
 * > - a path that is an alias inside the current import map, should be resolved to absolute an path (i.e. preferebly an `http://` or `file://` path)
 * > - jsr and npm specifiers (such as `jsr:@scope/package/pathname`) should also be resolved to http paths.
 * > - if you are caching jsr/npm/http resources on your local filesystem, you should _still_ resolve the resources by their absolute http paths,
 * >   and then check for the cached resource's existence in the filesystem inside the plugin's loader function.
 * >   do not _resolve_ to a local filesystem path if cached resources are detected, since it will break equivalency of referenced resource's resolved path.
 * >
 * > typically, the unique key that esbuild uses for identifiying redundant/duplicate resource references is of the following template:
 * > `${resolver_result.namespace}:${resolver_result.path}`
 * >
 * > where `resolver_result` is of kind {@link OnResolveResult | `esbuild.OnResolveResult`}.
 * >
 * > this key also becomes the key of the resource in the output metadata object (if it is enabled).
 *
 * > [!caution]
 * > based on some logging tests, I've verified that esbuild does indeed memorize the result of an `onLoad`'s callback.
 * > this means that it is possible for inconsistencies to occur in your `pluginData`, when the dependency paths are being resolved.
 * > but I will say that it is hard to imagine if this could ever become an issue, since the dependencies will also be loaded _only once_ .
 * > although, the next time something other than the original dependant, requires the same dependency file,
 * > the new `pluginData` (i.e. potentially different) of the new dependant will not be conveyed to the loader (since its results are cached by esbuild).
 *
 * @param config provide a configuration to customize some aspects of the returned loader function.
 * @returns a url loader function that can be passed to the callback of {@link EsbuildPluginBuild.onLoad | `esbuild.PluginBuild.onLoad`},
 *   so that it can fetch the contents of url-based paths when esbuild intercept
*/
export declare const urlLoaderFactory: (config: UrlLoaderFactoryConfig) => OnLoadCallback;
/** configuration options for the {@link httpPluginSetup} and {@link httpPlugin} functions. */
export interface HttpPluginSetupConfig {
    /** the regex filters which the plugin's resolvers should use for the interception of resource-paths.
     *
     * @defaultValue `[/^https?\:\/\//, /^file\:\/\//]` (captures `"http://"`, `"https://"`, and `"file://"` uris)
    */
    filters: RegExp[];
    /** specify the namespace that the http plugin's loader should use for fetchable resources.
     *
     * if the {@link convertFileUriToLocalPath} option is enabled (default),
     * then file-uris will **not** use this namespace, and instead adopt the regular `""` namespace.
     *
     * > [!caution]
     * > it is best if you don't modify it to something besides the default value {@link PLUGIN_NAMESPACE.LOADER_HTTP},
     * > as this plugin relies on the entry-plugin's prior intervention to have relative-paths and import-map paths resolved to a full http path.
    */
    namespace: string;
    /** {@inheritDoc UrlLoaderFactoryConfig.defaultLoader} */
    defaultLoader: EsbuildLoaderType;
    /** {@inheritDoc UrlLoaderFactoryConfig.acceptLoaders} */
    acceptLoaders?: undefined | Array<EsbuildLoaderType>;
    /** specify which `namespace`s should be intercepted by the http-plugin.
     * all other `namespace`s will not be processed by this plugin.
     *
     * if you have a plugin with a custom loader that works under some `"custom-namespace"`,
     * you can include your `"custom-namespace"` here, so that if it performs an http-import,
     * that import path will be captured by this plugin, and then consequently fetched by this plugin's http-loader.
     * but do note that the namespace of the loaded resource will switch to this plugin's loader {@link namespace}
     * (which defaults to {@link PLUGIN_NAMESPACE.LOADER_HTTP}), instead of your `"custom-namespace"`.
     *
     * @defaultValue `[undefined, "", "file"]` (also this plugin's {@link namespace} gets added later on)
    */
    acceptNamespaces: Array<string | undefined>;
    /** specify if `"file://"` uris should be converted to local paths,
     * so that esbuild natively loads them, instead of us fetching the resource ourselves.
     *
     * when this option is enabled, the resulting resolved local-path of a file uris will not use the {@link namespace} config option,
     * and instead adopt the the default namespace `""`, so that esbuild (or some other plugin) would be capable of loading it.
     *
     * > [!warning]
     * > for best compatibility with `./node_modules/` resolution and other plugins, it is best to have this option enabled always.
     * > that's because if a file uri ends up becoming the `resolveDir` of an npm-package resource,
     * > then esbuild will halt and complain that it does not understand the "non-absolute" local path specified,
     * > because it is incapable of interpreting file uris, and will refuse to scan directories based on it.
     *
     * ### drawbacks
     * - if esbuild's native resolver/loader intercepts the resolved path, then it will strip away the `pluginData`.
     *   on the otherhand, our url-loader will not do such a thing
     *
     * @defaultValue `{ enabled: true, resolveAgain: true }` (file uris are converted to local paths, and re-resolved to give other plugins the chance to initercept it)
    */
    convertFileUriToLocalPath: {
        /** enable or disable file-uri to local path conversion. @defaultValue `true` */
        enabled: boolean;
        /** enable or disable re-resolution of the local path, to allow other plugins to intercept. @defaultValue `true` */
        resolveAgain: boolean;
    };
    /** {@link UrlLoaderFactoryConfig.log} */
    log: UrlLoaderFactoryConfig["log"];
}
/** this plugin intercepts `"http://"`, `"https://"`, and `"file://"` resource paths and redirects them to the {@link PLUGIN_NAMESPACE.LOADER_HTTP} namespace,
 * where they can be fetched and loaded by a dedicated loader.
 *
 * the loader function tries to guess the resource's `loader` type by inspecting its `"content-type"` http-header and/or its path extension/suffix.
 *
 * > [!important]
 * > you are generally expected to have the {@link entryPlugin} in your list of esbuild plugins (preferably in the beginning) for this plugin to function correctly.
 * > the resolver portion of this plugin is intentionally made to be super basic, so that all it does is redirect absolute urls to its loader's namespace.
 * > this means that the resolver in this plugin will not carry out relative-path/import-map/package-alias resolution.
 * > which is why you should have the {@link entryPlugin} loaded, in order for these various path resolutions to take place.
 *
 * TODO: maybe I should also create a standalone http plugin in the future that will not rely on {@link entryPlugin},
 *   in case someone really just wants to use a single http plugin without all the fancy entry-point plugin-data injection.
 *   although, then it would not be recommended to use that standalone version along side an {@link entryPlugin},
 *   since it will lead to some redundant ping-pongging (but the final resolved result will remain unchanged).
*/
export declare const httpPluginSetup: (config?: DeepPartial<HttpPluginSetupConfig>) => EsbuildPluginSetup;
/** {@inheritDoc httpPluginSetup} */
export declare const httpPlugin: (config?: Partial<HttpPluginSetupConfig>) => EsbuildPlugin;
//# sourceMappingURL=http.d.ts.map