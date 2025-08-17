// Copyright 2018-2025 the Deno authors. MIT license.
import * as dntShim from "../../../../../_dnt.shims.js";
import { AuthTokens } from "./auth_tokens.js";
import { fromFileUrl } from "../../../@std/path/1.1.2/mod.js";
import * as colors from "../../../@std/fmt/1.0.8/colors.js";
function shouldUseCache(cacheSetting, specifier) {
    switch (cacheSetting) {
        case "only":
        case "use":
            return true;
        // @ts-ignore old setting
        case "reloadAll":
        case "reload":
            return false;
        default: {
            const specifierStr = specifier.toString();
            for (const value of cacheSetting) {
                if (specifierStr.startsWith(value)) {
                    return false;
                }
            }
            return true;
        }
    }
}
const SUPPORTED_SCHEMES = [
    "data:",
    "blob:",
    "file:",
    "http:",
    "https:",
];
function getValidatedScheme(specifier) {
    const scheme = specifier.protocol;
    // deno-lint-ignore no-explicit-any
    if (!SUPPORTED_SCHEMES.includes(scheme)) {
        throw new TypeError(`Unsupported scheme "${scheme}" for module "${specifier.toString()}". Supported schemes: ${JSON.stringify(SUPPORTED_SCHEMES)}.`);
    }
    return scheme;
}
function hasHashbang(value) {
    return value[0] === 35 /* # */ && value[1] === 33 /* ! */;
}
function stripHashbang(value) {
    if (hasHashbang(value)) {
        const text = new TextDecoder().decode(value);
        const lineIndex = text.indexOf("\n");
        if (lineIndex > 0) {
            return text.slice(lineIndex + 1);
        }
        else {
            return value;
        }
    }
    else {
        return value;
    }
}
async function fetchLocal(specifier) {
    const local = fromFileUrl(specifier);
    if (!local) {
        throw new TypeError(`Invalid file path.\n  Specifier: "${specifier.toString()}"`);
    }
    try {
        const content = stripHashbang(await dntShim.Deno.readFile(local));
        return {
            kind: "module",
            content,
            specifier: specifier.toString(),
        };
    }
    catch {
        // ignoring errors, we will just return undefined
    }
}
export class FileFetcher {
    #allowRemote;
    #authTokens;
    #cache = new Map();
    #cacheSetting;
    #httpCache;
    #httpCachePromise;
    #httpCacheFactory;
    constructor(httpCacheFactory, cacheSetting = "use", allowRemote = true) {
        dntShim.Deno.permissions.request({ name: "env", variable: "DENO_AUTH_TOKENS" });
        this.#authTokens = new AuthTokens(dntShim.Deno.env.get("DENO_AUTH_TOKENS"));
        this.#allowRemote = allowRemote;
        this.#cacheSetting = cacheSetting;
        this.#httpCacheFactory = httpCacheFactory;
    }
    async #fetchBlobDataUrl(specifier, options, httpCache) {
        const cached = this.fetchCachedOnce(specifier, options, httpCache);
        if (cached) {
            return cached;
        }
        if (options.cacheSetting === "only") {
            throw new dntShim.Deno.errors.NotFound(`Specifier not found in cache: "${specifier.toString()}", --cached-only is specified.`);
        }
        const response = await fetchWithRetries(specifier.toString());
        const content = new Uint8Array(await response.arrayBuffer());
        const headers = {};
        for (const [key, value] of response.headers) {
            headers[key.toLowerCase()] = value;
        }
        httpCache.set(specifier, headers, content);
        return {
            kind: "module",
            specifier: specifier.toString(),
            headers,
            content,
        };
    }
    fetchCachedOnce(specifier, options, httpCache) {
        const cacheEntry = httpCache.get(specifier, options);
        if (!cacheEntry) {
            return undefined;
        }
        const location = cacheEntry.headers["location"];
        if (location != null && location.length > 0) {
            const redirect = new URL(location, specifier);
            return {
                kind: "redirect",
                specifier: redirect.toString(),
            };
        }
        return {
            kind: "module",
            specifier: specifier.toString(),
            headers: cacheEntry.headers,
            content: cacheEntry.content,
        };
    }
    async #fetchRemoteOnce(specifier, options, httpCache) {
        if (shouldUseCache(options.cacheSetting, specifier)) {
            const response = this.fetchCachedOnce(specifier, options, httpCache);
            if (response) {
                return response;
            }
        }
        if (options.cacheSetting === "only") {
            throw new dntShim.Deno.errors.NotFound(`Specifier not found in cache: "${specifier.toString()}", --cached-only is specified.`);
        }
        const requestHeaders = new Headers();
        const cachedHeaders = httpCache.getHeaders(specifier);
        if (cachedHeaders) {
            const etag = cachedHeaders["etag"];
            if (etag != null && etag.length > 0) {
                requestHeaders.append("if-none-match", etag);
            }
        }
        const authToken = this.#authTokens.get(specifier);
        if (authToken) {
            requestHeaders.append("authorization", authToken);
        }
        // deno-lint-ignore no-console
        console.error(`${colors.green("Download")} ${specifier.toString()}`);
        const response = await fetchWithRetries(specifier.toString(), {
            headers: requestHeaders,
        });
        if (!response.ok) {
            if (response.status === 404) {
                return undefined;
            }
            else {
                throw new dntShim.Deno.errors.Http(`${response.status} ${response.statusText}`);
            }
        }
        // WHATWG fetch follows redirects automatically, so we will try to
        // determine if that occurred and cache the value.
        if (specifier.toString() !== response.url) {
            const headers = { "location": response.url };
            httpCache.set(specifier, headers, new Uint8Array());
        }
        const url = new URL(response.url);
        const content = new Uint8Array(await response.arrayBuffer());
        const headers = {};
        for (const [key, value] of response.headers) {
            headers[key.toLowerCase()] = value;
        }
        httpCache.set(url, headers, content);
        if (options?.checksum != null) {
            const digest = await crypto.subtle.digest("SHA-256", content);
            const actualChecksum = Array.from(new Uint8Array(digest))
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");
            if (actualChecksum != options.checksum) {
                throw new Error(`Integrity check failed for ${url}\n\nActual: ${actualChecksum}\nExpected: ${options.checksum}`);
            }
        }
        return {
            kind: "module",
            specifier: response.url,
            headers,
            content,
        };
    }
    async fetch(specifier, 
    // Providing a checksum here doesn't make sense because the provided
    // checksum will change based on the specifier being requested, which
    // could be invalided by a redirect
    options) {
        for (let i = 0; i <= 10; i++) {
            const response = await this.fetchOnce(specifier, options);
            if (response?.kind !== "redirect") {
                return response;
            }
            specifier = new URL(response.specifier);
        }
        throw new dntShim.Deno.errors.Http(`Too many redirects.\n  Specifier: "${specifier.toString()}"`);
    }
    async fetchOnce(specifier, options) {
        const scheme = getValidatedScheme(specifier);
        if (scheme === "file:") {
            return fetchLocal(specifier);
        }
        const response = this.#cache.get(specifier.toString());
        if (response) {
            return response;
        }
        else if (scheme === "data:" || scheme === "blob:") {
            const response = await this.#fetchBlobDataUrl(specifier, this.#resolveOptions(options), await this.#resolveHttpCache());
            await this.#cache.set(specifier.toString(), response);
            return response;
        }
        else if (!this.#allowRemote) {
            throw new dntShim.Deno.errors.PermissionDenied(`A remote specifier was requested: "${specifier.toString()}", but --no-remote is specified.`);
        }
        else {
            const response = await this.#fetchRemoteOnce(specifier, this.#resolveOptions(options), await this.#resolveHttpCache());
            if (response) {
                await this.#cache.set(specifier.toString(), response);
            }
            return response;
        }
    }
    #resolveOptions(options) {
        options ??= {};
        options.cacheSetting = options.cacheSetting ?? this.#cacheSetting;
        return options;
    }
    #resolveHttpCache() {
        if (this.#httpCache != null) {
            return Promise.resolve(this.#httpCache);
        }
        if (!this.#httpCachePromise) {
            this.#httpCachePromise = this.#httpCacheFactory().then((cache) => {
                this.#httpCache = cache;
                this.#httpCachePromise = undefined;
                return cache;
            });
        }
        return this.#httpCachePromise;
    }
}
export async function fetchWithRetries(url, init) {
    const maxRetries = 3;
    let sleepMs = 250;
    let iterationCount = 0;
    while (true) {
        iterationCount++;
        try {
            const res = await fetch(url, init);
            if (res.ok || iterationCount > maxRetries ||
                res.status >= 400 && res.status < 500) {
                return res;
            }
        }
        catch (err) {
            if (iterationCount > maxRetries) {
                throw err;
            }
        }
        // deno-lint-ignore no-console
        console.warn(`${colors.yellow("WARN")} Failed fetching ${url}. Retrying in ${sleepMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, sleepMs));
        sleepMs = Math.min(sleepMs * 2, 10_000);
    }
}
