// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import * as dntShim from "../../../../../_dnt.shims.js";

import { isSubdir } from "./_is_subdir.js";
import { isSamePath } from "./_is_same_path.js";

const EXISTS_ERROR = new dntShim.Deno.errors.AlreadyExists("dest already exists.");

/**
 * Error thrown in {@linkcode move} or {@linkcode moveSync} when the destination
 * is a subdirectory of the source.
 *
 * @example Usage
 * ```ts no-eval
 * import { move, SubdirectoryMoveError } from "@std/fs/move";
 *
 * try {
 *   await move("./foo", "./foo/bar");
 * } catch (error) {
 *   if (error instanceof SubdirectoryMoveError) {
 *     console.error(error.message);
 *   }
 * }
 * ```
 */
export class SubdirectoryMoveError extends Error {
  /**
   * Constructs a new instance.
   *
   * @param src The source file or directory as a string or URL.
   * @param dest The destination file or directory as a string or URL.
   *
   * @example Usage
   * ```ts no-eval
   * import { SubdirectoryMoveError } from "@std/fs/move";
   *
   * throw new SubdirectoryMoveError("./foo", "./foo/bar");
   * ```
   */
  constructor(src: string | URL, dest: string | URL) {
    super(
      `Cannot move '${src}' to a subdirectory of itself, '${dest}'.`,
    );
    this.name = this.constructor.name;
  }
}

/** Options for {@linkcode move} and {@linkcode moveSync}. */
export interface MoveOptions {
  /**
   * Whether the destination file should be overwritten if it already exists.
   *
   * @default {false}
   */
  overwrite?: boolean;
}

/**
 * Asynchronously moves a file or directory (along with its contents).
 *
 * If `src` is a sub-directory of `dest`, a {@linkcode SubdirectoryMoveError}
 * will be thrown.
 *
 * Requires `--allow-read` and `--allow-write` permissions.
 *
 * @see {@link https://docs.deno.com/runtime/manual/basics/permissions#file-system-access}
 * for more information on Deno's permissions system.
 *
 * @param src The source file or directory as a string or URL.
 * @param dest The destination file or directory as a string or URL.
 * @param options Options for the move operation.
 *
 * @returns A void promise that resolves once the operation completes.
 *
 * @example Basic usage
 * ```ts no-eval
 * import { move } from "@std/fs/move";
 *
 * await move("./foo", "./bar");
 * ```
 *
 * This will move the file or directory at `./foo` to `./bar` without
 * overwriting.
 *
 * @example Overwriting
 * ```ts no-eval
 * import { move } from "@std/fs/move";
 *
 * await move("./foo", "./bar", { overwrite: true });
 * ```
 *
 * This will move the file or directory at `./foo` to `./bar`, overwriting
 * `./bar` if it already exists.
 */
export async function move(
  src: string | URL,
  dest: string | URL,
  { overwrite = false }: MoveOptions = {},
): Promise<void> {
  const srcStat = await dntShim.Deno.stat(src);

  if (
    srcStat.isDirectory &&
    (isSubdir(src, dest) || isSamePath(src, dest))
  ) {
    throw new SubdirectoryMoveError(src, dest);
  }

  if (overwrite) {
    if (isSamePath(src, dest)) return;
    try {
      await dntShim.Deno.remove(dest, { recursive: true });
    } catch (error) {
      if (!(error instanceof dntShim.Deno.errors.NotFound)) {
        throw error;
      }
    }
  } else {
    try {
      await dntShim.Deno.lstat(dest);
      return Promise.reject(EXISTS_ERROR);
    } catch {
      // Do nothing...
    }
  }

  await dntShim.Deno.rename(src, dest);
}

/**
 * Synchronously moves a file or directory (along with its contents).
 *
 * If `src` is a sub-directory of `dest`, a {@linkcode SubdirectoryMoveError}
 * will be thrown.
 *
 * Requires `--allow-read` and `--allow-write` permissions.
 *
 * @see {@link https://docs.deno.com/runtime/manual/basics/permissions#file-system-access}
 * for more information on Deno's permissions system.
 *
 * @param src The source file or directory as a string or URL.
 * @param dest The destination file or directory as a string or URL.
 * @param options Options for the move operation.
 *
 * @returns A void value that returns once the operation completes.
 *
 * @example Basic usage
 * ```ts no-eval
 * import { moveSync } from "@std/fs/move";
 *
 * moveSync("./foo", "./bar");
 * ```
 *
 * This will move the file or directory at `./foo` to `./bar` without
 * overwriting.
 *
 * @example Overwriting
 * ```ts no-eval
 * import { moveSync } from "@std/fs/move";
 *
 * moveSync("./foo", "./bar", { overwrite: true });
 * ```
 *
 * This will move the file or directory at `./foo` to `./bar`, overwriting
 * `./bar` if it already exists.
 */
export function moveSync(
  src: string | URL,
  dest: string | URL,
  { overwrite = false }: MoveOptions = {},
): void {
  const srcStat = dntShim.Deno.statSync(src);

  if (
    srcStat.isDirectory &&
    (isSubdir(src, dest) || isSamePath(src, dest))
  ) {
    throw new SubdirectoryMoveError(src, dest);
  }

  if (overwrite) {
    if (isSamePath(src, dest)) return;
    try {
      dntShim.Deno.removeSync(dest, { recursive: true });
    } catch (error) {
      if (!(error instanceof dntShim.Deno.errors.NotFound)) {
        throw error;
      }
    }
  } else {
    try {
      dntShim.Deno.lstatSync(dest);
      throw EXISTS_ERROR;
    } catch (error) {
      if (error === EXISTS_ERROR) {
        throw error;
      }
    }
  }

  dntShim.Deno.renameSync(src, dest);
}
