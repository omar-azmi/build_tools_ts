/**
 * @param {any} options
 * @returns {Promise<any>}
 */
export function transform(options: any): Promise<any>;
export function instantiate(opts: any): Promise<{
    transform: typeof transform;
}>;
export function instantiateWithInstance(opts: any): Promise<{
    instance: any;
    exports: {
        transform: typeof transform;
    };
}>;
export function isInstantiated(): boolean;
export function cacheToLocalDir(url: any, decompress: any): Promise<any>;
export function fetchWithRetries(url: any, maxRetries?: number): Promise<Response>;
//# sourceMappingURL=dnt_wasm.generated.d.ts.map