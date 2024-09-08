import * as dntShim from "../../../../../../_dnt.shims.js";
import { dirname, join } from "../../../../@std/path/0.213.1/mod.js";
import { NativeLoader } from "./loader_native.js";
import { PortableLoader } from "./loader_portable.js";
import { isInNodeModules } from "./shared.js";
import { esbuildResolutionToURL, isNodeModulesResolution, readDenoConfig, urlToEsbuildResolution, } from "./shared.js";
const LOADERS = ["native", "portable"];
/** The default loader to use. */
export const DEFAULT_LOADER = await dntShim.Deno.permissions.query({ name: "run" })
    .then((res) => res.state !== "granted")
    ? "portable"
    : "native";
const BUILTIN_NODE_MODULES = new Set([
    "assert",
    "assert/strict",
    "async_hooks",
    "buffer",
    "child_process",
    "cluster",
    "console",
    "constants",
    "crypto",
    "dgram",
    "diagnostics_channel",
    "dns",
    "dns/promises",
    "domain",
    "events",
    "fs",
    "fs/promises",
    "http",
    "http2",
    "https",
    "module",
    "net",
    "os",
    "path",
    "path/posix",
    "path/win32",
    "perf_hooks",
    "process",
    "punycode",
    "querystring",
    "repl",
    "readline",
    "stream",
    "stream/consumers",
    "stream/promises",
    "stream/web",
    "string_decoder",
    "sys",
    "test",
    "timers",
    "timers/promises",
    "tls",
    "tty",
    "url",
    "util",
    "util/types",
    "v8",
    "vm",
    "worker_threads",
    "zlib",
]);
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
export function denoLoaderPlugin(options = {}) {
    const loader = options.loader ?? DEFAULT_LOADER;
    if (LOADERS.indexOf(loader) === -1) {
        throw new Error(`Invalid loader: ${loader}`);
    }
    return {
        name: "deno-loader",
        setup(build) {
            const cwd = build.initialOptions.absWorkingDir ?? dntShim.Deno.cwd();
            let nodeModulesDir = null;
            if (options.nodeModulesDir) {
                nodeModulesDir = join(cwd, "node_modules");
            }
            let loaderImpl;
            const packageIdByNodeModules = new Map();
            build.onStart(async function onStart() {
                packageIdByNodeModules.clear();
                switch (loader) {
                    case "native":
                        loaderImpl = new NativeLoader({
                            infoOptions: {
                                cwd,
                                config: options.configPath,
                                importMap: options.importMapURL,
                                lock: options.lockPath,
                                nodeModulesDir: options.nodeModulesDir,
                            },
                        });
                        break;
                    case "portable": {
                        let lockPath = options.lockPath;
                        if (lockPath === undefined && options.configPath !== undefined) {
                            const config = await readDenoConfig(options.configPath);
                            if (typeof config.lock === "string") {
                                lockPath = join(dirname(options.configPath), config.lock);
                            }
                            else if (config.lock !== false) {
                                lockPath = join(dirname(options.configPath), "deno.lock");
                            }
                        }
                        loaderImpl = new PortableLoader({
                            lock: lockPath,
                        });
                    }
                }
            });
            async function onResolve(args) {
                if (isNodeModulesResolution(args)) {
                    if (BUILTIN_NODE_MODULES.has(args.path) ||
                        BUILTIN_NODE_MODULES.has("node:" + args.path)) {
                        return {
                            path: args.path,
                            external: true,
                        };
                    }
                    if (nodeModulesDir) {
                        return undefined;
                    }
                    else if (loaderImpl.nodeModulesDirForPackage &&
                        loaderImpl.packageIdFromNameInPackage) {
                        let parentPackageId;
                        let path = args.importer;
                        while (true) {
                            const packageId = packageIdByNodeModules.get(path);
                            if (packageId) {
                                parentPackageId = packageId;
                                break;
                            }
                            const pathBefore = path;
                            path = dirname(path);
                            if (path === pathBefore)
                                break;
                        }
                        if (!parentPackageId) {
                            throw new Error(`Could not find package ID for importer: ${args.importer}`);
                        }
                        if (args.path.startsWith(".")) {
                            return undefined;
                        }
                        else {
                            let packageName;
                            let pathParts;
                            if (args.path.startsWith("@")) {
                                const [scope, name, ...rest] = args.path.split("/");
                                packageName = `${scope}/${name}`;
                                pathParts = rest;
                            }
                            else {
                                const [name, ...rest] = args.path.split("/");
                                packageName = name;
                                pathParts = rest;
                            }
                            const packageId = loaderImpl.packageIdFromNameInPackage(packageName, parentPackageId);
                            const id = packageId ?? parentPackageId;
                            const resolveDir = await loaderImpl.nodeModulesDirForPackage(id);
                            packageIdByNodeModules.set(resolveDir, id);
                            const path = [packageName, ...pathParts].join("/");
                            return await build.resolve(path, {
                                kind: args.kind,
                                resolveDir,
                                importer: args.importer,
                            });
                        }
                    }
                    else {
                        throw new Error(`To use "npm:" specifiers, you must specify "nodeModulesDir: true", or use "loader: native".`);
                    }
                }
                const specifier = esbuildResolutionToURL(args);
                // Once we have an absolute path, let the loader resolver figure out
                // what to do with it.
                const res = await loaderImpl.resolve(specifier);
                switch (res.kind) {
                    case "esm": {
                        const { specifier } = res;
                        return urlToEsbuildResolution(specifier);
                    }
                    case "npm": {
                        let resolveDir;
                        if (nodeModulesDir) {
                            resolveDir = nodeModulesDir;
                        }
                        else if (loaderImpl.nodeModulesDirForPackage) {
                            resolveDir = await loaderImpl.nodeModulesDirForPackage(res.packageId);
                            packageIdByNodeModules.set(resolveDir, res.packageId);
                        }
                        else {
                            throw new Error(`To use "npm:" specifiers, you must specify "nodeModulesDir: true", or use "loader: native".`);
                        }
                        const path = `${res.packageName}${res.path ?? ""}`;
                        return await build.resolve(path, {
                            kind: args.kind,
                            resolveDir,
                            importer: args.importer,
                        });
                    }
                    case "node": {
                        return {
                            path: res.path,
                            external: true,
                        };
                    }
                }
            }
            build.onResolve({ filter: /.*/, namespace: "file" }, onResolve);
            build.onResolve({ filter: /.*/, namespace: "http" }, onResolve);
            build.onResolve({ filter: /.*/, namespace: "https" }, onResolve);
            build.onResolve({ filter: /.*/, namespace: "data" }, onResolve);
            build.onResolve({ filter: /.*/, namespace: "npm" }, onResolve);
            build.onResolve({ filter: /.*/, namespace: "jsr" }, onResolve);
            build.onResolve({ filter: /.*/, namespace: "node" }, onResolve);
            function onLoad(args) {
                if (args.namespace === "file" && isInNodeModules(args.path)) {
                    // inside node_modules, just let esbuild do it's thing
                    return undefined;
                }
                const specifier = esbuildResolutionToURL(args);
                return loaderImpl.loadEsm(specifier);
            }
            // TODO(lucacasonato): once https://github.com/evanw/esbuild/pull/2968 is fixed, remove the catch all "file" handler
            build.onLoad({ filter: /.*/, namespace: "file" }, onLoad);
            build.onLoad({ filter: /.*/, namespace: "http" }, onLoad);
            build.onLoad({ filter: /.*/, namespace: "https" }, onLoad);
            build.onLoad({ filter: /.*/, namespace: "data" }, onLoad);
        },
    };
}
