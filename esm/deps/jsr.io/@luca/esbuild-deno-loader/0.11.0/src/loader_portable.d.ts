import type * as esbuild from "./esbuild_types.js";
import { type Loader, type LoaderResolution } from "./shared.js";
interface PortableLoaderOptions {
    lock?: string;
}
export declare class PortableLoader implements Loader, Disposable {
    #private;
    constructor(options: PortableLoaderOptions);
    [Symbol.dispose](): void;
    resolve(specifier: URL): Promise<LoaderResolution>;
    loadEsm(url: URL): Promise<esbuild.OnLoadResult | undefined>;
}
export {};
//# sourceMappingURL=loader_portable.d.ts.map