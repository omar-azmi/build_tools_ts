// Copyright 2018-2025 the Deno authors. MIT license.
import * as dntShim from "../../../../../_dnt.shims.js";
/** Provides an interface to Deno's CLI cache.
 *
 * It is better to use the {@linkcode createCache} function directly. */
export class FetchCacher {
    #fileFetcher;
    constructor(fileFetcher) {
        this.#fileFetcher = fileFetcher;
    }
    // this should have the same interface as deno_graph's loader
    load = (specifier, _isDynamic, cacheSetting, checksum) => {
        const url = new URL(specifier);
        return this.#fileFetcher.fetchOnce(url, { cacheSetting, checksum })
            .catch((e) => {
            if (e instanceof dntShim.Deno.errors.NotFound) {
                return undefined;
            }
            throw e;
        });
    };
}
