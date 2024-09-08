// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
function isNumber(x) {
    if (/^0x[0-9a-f]+$/i.test(String(x)))
        return true;
    return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(String(x));
}
function setNested(object, keys, value, collect = false) {
    keys.slice(0, -1).forEach((key) => {
        object[key] ??= {};
        object = object[key];
    });
    const key = keys.at(-1);
    if (collect) {
        const v = object[key];
        if (Array.isArray(v)) {
            v.push(value);
            return;
        }
        value = v ? [v, value] : [value];
    }
    object[key] = value;
}
function hasNested(object, keys) {
    keys = [...keys];
    const lastKey = keys.pop();
    if (!lastKey)
        return false;
    for (const key of keys) {
        if (!object[key])
            return false;
        object = object[key];
    }
    return Object.hasOwn(object, lastKey);
}
function aliasIsBoolean(aliasMap, booleanSet, key) {
    const set = aliasMap.get(key);
    if (set === undefined)
        return false;
    for (const alias of set)
        if (booleanSet.has(alias))
            return true;
    return false;
}
function isBooleanString(value) {
    return value === "true" || value === "false";
}
function parseBooleanString(value) {
    return value !== "false";
}
const FLAG_REGEXP = /^(?:-(?:(?<doubleDash>-)(?<negated>no-)?)?)(?<key>.+?)(?:=(?<value>.+?))?$/s;
/**
 * Take a set of command line arguments, optionally with a set of options, and
 * return an object representing the flags found in the passed arguments.
 *
 * By default, any arguments starting with `-` or `--` are considered boolean
 * flags. If the argument name is followed by an equal sign (`=`) it is
 * considered a key-value pair. Any arguments which could not be parsed are
 * available in the `_` property of the returned object.
 *
 * By default, the flags module tries to determine the type of all arguments
 * automatically and the return type of the `parseArgs` method will have an index
 * signature with `any` as value (`{ [x: string]: any }`).
 *
 * If the `string`, `boolean` or `collect` option is set, the return value of
 * the `parseArgs` method will be fully typed and the index signature of the return
 * type will change to `{ [x: string]: unknown }`.
 *
 * Any arguments after `'--'` will not be parsed and will end up in `parsedArgs._`.
 *
 * Numeric-looking arguments will be returned as numbers unless `options.string`
 * or `options.boolean` is set for that argument name.
 *
 * @param args An array of command line arguments.
 *
 * @typeParam TArgs Type of result.
 * @typeParam TDoubleDash Used by `TArgs` for the result.
 * @typeParam TBooleans Used by `TArgs` for the result.
 * @typeParam TStrings Used by `TArgs` for the result.
 * @typeParam TCollectable Used by `TArgs` for the result.
 * @typeParam TNegatable Used by `TArgs` for the result.
 * @typeParam TDefaults Used by `TArgs` for the result.
 * @typeParam TAliases Used by `TArgs` for the result.
 * @typeParam TAliasArgNames Used by `TArgs` for the result.
 * @typeParam TAliasNames Used by `TArgs` for the result.
 *
 * @return The parsed arguments.
 *
 * @example Usage
 * ```ts
 * import { parseArgs } from "@std/cli/parse-args";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * // For proper use, one should use `parseArgs(Deno.args)`
 * assertEquals(parseArgs(["--foo", "--bar=baz", "./quux.txt"]), {
 *   foo: true,
 *   bar: "baz",
 *   _: ["./quux.txt"],
 * });
 * ```
 */
export function parseArgs(args, { "--": doubleDash = false, alias = {}, boolean = false, default: defaults = {}, stopEarly = false, string = [], collect = [], negatable = [], unknown: unknownFn = (i) => i, } = {}) {
    const aliasMap = new Map();
    const booleanSet = new Set();
    const stringSet = new Set();
    const collectSet = new Set();
    const negatableSet = new Set();
    let allBools = false;
    if (alias) {
        for (const key in alias) {
            const val = alias[key];
            if (val === undefined)
                throw new TypeError("Alias value must be defined");
            const aliases = Array.isArray(val) ? val : [val];
            aliasMap.set(key, new Set(aliases));
            aliases.forEach((alias) => aliasMap.set(alias, new Set([key, ...aliases.filter((it) => it !== alias)])));
        }
    }
    if (boolean) {
        if (typeof boolean === "boolean") {
            allBools = boolean;
        }
        else {
            const booleanArgs = Array.isArray(boolean) ? boolean : [boolean];
            for (const key of booleanArgs.filter(Boolean)) {
                booleanSet.add(key);
                aliasMap.get(key)?.forEach((al) => {
                    booleanSet.add(al);
                });
            }
        }
    }
    if (string) {
        const stringArgs = Array.isArray(string) ? string : [string];
        for (const key of stringArgs.filter(Boolean)) {
            stringSet.add(key);
            aliasMap.get(key)?.forEach((al) => stringSet.add(al));
        }
    }
    if (collect) {
        const collectArgs = Array.isArray(collect) ? collect : [collect];
        for (const key of collectArgs.filter(Boolean)) {
            collectSet.add(key);
            aliasMap.get(key)?.forEach((al) => collectSet.add(al));
        }
    }
    if (negatable) {
        const negatableArgs = Array.isArray(negatable) ? negatable : [negatable];
        for (const key of negatableArgs.filter(Boolean)) {
            negatableSet.add(key);
            aliasMap.get(key)?.forEach((alias) => negatableSet.add(alias));
        }
    }
    const argv = { _: [] };
    function setArgument(key, value, arg, collect) {
        if (!booleanSet.has(key) &&
            !stringSet.has(key) &&
            !aliasMap.has(key) &&
            !(allBools && /^--[^=]+$/.test(arg)) &&
            unknownFn?.(arg, key, value) === false) {
            return;
        }
        if (typeof value === "string" && !stringSet.has(key)) {
            value = isNumber(value) ? Number(value) : value;
        }
        const collectable = collect && collectSet.has(key);
        setNested(argv, key.split("."), value, collectable);
        aliasMap.get(key)?.forEach((key) => {
            setNested(argv, key.split("."), value, collectable);
        });
    }
    let notFlags = [];
    // all args after "--" are not parsed
    const index = args.indexOf("--");
    if (index !== -1) {
        notFlags = args.slice(index + 1);
        args = args.slice(0, index);
    }
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const groups = arg.match(FLAG_REGEXP)?.groups;
        if (groups) {
            const { doubleDash, negated } = groups;
            let key = groups.key;
            let value = groups.value;
            if (doubleDash) {
                if (value) {
                    if (booleanSet.has(key))
                        value = parseBooleanString(value);
                    setArgument(key, value, arg, true);
                    continue;
                }
                if (negated) {
                    if (negatableSet.has(key)) {
                        setArgument(key, false, arg, false);
                        continue;
                    }
                    key = `no-${key}`;
                }
                const next = args[i + 1];
                if (!booleanSet.has(key) &&
                    !allBools &&
                    next &&
                    !/^-/.test(next) &&
                    (aliasMap.get(key)
                        ? !aliasIsBoolean(aliasMap, booleanSet, key)
                        : true)) {
                    value = next;
                    i++;
                    setArgument(key, value, arg, true);
                    continue;
                }
                if (next && isBooleanString(next)) {
                    value = parseBooleanString(next);
                    i++;
                    setArgument(key, value, arg, true);
                    continue;
                }
                value = stringSet.has(key) ? "" : true;
                setArgument(key, value, arg, true);
                continue;
            }
            const letters = arg.slice(1, -1).split("");
            let broken = false;
            for (const [j, letter] of letters.entries()) {
                const next = arg.slice(j + 2);
                if (next === "-") {
                    setArgument(letter, next, arg, true);
                    continue;
                }
                if (/[A-Za-z]/.test(letter) && /=/.test(next)) {
                    setArgument(letter, next.split(/=(.+)/)[1], arg, true);
                    broken = true;
                    break;
                }
                if (/[A-Za-z]/.test(letter) &&
                    /-?\d+(\.\d*)?(e-?\d+)?$/.test(next)) {
                    setArgument(letter, next, arg, true);
                    broken = true;
                    break;
                }
                if (letters[j + 1] && letters[j + 1].match(/\W/)) {
                    setArgument(letter, arg.slice(j + 2), arg, true);
                    broken = true;
                    break;
                }
                setArgument(letter, stringSet.has(letter) ? "" : true, arg, true);
            }
            key = arg.slice(-1);
            if (!broken && key !== "-") {
                const nextArg = args[i + 1];
                if (nextArg &&
                    !/^(-|--)[^-]/.test(nextArg) &&
                    !booleanSet.has(key) &&
                    (aliasMap.get(key)
                        ? !aliasIsBoolean(aliasMap, booleanSet, key)
                        : true)) {
                    setArgument(key, nextArg, arg, true);
                    i++;
                }
                else if (nextArg && isBooleanString(nextArg)) {
                    const value = parseBooleanString(nextArg);
                    setArgument(key, value, arg, true);
                    i++;
                }
                else {
                    setArgument(key, stringSet.has(key) ? "" : true, arg, true);
                }
            }
            continue;
        }
        if (unknownFn?.(arg) !== false) {
            argv._.push(stringSet.has("_") || !isNumber(arg) ? arg : Number(arg));
        }
        if (stopEarly) {
            argv._.push(...args.slice(i + 1));
            break;
        }
    }
    for (const [key, value] of Object.entries(defaults)) {
        const keys = key.split(".");
        if (!hasNested(argv, keys)) {
            setNested(argv, keys, value);
            aliasMap.get(key)?.forEach((key) => setNested(argv, key.split("."), value));
        }
    }
    for (const key of booleanSet.keys()) {
        const keys = key.split(".");
        if (!hasNested(argv, keys)) {
            const value = collectSet.has(key) ? [] : false;
            setNested(argv, keys, value);
        }
    }
    for (const key of stringSet.keys()) {
        const keys = key.split(".");
        if (!hasNested(argv, keys) && collectSet.has(key)) {
            setNested(argv, keys, []);
        }
    }
    if (doubleDash) {
        argv["--"] = [];
        for (const key of notFlags) {
            argv["--"].push(key);
        }
    }
    else {
        for (const key of notFlags) {
            argv._.push(key);
        }
    }
    return argv;
}
