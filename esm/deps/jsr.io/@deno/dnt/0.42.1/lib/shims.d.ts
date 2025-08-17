import type { Shim } from "../transform.js";
/** Provide `true` to use the shim in both the distributed code and test code,
 * `"dev"` to only use it in the test code, or `false` to not use the shim
 * at all.
 *
 * @remarks Defaults to `false`.
 */
export type ShimValue = boolean | "dev";
/** Provide `true` to use the shim in both the distributed code and test code,
 * `"dev"` to only use it in the test code, or `false` to not use the shim
 * at all.
 *
 * @remarks These all default to `false`.
 */
export interface ShimOptions {
    /** Shim the `Deno` namespace. */
    deno?: ShimValue | {
        test: ShimValue;
    };
    /** Shim the global `setTimeout` and `setInterval` functions with
     * Deno and browser compatible versions.
     */
    timers?: ShimValue;
    /** Shim the global `confirm`, `alert`, and `prompt` functions. */
    prompts?: ShimValue;
    /** Shim the `Blob` global with the one from the `"buffer"` module. */
    blob?: ShimValue;
    /** Shim the `crypto` global. */
    crypto?: ShimValue;
    /** Shim `DOMException` using the "domexception" package (https://www.npmjs.com/package/domexception) */
    domException?: ShimValue;
    /** Shim `fetch`, `File`, `FormData`, `Headers`, `Request`, and `Response` by
     * using the "undici" package (https://www.npmjs.com/package/undici).
     */
    undici?: ShimValue;
    /** Use a sham for the `WeakRef` global, which uses `globalThis.WeakRef` when
     * it exists. The sham will throw at runtime when calling `deref()` and `WeakRef`
     * doesn't globally exist, so this is only intended to help type check code that
     * won't actually use it.
     */
    weakRef?: ShimValue;
    /** Shim `WebSocket` with the `ws` package (https://www.npmjs.com/package/ws). */
    webSocket?: boolean | "dev";
    /** Custom shims to use. */
    custom?: Shim[];
    /** Custom shims to use only for the test code. */
    customDev?: Shim[];
}
export interface DenoShimOptions {
    /** Only import the `Deno` namespace for `Deno.test`.
     * This may be useful for environments
     */
    test: boolean | "dev";
}
export declare function shimOptionsToTransformShims(options: ShimOptions): {
    shims: Shim[];
    testShims: Shim[];
};
//# sourceMappingURL=shims.d.ts.map