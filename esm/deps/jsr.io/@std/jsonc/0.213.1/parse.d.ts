import type { JsonValue } from "../../json/0.213.1/common.js";
export type { JsonValue } from "../../json/0.213.1/common.js";
/** Options for {@linkcode parse}. */
export interface ParseOptions {
    /** Allow trailing commas at the end of arrays and objects.
     *
     * @default {true}
     */
    allowTrailingComma?: boolean;
}
/**
 * Converts a JSON with Comments (JSONC) string into an object.
 * If a syntax error is found, throw a {@linkcode SyntaxError}.
 *
 * @example
 * ```ts
 * import { parse } from "@std/jsonc";
 *
 * console.log(parse('{"foo": "bar", } // comment')); // { foo: "bar" }
 * console.log(parse('{"foo": "bar", } /* comment *\/')); // { foo: "bar" }
 * console.log(parse('{"foo": "bar" } // comment', {
 *   allowTrailingComma: false,
 * })); // { foo: "bar" }
 * ```
 *
 * @param text A valid JSONC string.
 */
export declare function parse(text: string, { allowTrailingComma }?: ParseOptions): JsonValue;
//# sourceMappingURL=parse.d.ts.map