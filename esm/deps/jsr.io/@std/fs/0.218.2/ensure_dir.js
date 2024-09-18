// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import * as dntShim from "../../../../../_dnt.shims.js";
import { getFileInfoType } from "./_get_file_info_type.js";
/**
 * Ensures that the directory exists.
 * If the directory structure does not exist, it is created. Like mkdir -p.
 * Requires the `--allow-read` and `--allow-write` flag.
 *
 * @example
 * ```ts
 * import { ensureDir } from "@std/fs";
 *
 * ensureDir("./bar"); // returns a promise
 * ```
 */
export async function ensureDir(dir) {
    try {
        const fileInfo = await dntShim.Deno.lstat(dir);
        if (!fileInfo.isDirectory) {
            throw new Error(`Ensure path exists, expected 'dir', got '${getFileInfoType(fileInfo)}'`);
        }
        return;
    }
    catch (err) {
        if (!(err instanceof dntShim.Deno.errors.NotFound)) {
            throw err;
        }
    }
    // The dir doesn't exist. Create it.
    // This can be racy. So we catch AlreadyExists and check lstat again.
    try {
        await dntShim.Deno.mkdir(dir, { recursive: true });
    }
    catch (err) {
        if (!(err instanceof dntShim.Deno.errors.AlreadyExists)) {
            throw err;
        }
        const fileInfo = await dntShim.Deno.lstat(dir);
        if (!fileInfo.isDirectory) {
            throw new Error(`Ensure path exists, expected 'dir', got '${getFileInfoType(fileInfo)}'`);
        }
    }
}
/**
 * Ensures that the directory exists.
 * If the directory structure does not exist, it is created. Like mkdir -p.
 * Requires the `--allow-read` and `--allow-write` flag.
 *
 * @example
 * ```ts
 * import { ensureDirSync } from "@std/fs";
 *
 * ensureDirSync("./ensureDirSync"); // void
 * ```
 */
export function ensureDirSync(dir) {
    try {
        const fileInfo = dntShim.Deno.lstatSync(dir);
        if (!fileInfo.isDirectory) {
            throw new Error(`Ensure path exists, expected 'dir', got '${getFileInfoType(fileInfo)}'`);
        }
        return;
    }
    catch (err) {
        if (!(err instanceof dntShim.Deno.errors.NotFound)) {
            throw err;
        }
    }
    // The dir doesn't exist. Create it.
    // This can be racy. So we catch AlreadyExists and check lstat again.
    try {
        dntShim.Deno.mkdirSync(dir, { recursive: true });
    }
    catch (err) {
        if (!(err instanceof dntShim.Deno.errors.AlreadyExists)) {
            throw err;
        }
        const fileInfo = dntShim.Deno.lstatSync(dir);
        if (!fileInfo.isDirectory) {
            throw new Error(`Ensure path exists, expected 'dir', got '${getFileInfoType(fileInfo)}'`);
        }
    }
}