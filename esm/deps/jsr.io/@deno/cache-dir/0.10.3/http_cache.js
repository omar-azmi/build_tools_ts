// Copyright 2018-2024 the Deno authors. MIT license.
import * as dntShim from "../../../../../_dnt.shims.js";
import { isAbsolute } from "../../../@std/path/0.223.0/mod.js";
import { assert } from "./util.js";
import { instantiate, } from "./lib/deno_cache_dir.generated.js";
export class HttpCache {
    #cache;
    #readOnly;
    constructor(cache, readOnly) {
        this.#cache = cache;
        this.#readOnly = readOnly;
    }
    static async create(options) {
        assert(isAbsolute(options.root), "Root must be an absolute path.");
        if (options.vendorRoot != null) {
            assert(isAbsolute(options.vendorRoot), "Vendor root must be an absolute path.");
        }
        const { GlobalHttpCache, LocalHttpCache } = await instantiate();
        let cache;
        if (options.vendorRoot != null) {
            cache = LocalHttpCache.new(options.vendorRoot, options.root);
        }
        else {
            cache = GlobalHttpCache.new(options.root);
        }
        return new HttpCache(cache, options.readOnly);
    }
    [Symbol.dispose]() {
        this.free();
    }
    free() {
        this.#cache?.free();
    }
    getHeaders(url) {
        const map = this.#cache.getHeaders(url.toString());
        return map == null ? undefined : Object.fromEntries(map);
    }
    get(url, options) {
        const data = this.#cache.getFileBytes(url.toString(), options?.checksum, options?.allowCopyGlobalToLocal ?? true);
        return data == null ? undefined : data;
    }
    set(url, headers, content) {
        if (this.#readOnly === undefined) {
            this.#readOnly =
                (dntShim.Deno.permissions.querySync({ name: "write" })).state === "denied"
                    ? true
                    : false;
        }
        if (this.#readOnly) {
            return;
        }
        this.#cache.set(url.toString(), headers, content);
    }
}
