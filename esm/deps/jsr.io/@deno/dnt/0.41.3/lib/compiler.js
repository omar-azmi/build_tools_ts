// Copyright 2018-2024 the Deno authors. MIT license.
import * as dntShim from "../../../../../../_dnt.shims.js";
import { ts } from "../../../../@ts-morph/bootstrap/0.24.0/mod.js";
import * as path from "../../../../@std/path/1.0.8/mod.js";
export function outputDiagnostics(diagnostics) {
    const host = {
        getCanonicalFileName: (fileName) => path.resolve(fileName),
        getCurrentDirectory: () => dntShim.Deno.cwd(),
        getNewLine: () => "\n",
    };
    const output = dntShim.Deno.noColor
        ? ts.formatDiagnostics(diagnostics, host)
        : ts.formatDiagnosticsWithColorAndContext(diagnostics, host);
    console.error(output);
}
export function getCompilerScriptTarget(target) {
    switch (target) {
        case "ES3":
            return ts.ScriptTarget.ES3;
        case "ES5":
            return ts.ScriptTarget.ES5;
        case "ES2015":
            return ts.ScriptTarget.ES2015;
        case "ES2016":
            return ts.ScriptTarget.ES2016;
        case "ES2017":
            return ts.ScriptTarget.ES2017;
        case "ES2018":
            return ts.ScriptTarget.ES2018;
        case "ES2019":
            return ts.ScriptTarget.ES2019;
        case "ES2020":
            return ts.ScriptTarget.ES2020;
        case "ES2021":
            return ts.ScriptTarget.ES2021;
        case "ES2022":
            return ts.ScriptTarget.ES2022;
        case "ES2023":
            return ts.ScriptTarget.ES2023;
        case "Latest":
            return ts.ScriptTarget.Latest;
        default:
            throw new Error(`Unknown target compiler option: ${target}`);
    }
}
export function getCompilerLibOption(target) {
    switch (target) {
        case "ES3":
            return [];
        case "ES5":
            return ["ES5"];
        case "ES2015":
            return ["ES2015"];
        case "ES2016":
            return ["ES2016"];
        case "ES2017":
            return ["ES2017"];
        case "ES2018":
            return ["ES2018"];
        case "ES2019":
            return ["ES2019"];
        case "ES2020":
            return ["ES2020"];
        case "ES2021":
            return ["ES2021"];
        case "ES2022":
            return ["ES2022"];
        case "ES2023":
            return ["ES2023"];
        case "Latest":
            return ["ESNext"];
        default: {
            const _assertNever = target;
            throw new Error(`Unknown target compiler option: ${target}`);
        }
    }
}
export function libNamesToCompilerOption(names) {
    const libFileNames = [];
    const libMap = ts.libMap;
    for (const name of names) {
        const fileName = libMap.get(name.toLowerCase());
        if (fileName == null) {
            throw new Error(`Could not find filename for lib: ${name}`);
        }
        else {
            libFileNames.push(fileName);
        }
    }
    return libFileNames;
}
export function getCompilerSourceMapOptions(sourceMaps) {
    switch (sourceMaps) {
        case "inline":
            return { inlineSourceMap: true };
        case true:
            return { sourceMap: true };
        default:
            return {};
    }
}
export function getTopLevelAwaitLocation(sourceFile) {
    const topLevelAwait = getTopLevelAwait(sourceFile);
    if (topLevelAwait !== undefined) {
        return sourceFile.getLineAndCharacterOfPosition(topLevelAwait.getStart(sourceFile));
    }
    return undefined;
}
function getTopLevelAwait(node) {
    if (ts.isAwaitExpression(node)) {
        return node;
    }
    if (ts.isForOfStatement(node) && node.awaitModifier !== undefined) {
        return node;
    }
    return ts.forEachChild(node, (child) => {
        if (!ts.isFunctionDeclaration(child) && !ts.isFunctionExpression(child) &&
            !ts.isArrowFunction(child) && !ts.isMethodDeclaration(child)) {
            return getTopLevelAwait(child);
        }
    });
}
export function transformCodeToTarget(code, target) {
    return ts.transpile(code, {
        target,
    });
}
