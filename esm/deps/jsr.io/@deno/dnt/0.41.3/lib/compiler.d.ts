import { ts } from "../../../../@ts-morph/bootstrap/0.24.0/mod.js";
import type { ScriptTarget } from "./types.js";
export declare function outputDiagnostics(diagnostics: readonly ts.Diagnostic[]): void;
export declare function getCompilerScriptTarget(target: ScriptTarget): ts.ScriptTarget.ES3 | ts.ScriptTarget.ES5 | ts.ScriptTarget.ES2015 | ts.ScriptTarget.ES2016 | ts.ScriptTarget.ES2017 | ts.ScriptTarget.ES2018 | ts.ScriptTarget.ES2019 | ts.ScriptTarget.ES2020 | ts.ScriptTarget.ES2021 | ts.ScriptTarget.ES2022 | ts.ScriptTarget.ES2023 | ts.ScriptTarget.ESNext;
export type LibName = "ES5" | "ES6" | "ES2015" | "ES7" | "ES2016" | "ES2017" | "ES2018" | "ES2019" | "ES2020" | "ES2021" | "ES2022" | "ES2023" | "ESNext" | "DOM" | "DOM.Iterable" | "WebWorker" | "WebWorker.ImportScripts" | "WebWorker.Iterable" | "ScriptHost" | "ES2015.Core" | "ES2015.Collection" | "ES2015.Generator" | "ES2015.Iterable" | "ES2015.Promise" | "ES2015.Proxy" | "ES2015.Reflect" | "ES2015.Symbol" | "ES2015.Symbol.WellKnown" | "ES2016.Array.Include" | "ES2017.Date" | "ES2017.Object" | "ES2017.SharedMemory" | "ES2017.String" | "ES2017.Intl" | "ES2017.TypedArrays" | "ES2018.AsyncGenerator" | "ES2018.AsyncIterable" | "ES2018.Intl" | "ES2018.Promise" | "ES2018.RegExp" | "ES2019.Array" | "ES2019.Object" | "ES2019.String" | "ES2019.Symbol" | "ES2019.Intl" | "ES2020.Bigint" | "ES2020.Date" | "ES2020.Promise" | "ES2020.SharedMemory" | "ES2020.String" | "ES2020.Symbol.WellKnown" | "ES2020.Intl" | "ES2020.Number" | "ES2021.Promise" | "ES2021.String" | "ES2021.WeakRef" | "ES2021.Intl" | "ES2022.Array" | "ES2022.Error" | "ES2022.Intl" | "ES2022.Object" | "ES2022.SharedMemory" | "ES2022.String" | "ES2022.RegExp" | "ES2023.Array" | "ES2023.Collection" | "ESNext.Array" | "ESNext.Collection" | "ESNext.Symbol" | "ESNext.AsyncIterable" | "ESNext.Intl" | "ESNext.Disposable" | "ESNext.BigInt" | "ESNext.String" | "ESNext.Promise" | "ESNext.WeakRef" | "ESNext.Decorators" | "Decorators" | "Decorators.Legacy";
export declare function getCompilerLibOption(target: ScriptTarget): LibName[];
export declare function libNamesToCompilerOption(names: LibName[]): string[];
export type SourceMapOptions = "inline" | boolean;
export declare function getCompilerSourceMapOptions(sourceMaps: SourceMapOptions | undefined): {
    inlineSourceMap?: boolean;
    sourceMap?: boolean;
};
export declare function getTopLevelAwaitLocation(sourceFile: ts.SourceFile): ts.LineAndCharacter | undefined;
export declare function transformCodeToTarget(code: string, target: ts.ScriptTarget): string;
//# sourceMappingURL=compiler.d.ts.map