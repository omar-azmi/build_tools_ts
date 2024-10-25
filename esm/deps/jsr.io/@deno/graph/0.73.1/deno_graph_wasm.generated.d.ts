/**
 * @param {any} roots
 * @param {Function} load
 * @param {string | undefined} maybe_default_jsx_import_source
 * @param {string | undefined} maybe_default_jsx_import_source_types
 * @param {string | undefined} maybe_jsx_import_source_module
 * @param {Function | undefined} maybe_cache_info
 * @param {Function | undefined} maybe_resolve
 * @param {Function | undefined} maybe_resolve_types
 * @param {string | undefined} maybe_graph_kind
 * @param {any} maybe_imports
 * @returns {Promise<any>}
 */
export function createGraph(roots: any, load: Function, maybe_default_jsx_import_source: string | undefined, maybe_default_jsx_import_source_types: string | undefined, maybe_jsx_import_source_module: string | undefined, maybe_cache_info: Function | undefined, maybe_resolve: Function | undefined, maybe_resolve_types: Function | undefined, maybe_graph_kind: string | undefined, maybe_imports: any): Promise<any>;
/**
 * @param {string} specifier
 * @param {any} maybe_headers
 * @param {string | undefined} maybe_default_jsx_import_source
 * @param {string | undefined} maybe_default_jsx_import_types_source
 * @param {string | undefined} maybe_jsx_import_source_module
 * @param {Uint8Array} content
 * @param {Function | undefined} [maybe_resolve]
 * @param {Function | undefined} [maybe_resolve_types]
 * @returns {any}
 */
export function parseModule(specifier: string, maybe_headers: any, maybe_default_jsx_import_source: string | undefined, maybe_default_jsx_import_types_source: string | undefined, maybe_jsx_import_source_module: string | undefined, content: Uint8Array, maybe_resolve?: Function | undefined, maybe_resolve_types?: Function | undefined): any;
export function instantiate(opts: any): Promise<{
    createGraph: typeof createGraph;
    parseModule: typeof parseModule;
}>;
export function instantiateWithInstance(opts: any): Promise<{
    instance: any;
    exports: {
        createGraph: typeof createGraph;
        parseModule: typeof parseModule;
    };
}>;
export function isInstantiated(): boolean;
export function cacheToLocalDir(url: any, decompress: any): Promise<any>;
export function fetchWithRetries(url: any, maxRetries?: number): Promise<Response>;
//# sourceMappingURL=deno_graph_wasm.generated.d.ts.map