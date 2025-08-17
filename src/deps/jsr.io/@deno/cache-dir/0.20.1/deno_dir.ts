// Copyright 2018-2025 the Deno authors. MIT license.
import * as dntShim from "../../../../../_dnt.shims.js";


import { isAbsolute, join, resolve } from "../../../@std/path/1.1.2/mod.js";
import { DiskCache } from "./disk_cache.js";
import { HttpCache } from "./http_cache.js";
import { assert } from "./util.js";
import { instantiate } from "./lib/deno_cache_dir.generated.js";

export class DenoDir {
  readonly root: string;

  constructor(root?: string | URL) {
    const resolvedRoot = DenoDir.tryResolveRootPath(root);
    assert(resolvedRoot, "Could not set the Deno root directory");
    assert(
      isAbsolute(resolvedRoot),
      `The root directory "${resolvedRoot}" is not absolute.`,
    );
    dntShim.Deno.permissions.request({ name: "read", path: resolvedRoot });
    this.root = resolvedRoot;
  }

  createGenCache(): DiskCache {
    return new DiskCache(join(this.root, "gen"));
  }

  createHttpCache(
    options?: { vendorRoot?: string | URL; readOnly?: boolean },
  ): Promise<HttpCache> {
    return HttpCache.create({
      root: join(this.root, "remote"),
      vendorRoot: options?.vendorRoot == null
        ? undefined
        : resolvePathOrUrl(options.vendorRoot),
      readOnly: options?.readOnly,
    });
  }

  static tryResolveRootPath(
    root: string | URL | undefined,
  ): string | undefined {
    if (root) {
      return resolvePathOrUrl(root);
    } else {
      const instance = instantiate();
      return instance.resolve_deno_dir();
    }
  }
}

function resolvePathOrUrl(path: URL | string) {
  if (path instanceof URL) {
    path = path.toString();
  }
  return resolve(path);
}
