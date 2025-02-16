// Copyright 2018-2025 the Deno authors. MIT license.
import * as dntShim from "../../../../../_dnt.shims.js";

import { dirname } from "../../path/1.0.8/dirname.js";
import { resolve } from "../../path/1.0.8/resolve.js";
import { ensureDir, ensureDirSync } from "./ensure_dir.js";
import { getFileInfoType, type PathType } from "./_get_file_info_type.js";
import { toPathString } from "./_to_path_string.js";

// deno-lint-ignore no-explicit-any
const isWindows = (dntShim.dntGlobalThis as any).Deno?.build.os === "windows";

function resolveSymlinkTarget(target: string | URL, linkName: string | URL) {
  if (typeof target !== "string") return target; // URL is always absolute path
  if (typeof linkName === "string") {
    return resolve(dirname(linkName), target);
  } else {
    return new URL(target, linkName);
  }
}

function getSymlinkOption(
  type: PathType | undefined,
): dntShim.Deno.SymlinkOptions | undefined {
  return isWindows ? { type: type === "dir" ? "dir" : "file" } : undefined;
}

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
export async function ensureSymlink(
  target: string | URL,
  linkName: string | URL,
) {
  const targetRealPath = resolveSymlinkTarget(target, linkName);
  let srcStatInfo;
  try {
    srcStatInfo = await dntShim.Deno.lstat(targetRealPath);
  } catch (error) {
    if (error instanceof dntShim.Deno.errors.NotFound) {
      throw new dntShim.Deno.errors.NotFound(
        `Cannot ensure symlink as the target path does not exist: ${targetRealPath}`,
      );
    }
    throw error;
  }
  const srcFilePathType = getFileInfoType(srcStatInfo);

  await ensureDir(dirname(toPathString(linkName)));

  const options = getSymlinkOption(srcFilePathType);

  try {
    await dntShim.Deno.symlink(target, linkName, options);
  } catch (error) {
    if (!(error instanceof dntShim.Deno.errors.AlreadyExists)) {
      throw error;
    }
    const linkStatInfo = await dntShim.Deno.lstat(linkName);
    if (!linkStatInfo.isSymlink) {
      const type = getFileInfoType(linkStatInfo);
      throw new dntShim.Deno.errors.AlreadyExists(
        `A '${type}' already exists at the path: ${linkName}`,
      );
    }
    const linkPath = await dntShim.Deno.readLink(linkName);
    const linkRealPath = resolve(linkPath);
    if (linkRealPath !== targetRealPath) {
      throw new dntShim.Deno.errors.AlreadyExists(
        `A symlink targeting to an undesired path already exists: ${linkName} -> ${linkRealPath}`,
      );
    }
  }
}

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
export function ensureSymlinkSync(
  target: string | URL,
  linkName: string | URL,
) {
  const targetRealPath = resolveSymlinkTarget(target, linkName);
  let srcStatInfo;
  try {
    srcStatInfo = dntShim.Deno.lstatSync(targetRealPath);
  } catch (error) {
    if (error instanceof dntShim.Deno.errors.NotFound) {
      throw new dntShim.Deno.errors.NotFound(
        `Cannot ensure symlink as the target path does not exist: ${targetRealPath}`,
      );
    }
    throw error;
  }
  const srcFilePathType = getFileInfoType(srcStatInfo);

  ensureDirSync(dirname(toPathString(linkName)));

  const options = getSymlinkOption(srcFilePathType);

  try {
    dntShim.Deno.symlinkSync(target, linkName, options);
  } catch (error) {
    if (!(error instanceof dntShim.Deno.errors.AlreadyExists)) {
      throw error;
    }
    const linkStatInfo = dntShim.Deno.lstatSync(linkName);
    if (!linkStatInfo.isSymlink) {
      const type = getFileInfoType(linkStatInfo);
      throw new dntShim.Deno.errors.AlreadyExists(
        `A '${type}' already exists at the path: ${linkName}`,
      );
    }
    const linkPath = dntShim.Deno.readLinkSync(linkName);
    const linkRealPath = resolve(linkPath);
    if (linkRealPath !== targetRealPath) {
      throw new dntShim.Deno.errors.AlreadyExists(
        `A symlink targeting to an undesired path already exists: ${linkName} -> ${linkRealPath}`,
      );
    }
  }
}
