import * as dntShim from "../../../../../../_dnt.shims.js";
import { toFileUrl } from "../../../../@std/path/1.0.8/mod.js";
import { findWorkspace, isNodeModulesResolution, urlToEsbuildResolution, } from "./shared.js";
/**
 * The Deno resolver plugin performs relative->absolute specifier resolution
 * and import map resolution.
 *
 * If using the {@link denoLoaderPlugin}, this plugin must be used before the
 * loader plugin.
 */
export function denoResolverPlugin(options = {}) {
    return {
        name: "deno-resolver",
        setup(build) {
            let resolver = null;
            const externalRegexps = (build.initialOptions.external ?? [])
                .map((external) => {
                const regexp = new RegExp("^" + external.replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&").replace(/\*/g, ".*") + "$");
                return regexp;
            });
            build.onStart(async function onStart() {
                const cwd = build.initialOptions.absWorkingDir ?? dntShim.Deno.cwd();
                const workspace = findWorkspace(cwd, build.initialOptions.entryPoints, options.configPath);
                try {
                    const importMapURL = options.importMapURL;
                    let importMapValue;
                    if (importMapURL !== undefined) {
                        // If we have an import map URL, fetch it and parse it.
                        const resp = await fetch(importMapURL);
                        importMapValue = await resp.json();
                    }
                    resolver?.free();
                    resolver = null;
                    resolver = workspace.resolver(importMapURL, importMapValue);
                }
                finally {
                    workspace.free();
                }
            });
            build.onResolve({ filter: /.*/ }, async function onResolve(args) {
                // Pass through any node_modules internal resolution.
                if (isNodeModulesResolution(args)) {
                    return undefined;
                }
                // The first pass resolver performs synchronous resolution. This
                // includes relative to absolute specifier resolution and import map
                // resolution.
                // We have to first determine the referrer URL to use when resolving
                // the specifier. This is either the importer URL, or the resolveDir
                // URL if the importer is not specified (ie if the specifier is at the
                // root).
                let referrer;
                if (args.importer !== "") {
                    if (args.namespace === "") {
                        throw new Error("[assert] namespace is empty");
                    }
                    referrer = new URL(`${args.namespace}:${args.importer}`);
                }
                else if (args.resolveDir !== "") {
                    referrer = new URL(`${toFileUrl(args.resolveDir).href}/`);
                }
                else {
                    return undefined;
                }
                for (const externalRegexp of externalRegexps) {
                    if (externalRegexp.test(args.path)) {
                        return {
                            path: args.path,
                            external: true,
                        };
                    }
                }
                // We can then resolve the specifier relative to the referrer URL, using
                // the workspace resolver.
                const resolved = new URL(resolver.resolve(args.path, referrer.href));
                // Now pass the resolved specifier back into the resolver, for a second
                // pass. Now plugins can perform any resolution they want on the fully
                // resolved specifier.
                const { path, namespace } = urlToEsbuildResolution(resolved);
                const res = await build.resolve(path, {
                    namespace,
                    kind: args.kind,
                });
                return res;
            });
        },
    };
}
