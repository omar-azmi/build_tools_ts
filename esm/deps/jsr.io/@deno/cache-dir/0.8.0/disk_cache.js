// Copyright 2018-2024 the Deno authors. MIT license.
import * as dntShim from "../../../../../_dnt.shims.js";
import { dirname, ensureDir, isAbsolute, join, readAll, writeAll, } from "./deps.js";
import { assert, CACHE_PERM } from "./util.js";
import { instantiate } from "./lib/deno_cache_dir.generated.js";
export class DiskCache {
    location;
    constructor(location) {
        assert(isAbsolute(location));
        this.location = location;
    }
    async get(filename) {
        const path = join(this.location, filename);
        const file = await dntShim.Deno.open(path, { read: true });
        const value = await readAll(file);
        file.close();
        return value;
    }
    async set(filename, data) {
        const path = join(this.location, filename);
        const parentFilename = dirname(path);
        await ensureDir(parentFilename);
        const file = await dntShim.Deno.open(path, {
            write: true,
            create: true,
            mode: CACHE_PERM,
        });
        await writeAll(file, data);
        file.close();
    }
    static async getCacheFilename(url) {
        const { url_to_filename } = await instantiate();
        return url_to_filename(url.toString());
    }
}