import type * as esbuild from "./esbuild_types.js";
import { Loader, LoaderResolution } from "./shared.js";
interface PortableLoaderOptions {
    lock?: string;
}
export declare class PortableLoader implements Loader {
    #private;
    constructor(options: PortableLoaderOptions);
    resolve(specifier: URL): Promise<LoaderResolution>;
    loadEsm(url: URL): Promise<esbuild.OnLoadResult>;
}
export {};
//# sourceMappingURL=loader_portable.d.ts.map