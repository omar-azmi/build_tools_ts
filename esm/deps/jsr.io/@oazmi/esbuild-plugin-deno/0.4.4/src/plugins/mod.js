/** this submodule contains a convenient all-in-one esbuild plugin that combines all other plugins within this library.
 *
 * @module
*/
import { defaultGetCwd, isAbsolutePath, resolveResourcePathFactory } from "../deps.js";
import { entryPlugin } from "./filters/entry.js";
import { httpPlugin } from "./filters/http.js";
import { jsrPlugin } from "./filters/jsr.js";
import { npmPlugin } from "./filters/npm.js";
import { resolverPlugin } from "./resolvers.js";
import { defaultEsbuildNamespaces, DIRECTORY } from "./typedefs.js";
export { DIRECTORY } from "./typedefs.js";
const defaultDenoPluginsConfig = {
    initialPluginData: undefined,
    scanAncestralWorkspaces: false,
    log: false,
    logFor: ["npm", "resolver"],
    autoInstall: true,
    peerDependencies: {},
    nodeModulesDirs: [DIRECTORY.ABS_WORKING_DIR],
    globalImportMap: {},
    getCwd: defaultGetCwd,
    acceptNamespaces: defaultEsbuildNamespaces,
};
/** creates an array esbuild plugins that can resolve imports in the same way deno can.
 *
 * it is effectively a cumulation of the following three plugins (ordered from highest resolving priority to lowest):
 * - {@link entryPlugin}: provides `pluginData` to all entry-points and their dependencies,
 *   in addition to pre-resolving all paths implicitly through the {@link resolverPlugin}.
 * - {@link httpPlugin}: provides `http://`, `https://`, and `file://` path-resolving and resource-fetching loader.
 * - {@link jsrPlugin}: provides a `jsr:` to `https://jsr.io/` path-resolver.
 * - {@link npmPlugin}: provides a resolver that strips away `npm:` specifier prefixes,
 *   so that package-resources can be obtained from your `./node_modules/` folder.
 * - {@link resolverPlugin}: a namespaced plugin that provides the backbone pipeline for resolving the paths of all of the plugins above.
*/
export const denoPlugins = (config) => {
    const { acceptNamespaces, autoInstall, getCwd, globalImportMap, log, logFor, peerDependencies, nodeModulesDirs, initialPluginData, scanAncestralWorkspaces } = { ...defaultDenoPluginsConfig, ...config }, resolvePath = resolveResourcePathFactory(getCwd, isAbsolutePath);
    return [
        entryPlugin({ initialPluginData, scanAncestralWorkspaces, acceptNamespaces }),
        httpPlugin({ acceptNamespaces, log: logFor.includes("http") ? log : false }),
        jsrPlugin({ acceptNamespaces }),
        npmPlugin({ acceptNamespaces, autoInstall, peerDependencies, nodeModulesDirs, log: logFor.includes("npm") ? log : false }),
        resolverPlugin({
            log: logFor.includes("resolver") ? log : false,
            importMap: { globalImportMap: globalImportMap },
            relativePath: { resolvePath: resolvePath },
        }),
    ];
};
