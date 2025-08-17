// Copyright 2018-2024 the Deno authors. MIT license.
/**
 * Lower level `transform` functionality that's used by the CLI
 * to convert Deno code to Node code.
 * @module
 */
import { instantiate } from "./lib/pkg/dnt_wasm.generated.js";
import { valueToUrl } from "./lib/utils.js";
/** Analyzes the provided entry point to get all the dependended on modules and
 * outputs canonical TypeScript code in memory. The output of this function
 * can then be sent to the TypeScript compiler or a bundler for further processing. */
export async function transform(options) {
    if (options.entryPoints.length === 0) {
        throw new Error("Specify one or more entry points.");
    }
    const newOptions = {
        ...options,
        mappings: Object.fromEntries(Object.entries(options.mappings ?? {}).map(([key, value]) => {
            return [valueToUrl(key), mapMappedSpecifier(value)];
        })),
        entryPoints: options.entryPoints.map(valueToUrl),
        testEntryPoints: (options.testEntryPoints ?? []).map(valueToUrl),
        shims: (options.shims ?? []).map(mapShim),
        testShims: (options.testShims ?? []).map(mapShim),
        target: options.target,
        importMap: options.importMap == null
            ? undefined
            : valueToUrl(options.importMap),
    };
    const wasmFuncs = await instantiate({
        url: options.internalWasmUrl ? new URL(options.internalWasmUrl) : undefined,
    });
    return wasmFuncs.transform(newOptions);
}
function mapMappedSpecifier(value) {
    if (typeof value === "string") {
        if (isPathOrUrl(value)) {
            return {
                kind: "module",
                value: valueToUrl(value),
            };
        }
        else {
            return {
                kind: "package",
                value: {
                    name: value,
                },
            };
        }
    }
    else {
        return {
            kind: "package",
            value,
        };
    }
}
function mapShim(value) {
    const newValue = {
        ...value,
        globalNames: value.globalNames.map(mapToGlobalName),
    };
    if (isPackageShim(newValue)) {
        return { kind: "package", value: newValue };
    }
    else {
        return {
            kind: "module",
            value: {
                ...newValue,
                module: resolveBareSpecifierOrPath(newValue.module),
            },
        };
    }
}
function isPackageShim(value) {
    return value.package != null;
}
function mapToGlobalName(value) {
    if (typeof value === "string") {
        return {
            name: value,
            typeOnly: false,
        };
    }
    else {
        value.typeOnly ??= false;
        return value;
    }
}
function resolveBareSpecifierOrPath(value) {
    value = value.trim();
    if (isPathOrUrl(value)) {
        return valueToUrl(value);
    }
    else {
        return value;
    }
}
function isPathOrUrl(value) {
    value = value.trim();
    return /^[a-z]+:\/\//i.test(value) || // has scheme
        value.startsWith("./") ||
        value.startsWith("../") ||
        /\.[a-z]+$/i.test(value); // has extension
}
