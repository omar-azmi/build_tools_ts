import * as dntShim from "../../../../../../_dnt.shims.js";
import { fromFileUrl } from "../../../../@std/path/0.213.1/mod.js";
import { mapContentType, mediaTypeToLoader, parseJsrSpecifier, parseNpmSpecifier, } from "./shared.js";
const JSR_REGISTRY_URL = dntShim.Deno.env.get("DENO_REGISTRY_URL") ?? "https://jsr.io";
async function readLockfile(path) {
    try {
        const data = await dntShim.Deno.readTextFile(path);
        return JSON.parse(data);
    }
    catch (err) {
        if (err instanceof dntShim.Deno.errors.NotFound) {
            return null;
        }
        throw err;
    }
}
export class PortableLoader {
    #options;
    #fetchOngoing = new Map();
    #lockfile;
    #fetchModules = new Map();
    #fetchRedirects = new Map();
    constructor(options) {
        this.#options = options;
    }
    async resolve(specifier) {
        switch (specifier.protocol) {
            case "file:": {
                return { kind: "esm", specifier };
            }
            case "http:":
            case "https:":
            case "data:": {
                const module = await this.#loadRemote(specifier.href);
                return { kind: "esm", specifier: new URL(module.specifier) };
            }
            case "npm:": {
                const npmSpecifier = parseNpmSpecifier(specifier);
                return {
                    kind: "npm",
                    packageId: "",
                    packageName: npmSpecifier.name,
                    path: npmSpecifier.path ?? "",
                };
            }
            case "node:": {
                return { kind: "node", path: specifier.pathname };
            }
            case "jsr:": {
                const resolvedSpecifier = await this.#resolveJsrSpecifier(specifier);
                return { kind: "esm", specifier: resolvedSpecifier };
            }
            default:
                throw new Error(`Unsupported scheme: '${specifier.protocol}'`);
        }
    }
    async #resolveJsrSpecifier(specifier) {
        // parse the JSR specifier.
        const jsrSpecifier = parseJsrSpecifier(specifier);
        // Attempt to load the lockfile.
        if (this.#lockfile === undefined) {
            this.#lockfile = typeof this.#options.lock === "string"
                ? readLockfile(this.#options.lock)
                : null;
        }
        if (this.#lockfile instanceof Promise) {
            this.#lockfile = await this.#lockfile;
        }
        if (this.#lockfile === null) {
            throw new Error("jsr: specifiers are not supported in the portable loader without a lockfile");
        }
        const lockfile = this.#lockfile;
        if (lockfile.version !== "3") {
            throw new Error("Unsupported lockfile version: " + lockfile.version);
        }
        // Look up the package + constraint in the lockfile.
        const id = `jsr:${jsrSpecifier.name}${jsrSpecifier.version ? `@${jsrSpecifier.version}` : ""}`;
        const lockfileEntry = lockfile.packages?.specifiers?.[id];
        if (!lockfileEntry) {
            throw new Error(`Specifier not found in lockfile: ${id}`);
        }
        const lockfileEntryParsed = parseJsrSpecifier(new URL(lockfileEntry));
        // Load the JSR manifest to find the export path.
        const manifestUrl = new URL(`./${lockfileEntryParsed.name}/${lockfileEntryParsed
            .version}_meta.json`, JSR_REGISTRY_URL);
        const manifest = await this.#loadRemote(manifestUrl.href);
        if (manifest.mediaType !== "Json") {
            throw new Error(`Expected JSON media type for JSR manifest, got: ${manifest.mediaType}`);
        }
        const manifestData = new TextDecoder().decode(manifest.data);
        const manifestJson = JSON.parse(manifestData);
        // Look up the export path in the manifest.
        const exportEntry = `.${jsrSpecifier.path ?? ""}`;
        const exportPath = manifestJson.exports[exportEntry];
        if (!exportPath) {
            throw new Error(`Package '${lockfileEntry}' has no export named '${exportEntry}'`);
        }
        // Return the resolved URL.
        return new URL(`./${lockfileEntryParsed.name}/${lockfileEntryParsed
            .version}/${exportPath}`, JSR_REGISTRY_URL);
    }
    async loadEsm(url) {
        let module;
        switch (url.protocol) {
            case "file:": {
                module = await this.#loadLocal(url);
                break;
            }
            case "http:":
            case "https:":
            case "data:": {
                module = await this.#loadRemote(url.href);
                break;
            }
            default:
                throw new Error("[unreachable] unsupported esm scheme " + url.protocol);
        }
        const loader = mediaTypeToLoader(module.mediaType);
        const res = { contents: module.data, loader };
        if (url.protocol === "file:") {
            res.watchFiles = [fromFileUrl(module.specifier)];
        }
        return res;
    }
    #resolveRemote(specifier) {
        return this.#fetchRedirects.get(specifier) ?? specifier;
    }
    async #loadRemote(specifier) {
        for (let i = 0; i < 10; i++) {
            specifier = this.#resolveRemote(specifier);
            const module = this.#fetchModules.get(specifier);
            if (module)
                return module;
            let promise = this.#fetchOngoing.get(specifier);
            if (!promise) {
                promise = this.#fetch(specifier);
                this.#fetchOngoing.set(specifier, promise);
            }
            await promise;
        }
        throw new Error("Too many redirects. Last one: " + specifier);
    }
    async #fetch(specifier) {
        const resp = await fetch(specifier, {
            redirect: "manual",
        });
        if (resp.status < 200 && resp.status >= 400) {
            throw new Error(`Encountered status code ${resp.status} while fetching ${specifier}.`);
        }
        if (resp.status >= 300 && resp.status < 400) {
            await resp.body?.cancel();
            const location = resp.headers.get("location");
            if (!location) {
                throw new Error(`Redirected without location header while fetching ${specifier}.`);
            }
            const url = new URL(location, specifier);
            if (url.protocol !== "https:" && url.protocol !== "http:") {
                throw new Error(`Redirected to unsupported protocol '${url.protocol}' while fetching ${specifier}.`);
            }
            this.#fetchRedirects.set(specifier, url.href);
            return;
        }
        const contentType = resp.headers.get("content-type");
        const mediaType = mapContentType(new URL(specifier), contentType);
        const data = new Uint8Array(await resp.arrayBuffer());
        this.#fetchModules.set(specifier, {
            specifier,
            mediaType,
            data,
        });
    }
    async #loadLocal(specifier) {
        const path = fromFileUrl(specifier);
        const mediaType = mapContentType(specifier, null);
        const data = await dntShim.Deno.readFile(path);
        return { specifier: specifier.href, mediaType, data };
    }
}
