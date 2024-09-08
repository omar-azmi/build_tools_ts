/**
 * Tools for creating interactive command line tools.
 *
 * ```ts
 * import { parseArgs } from "@std/cli/parse-args";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * // Same as running `deno run example.ts --foo --bar=baz ./quux.txt`
 * const args = parseArgs(["--foo", "--bar=baz", "./quux.txt"]);
 * assertEquals(args, { foo: true, bar: "baz", _: ["./quux.txt"] });
 * ```
 *
 * @module
 */
export * from "./parse_args.js";
export * from "./prompt_secret.js";
export * from "./spinner.js";
export * from "./unicode_width.js";
//# sourceMappingURL=mod.d.ts.map