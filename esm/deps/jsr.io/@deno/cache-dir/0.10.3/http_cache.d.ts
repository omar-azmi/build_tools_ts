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
    /** Allow copying from the global to the local cache (vendor folder). */
    allowCopyGlobalToLocal?: boolean;
}
export declare class HttpCache implements Disposable {
    #private;
    private constructor();
    static create(options: HttpCacheCreateOptions): Promise<HttpCache>;
    [Symbol.dispose](): void;
    free(): void;
    getHeaders(url: URL): Record<string, string> | undefined;
    get(url: URL, options?: HttpCacheGetOptions): Uint8Array | undefined;
    set(url: URL, headers: Record<string, string>, content: Uint8Array): void;
}
//# sourceMappingURL=http_cache.d.ts.map