/**
 * Return the last portion of a `path`.
 * Trailing directory separators are ignored, and optional suffix is removed.
 *
 * @example
 * ```ts
 * import { basename } from "@std/path/basename";
 *
 * basename("C:\\user\\Documents\\"); // "Documents"
 * basename("C:\\user\\Documents\\image.png"); // "image.png"
 * basename("C:\\user\\Documents\\image.png", ".png"); // "image"
 * ```
 *
 * @param path - path to extract the name from.
 * @param [suffix] - suffix to remove from extracted name.
 */
export declare function basename(path: string, suffix?: string): string;
//# sourceMappingURL=basename.d.ts.map