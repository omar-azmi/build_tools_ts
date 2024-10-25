// Copyright 2018-2024 the Deno authors. MIT license.
import * as dntShim from "../../../../../_dnt.shims.js";
import { isAbsolute, join, normalize, resolve } from "../../../@std/path/0.223.0/mod.js";
import { DiskCache } from "./disk_cache.js";
import { cacheDir, homeDir } from "./dirs.js";
import { HttpCache } from "./http_cache.js";
import { assert } from "./util.js";
export class DenoDir {
    root;
    constructor(root) {
        const resolvedRoot = DenoDir.tryResolveRootPath(root);
        assert(resolvedRoot, "Could not set the Deno root directory");
        assert(isAbsolute(resolvedRoot), `The root directory "${resolvedRoot}" is not absolute.`);
        dntShim.Deno.permissions.request({ name: "read", path: resolvedRoot });
        this.root = resolvedRoot;
    }
    createGenCache() {
        return new DiskCache(join(this.root, "gen"));
    }
    createHttpCache(options) {
        return HttpCache.create({
            root: join(this.root, "deps"),
            vendorRoot: options?.vendorRoot == null
                ? undefined
                : resolvePathOrUrl(options.vendorRoot),
            readOnly: options?.readOnly,
        });
    }
    static tryResolveRootPath(root) {
        if (root) {
            root = resolvePathOrUrl(root);
        }
        else {
            dntShim.Deno.permissions.request({ name: "env", variable: "DENO_DIR" });
            const dd = dntShim.Deno.env.get("DENO_DIR");
            if (dd) {
                if (!isAbsolute(dd)) {
                    root = normalize(join(dntShim.Deno.cwd(), dd));
                }
                else {
                    root = dd;
                }
            }
            else {
                const cd = cacheDir();
                if (cd) {
                    root = join(cd, "deno");
                }
                else {
                    const hd = homeDir();
                    if (hd) {
                        root = join(hd, ".deno");
                    }
                }
            }
        }
        return root;
    }
}
function resolvePathOrUrl(path) {
    if (path instanceof URL) {
        path = path.toString();
    }
    return resolve(path);
}
