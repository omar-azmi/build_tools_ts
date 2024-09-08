/**
 * Determines the common path from a set of paths, using an optional separator,
 * which defaults to the OS default separator.
 *
 * @param paths Paths to search for common path.
 * @param sep Path separator to use.
 * @returns The common path.
 *
 * @example Usage
 * ```ts
 * import { common } from "@std/path/common";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * if (Deno.build.os === "windows") {
 *   const path = common([
 *     "C:\\deno\\std\\path\\mod.ts",
 *     "C:\\deno\\std\\fs\\mod.ts"
 *   ]);
 *   assertEquals(path, "C:\\deno\\std\\");
 * } else {
 *   const path = common([
 *     "./deno/std/path/mod.ts",
 *     "./deno/std/fs/mod.ts"
 *   ]);
 *   assertEquals(path, "./deno/std/");
 * }
 * ```
 */
export declare function common(paths: string[], sep?: string): string;
//# sourceMappingURL=common.d.ts.map