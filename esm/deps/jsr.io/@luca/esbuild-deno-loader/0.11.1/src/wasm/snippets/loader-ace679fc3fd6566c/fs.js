/** @param {string} path */
import * as dntShim from "../../../../../../../../../_dnt.shims.js";
export function stat_sync(path) {
    const stat = dntShim.Deno.statSync(path);
    return {
        is_file: stat.isFile,
        is_directory: stat.isDirectory,
        is_symlink: stat.isSymlink,
    };
}
/** @param {string} path */
export function read_to_string_lossy(path) {
    return dntShim.Deno.readTextFileSync(path);
}
/** @param {string} path */
export function read_dir(path) {
    return Iterator.from(dntShim.Deno.readDirSync(path)).map((entry) => {
        return {
            name: entry.name,
            is_file: entry.isFile,
            is_directory: entry.isDirectory,
            is_symlink: entry.isSymlink,
        };
    }).toArray();
}
