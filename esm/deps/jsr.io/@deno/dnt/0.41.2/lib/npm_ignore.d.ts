import type { OutputFile } from "../transform.js";
import type { SourceMapOptions } from "./compiler.js";
export declare function getNpmIgnoreText(options: {
    sourceMap?: SourceMapOptions;
    inlineSources?: boolean;
    testFiles: OutputFile[];
    declaration: "separate" | "inline" | false;
    includeScriptModule: boolean | undefined;
    includeEsModule: boolean | undefined;
}): string;
//# sourceMappingURL=npm_ignore.d.ts.map