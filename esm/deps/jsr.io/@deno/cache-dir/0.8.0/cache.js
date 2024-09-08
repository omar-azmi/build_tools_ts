// Copyright 2018-2024 the Deno authors. MIT license.
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
        return this.#fileFetcher.fetch(url, { cacheSetting, checksum });
    };
}
