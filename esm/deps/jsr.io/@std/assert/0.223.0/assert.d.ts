/**
 * Make an assertion, error will be thrown if `expr` does not have truthy value.
 *
 * @example
 * ```ts
 * import { assert } from "@std/assert/assert";
 *
 * assert("hello".includes("ello")); // Doesn't throw
 * assert("hello".includes("world")); // Throws
 * ```
 */
export declare function assert(expr: unknown, msg?: string): asserts expr;
//# sourceMappingURL=assert.d.ts.map