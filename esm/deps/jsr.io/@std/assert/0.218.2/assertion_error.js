// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
/**
 * Error thrown when an assertion fails.
 *
 * @example
 * ```ts
 * import { AssertionError } from "@std/assert/assertion_error";
 *
 * throw new AssertionError("Assertion failed");
 * ```
 */
export class AssertionError extends Error {
    /** Constructs a new instance. */
    constructor(message) {
        super(message);
        this.name = "AssertionError";
    }
}
