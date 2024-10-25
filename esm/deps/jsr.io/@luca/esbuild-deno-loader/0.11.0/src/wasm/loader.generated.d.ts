export function instantiate(): any;
export function instantiateWithInstance(): any;
export function isInstantiated(): boolean;
/** */
export class WasmLockfile {
    /**
     * @param {string} file_path
     * @param {string} content
     */
    constructor(file_path: string, content: string);
    __destroy_into_raw(): number;
    __wbg_ptr: number;
    free(): void;
    /**
     * @param {string} specifier
     * @returns {string | undefined}
     */
    package_version(specifier: string): string | undefined;
}
/** */
export class WasmWorkspace {
    static __wrap(ptr: any): any;
    /**
     * @param {(string)[]} entrypoints
     * @param {boolean} is_config_file
     * @returns {WasmWorkspace}
     */
    static discover(entrypoints: (string)[], is_config_file: boolean): WasmWorkspace;
    __destroy_into_raw(): number | undefined;
    __wbg_ptr: number | undefined;
    free(): void;
    /**
     * @returns {string | undefined}
     */
    lock_path(): string | undefined;
    /**
     * @returns {string}
     */
    node_modules_dir(): string;
    /**
     * @param {string | undefined} import_map_url
     * @param {any} import_map_value
     * @returns {WasmWorkspaceResolver}
     */
    resolver(import_map_url: string | undefined, import_map_value: any): WasmWorkspaceResolver;
}
/** */
export class WasmWorkspaceResolver {
    static __wrap(ptr: any): any;
    __destroy_into_raw(): number | undefined;
    __wbg_ptr: number | undefined;
    free(): void;
    /**
     * @param {string} specifier
     * @param {string} referrer
     * @returns {string}
     */
    resolve(specifier: string, referrer: string): string;
}
//# sourceMappingURL=loader.generated.d.ts.map