/**
 * Asynchronously ensures that the link exists, and points to a valid file.
 *
 * If the parent directories for the link do not exist, they are created. If the
 * link already exists, and it is not modified, this function does nothing. If
 * the link already exists, and it does not point to the given target, an error
 * is thrown.
 *
 * Requires `--allow-read` and `--allow-write` permissions.
 *
 * @see {@link https://docs.deno.com/runtime/manual/basics/permissions#file-system-access}
 * for more information on Deno's permissions system.
 *
 * @param target The source file path as a string or URL. If it is a relative path string, it have to be relative to the link path.
 * @param linkName The destination link path as a string or URL.
 *
 * @returns A void promise that resolves once the link exists.
 *
 * @example Basic usage
 * ```ts ignore
 * import { ensureSymlink } from "@std/fs/ensure-symlink";
 *
 * // Ensures the link `./targetFile.link.dat` exists and points to `./targetFile.dat`
 * await ensureSymlink("./targetFile.dat", "./targetFile.link.dat");
 * ```
 *
 * @example Ensuring a link in a folder
 * ```ts ignore
 * import { ensureSymlink } from "@std/fs/ensure-symlink";
 *
 * // Ensures the link `./folder/targetFile.link.dat` exists and points to `./folder/targetFile.dat`
 * await ensureSymlink("./targetFile.dat", "./folder/targetFile.link.dat");
 * ```
 */
export declare function ensureSymlink(target: string | URL, linkName: string | URL): Promise<void>;
/**
 * Synchronously ensures that the link exists, and points to a valid file.
 *
 * If the parent directories for the link do not exist, they are created. If the
 * link already exists, and it is not modified, this function does nothing. If
 * the link already exists, and it does not point to the given target, an error
 * is thrown.
 *
 * Requires `--allow-read` and `--allow-write` permissions.
 *
 * @see {@link https://docs.deno.com/runtime/manual/basics/permissions#file-system-access}
 * for more information on Deno's permissions system.
 *
 * @param target The source file path as a string or URL. If it is a relative path string, it have to be relative to the link path.
 * @param linkName The destination link path as a string or URL.
 * @returns A void value that returns once the link exists.
 *
 * @example Basic usage
 * ```ts ignore
 * import { ensureSymlinkSync } from "@std/fs/ensure-symlink";
 *
 * // Ensures the link `./targetFile.link.dat` exists and points to `./targetFile.dat`
 * ensureSymlinkSync("./targetFile.dat", "./targetFile.link.dat");
 * ```
 *
 * @example Ensuring a link in a folder
 * ```ts ignore
 * import { ensureSymlinkSync } from "@std/fs/ensure-symlink";
 *
 * // Ensures the link `./folder/targetFile.link.dat` exists and points to `./folder/targetFile.dat`
 * ensureSymlinkSync("./targetFile.dat", "./folder/targetFile.link.dat");
 * ```
 */
export declare function ensureSymlinkSync(target: string | URL, linkName: string | URL): void;
//# sourceMappingURL=ensure_symlink.d.ts.map