/**
 * Decodes a base32-encoded string.
 *
 * @see {@link https://datatracker.ietf.org/doc/html/rfc4648#section-6}
 *
 * @example
 * ```ts
 * import { decodeBase32 } from "@std/encoding/base32";
 *
 * decodeBase32("NRQMA==="); // Uint8Array(3) [ 108, 96, 192 ]
 * ```
 */
export declare function decodeBase32(b32: string): Uint8Array;
/**
 * Converts data to a base32-encoded string.
 *
 * @see {@link https://datatracker.ietf.org/doc/html/rfc4648#section-6}
 *
 * @example
 * ```ts
 * import { encodeBase32 } from "@std/encoding/base32";
 *
 * encodeBase32("6c60c0"); // "NRQMA==="
 * ```
 */
export declare function encodeBase32(data: ArrayBuffer | Uint8Array | string): string;
//# sourceMappingURL=base32.d.ts.map