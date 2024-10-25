/** Gets the files found in the provided root dir path based on the glob. */
export declare function glob(options: {
    pattern: string;
    rootDir: string;
    excludeDirs: string[];
}): Promise<string[]>;
export declare function runNpmCommand({ bin, args, cwd }: {
    bin: string;
    args: string[];
    cwd: string;
}): Promise<void>;
export declare function runCommand(opts: {
    cmd: string[];
    cwd: string;
}): Promise<void>;
export declare function standardizePath(fileOrDirPath: string): string;
export declare function valueToUrl(value: string): string;
export declare function getDntVersion(url?: string): string;
//# sourceMappingURL=utils.d.ts.map