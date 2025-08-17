import * as dntShim from "../../../../../_dnt.shims.js";
export declare class DenoRuntime {
    fs: DenoRuntimeFileSystem;
    path: DenoRuntimePath;
    getEnvVar(name: string): string | undefined;
    getEndOfLine(): "\r\n" | "\n";
    getPathMatchesPattern(path: string, pattern: string): boolean;
}
declare class DenoRuntimePath {
    join(...paths: string[]): string;
    normalize(path: string): string;
    relative(from: string, to: string): string;
}
declare class DenoRuntimeFileSystem {
    #private;
    delete(path: string): Promise<void>;
    deleteSync(path: string): void;
    readDirSync(dirPath: string): dntShim.Deno.DirEntry[];
    readFile(filePath: string, _encoding?: string): Promise<string>;
    readFileSync(filePath: string, _encoding?: string): string;
    writeFile(filePath: string, fileText: string): Promise<void>;
    writeFileSync(filePath: string, fileText: string): void;
    mkdir(dirPath: string): Promise<void>;
    mkdirSync(dirPath: string): void;
    move(srcPath: string, destPath: string): Promise<void>;
    moveSync(srcPath: string, destPath: string): void;
    copy(srcPath: string, destPath: string): Promise<void>;
    copySync(srcPath: string, destPath: string): void;
    stat(filePath: string): Promise<{
        isFile(): any;
        isDirectory(): any;
    } | undefined>;
    statSync(path: string): {
        isFile(): any;
        isDirectory(): any;
    } | undefined;
    realpathSync(path: string): string;
    getCurrentDirectory(): string;
    glob(patterns: ReadonlyArray<string>): Promise<string[]>;
    globSync(patterns: ReadonlyArray<string>): string[];
    isCaseSensitive(): boolean;
}
export {};
//# sourceMappingURL=DenoRuntime.d.ts.map