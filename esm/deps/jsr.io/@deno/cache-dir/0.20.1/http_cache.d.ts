export interface HttpCacheCreateOptions {
    root: string;
    vendorRoot?: string;
    readOnly?: boolean;
}
export interface HttpCacheGetOptions {
    /** Checksum to evaluate the file against. This is only evaluated for the
     * global cache (DENO_DIR) and not the local cache (vendor folder).
     */
    checksum?: string;
}
export interface HttpCacheEntry {
    headers: Record<string, string>;
    content: Uint8Array;
}
export declare class HttpCache implements Disposable {
    #private;
    private constructor();
    static create(options: HttpCacheCreateOptions): Promise<HttpCache>;
    [Symbol.dispose](): void;
    free(): void;
    getHeaders(url: URL): Record<string, string> | undefined;
    get(url: URL, options?: HttpCacheGetOptions): HttpCacheEntry | undefined;
    set(url: URL, headers: Record<string, string>, content: Uint8Array): void;
}
//# sourceMappingURL=http_cache.d.ts.map