/**
 * @param {any} options
 * @returns {Promise<any>}
 */
export function transform(options: any): Promise<any>;
/**
 * Options for instantiating a Wasm instance.
 * @typedef {Object} InstantiateOptions
 * @property {URL=} url - Optional url to the Wasm file to instantiate.
 * @property {DecompressCallback=} decompress - Callback to decompress the
 * raw Wasm file bytes before instantiating.
 */
/** Instantiates an instance of the Wasm module returning its functions.
 * @remarks It is safe to call this multiple times and once successfully
 * loaded it will always return a reference to the same object.
 * @param {InstantiateOptions=} opts
 */
export function instantiate(opts?: InstantiateOptions | undefined): Promise<{
    transform: typeof transform;
}>;
/** Instantiates an instance of the Wasm module along with its exports.
 * @remarks It is safe to call this multiple times and once successfully
 * loaded it will always return a reference to the same object.
 * @param {InstantiateOptions=} opts
 * @returns {Promise<{
 *   instance: WebAssembly.Instance;
 *   exports: { transform: typeof transform }
 * }>}
 */
export function instantiateWithInstance(opts?: InstantiateOptions | undefined): Promise<{
    instance: WebAssembly.Instance;
    exports: {
        transform: typeof transform;
    };
}>;
/** Gets if the Wasm module has been instantiated. */
export function isInstantiated(): boolean;
export function cacheToLocalDir(url: any, decompress: any): Promise<any>;
export function fetchWithRetries(url: any, maxRetries?: number): Promise<Response>;
/**
 * Options for instantiating a Wasm instance.
 */
export type InstantiateOptions = {
    /**
     * - Optional url to the Wasm file to instantiate.
     */
    url?: URL | undefined;
    /**
     * - Callback to decompress the
     * raw Wasm file bytes before instantiating.
     */
    decompress?: DecompressCallback | undefined;
};
export type WasmBuildDecompressCallback = (compressed: Uint8Array) => Uint8Array;
export type WasmBuildCacheCallback = (url: URL, decompress: WasmBuildDecompressCallback | undefined) => Promise<URL | Uint8Array>;
export type WasmBuildLoaderOptions = {
    /**
     * - The Wasm module's imports.
     */
    imports: WebAssembly.Imports | undefined;
    /**
     * - A function that caches the Wasm module to
     * a local path so that a network request isn't required on every load.
     *
     * Returns an ArrayBuffer with the bytes on download success, but cache save failure.
     */
    cache?: WasmBuildCacheCallback | undefined;
};
//# sourceMappingURL=dnt_wasm.generated.d.ts.map