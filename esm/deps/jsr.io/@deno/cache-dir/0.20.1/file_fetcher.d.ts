import type { LoadResponse } from "../../graph/0.86.9/mod.js";
import type { HttpCache, HttpCacheGetOptions } from "./http_cache.js";
/**
 * A setting that determines how the cache is handled for remote dependencies.
 *
 * The default is `"use"`.
 *
 * - `"only"` - only the cache will be re-used, and any remote modules not in
 *    the cache will error.
 * - `"use"` - the cache will be used, meaning existing remote files will not be
 *    reloaded.
 * - `"reload"` - any cached modules will be ignored and their values will be
 *    fetched.
 * - `string[]` - an array of string specifiers, that if they match the start of
 *    the requested specifier, will be reloaded.
 */
export type CacheSetting = "only" | "reload" | "use" | string[];
type ResolvedFetchOptions = Omit<FetchOptions, "cacheSetting"> & Pick<Required<FetchOptions>, "cacheSetting">;
interface FetchOptions extends HttpCacheGetOptions {
    cacheSetting?: CacheSetting;
}
export declare class FileFetcher {
    #private;
    constructor(httpCacheFactory: () => Promise<HttpCache>, cacheSetting?: CacheSetting, allowRemote?: boolean);
    fetchCachedOnce(specifier: URL, options: ResolvedFetchOptions, httpCache: HttpCache): LoadResponse | undefined;
    fetch(specifier: URL, options?: Omit<FetchOptions, "checksum">): Promise<LoadResponse | undefined>;
    fetchOnce(specifier: URL, options?: FetchOptions): Promise<LoadResponse | undefined>;
}
export declare function fetchWithRetries(url: URL | string, init?: {
    headers?: Headers;
}): Promise<Response>;
export {};
//# sourceMappingURL=file_fetcher.d.ts.map