// Copyright 2018-2024 the Deno authors. MIT license.
import * as dntShim from "../../../../../_dnt.shims.js";
const hasPermissions = "permissions" in dntShim.Deno;
let readRequested = false;
const netRequested = new Set();
async function requestRead(path) {
    if (readRequested || !hasPermissions) {
        return;
    }
    readRequested = true;
    await dntShim.Deno.permissions.request({ name: "read", path });
}
async function requestNet(host) {
    if (!hasPermissions || netRequested.has(host)) {
        return;
    }
    netRequested.add(host);
    await dntShim.Deno.permissions.request({ name: "net", host });
}
export async function withResolvingRedirects(specifier, customLoad = load) {
    for (let i = 0; i <= 10; i++) {
        const response = await customLoad(specifier);
        if (response === undefined || response.kind !== "redirect") {
            return response;
        }
        specifier = response.specifier;
    }
    throw new Error("Too many redirects.");
}
/** A Deno specific loader function that can be passed to the
 * `createModuleGraph` which will use `Deno.readTextFile` for local files, or
 * use `fetch()` for remote modules.
 *
 * @param specifier The string module specifier from the module graph.
 */
export async function load(specifier) {
    const url = new URL(specifier);
    try {
        switch (url.protocol) {
            case "file:": {
                await requestRead(url);
                const content = await dntShim.Deno.readTextFile(url);
                return {
                    kind: "module",
                    specifier,
                    content,
                };
            }
            case "http:":
            case "https:": {
                await requestNet(url.host);
                const response = await fetch(url);
                if (response.status !== 200) {
                    // ensure the body is read as to not leak resources
                    await response.arrayBuffer();
                    // check if it's a redirect
                    if (response.status >= 300 && response.status < 400) {
                        const location = response.headers.get("location");
                        if (location != null) {
                            return {
                                "kind": "redirect",
                                specifier: location,
                            };
                        }
                    }
                    return undefined;
                }
                const content = await response.text();
                const headers = {};
                for (const [key, value] of response.headers) {
                    headers[key.toLowerCase()] = value;
                }
                return {
                    kind: "module",
                    specifier: response.url,
                    headers,
                    content,
                };
            }
            default:
                return undefined;
        }
    }
    catch {
        return undefined;
    }
}
