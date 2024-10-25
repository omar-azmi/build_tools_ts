export class Project {
    constructor(objs: any, options: any);
    fileSystem: any;
    compilerOptions: CompilerOptionsContainer;
    addSourceFileAtPath(filePath: any, options: any): Promise<any>;
    addSourceFileAtPathSync(filePath: any, options: any): any;
    addSourceFileAtPathIfExists(filePath: any, options: any): Promise<any>;
    addSourceFileAtPathIfExistsSync(filePath: any, options: any): any;
    addSourceFilesByPaths(fileGlobs: any): Promise<any[]>;
    addSourceFilesByPathsSync(fileGlobs: any): any[];
    addSourceFilesFromTsConfig(tsConfigFilePath: any): Promise<any[]>;
    addSourceFilesFromTsConfigSync(tsConfigFilePath: any): any;
    createSourceFile(filePath: any, sourceFileText: any, options: any): ts.SourceFile;
    updateSourceFile(filePathOrSourceFile: any, sourceFileText: any, options: any): void | ts.SourceFile;
    removeSourceFile(filePathOrSourceFile: any): void;
    resolveSourceFileDependencies(): void;
    createProgram(options: any): ts.Program;
    getLanguageService(): ts.LanguageService;
    getSourceFileOrThrow(fileNameOrSearchFunction: any): any;
    getSourceFile(fileNameOrSearchFunction: any): any;
    getSourceFiles(): any[];
    formatDiagnosticsWithColorAndContext(diagnostics: any, opts?: {}): string;
    getModuleResolutionHost(): ts.ModuleResolutionHost;
    #private;
}
export function createProject(options?: {}): Promise<Project>;
export function createProjectSync(options?: {}): Project;
import { ts } from '../../common/0.24.0/mod.js';
export { CompilerOptionsContainer, InMemoryFileSystemHost, ResolutionHosts, SettingsContainer, ts } from "../../common/0.24.0/mod.js";
//# sourceMappingURL=ts_morph_bootstrap.d.ts.map