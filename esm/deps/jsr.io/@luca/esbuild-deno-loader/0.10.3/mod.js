import { denoResolverPlugin, } from "./src/plugin_deno_resolver.js";
export { denoResolverPlugin };
import { DEFAULT_LOADER, denoLoaderPlugin, } from "./src/plugin_deno_loader.js";
export { DEFAULT_LOADER, denoLoaderPlugin };
export { esbuildResolutionToURL, urlToEsbuildResolution, } from "./src/shared.js";
/**
 * A convenience function to enable both the Deno resolver plugin, and Deno
 * loader plugin.
 */
export function denoPlugins(opts = {}) {
    return [
        denoResolverPlugin(opts),
        denoLoaderPlugin(opts),
    ];
}
