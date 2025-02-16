// Copyright 2018-2024 the Deno authors. MIT license.
import * as dntShim from "../../../../../_dnt.shims.js";
import * as colors from "../../../@std/fmt/1.0.5/colors.js";
import * as path from "../../../@std/path/1.0.8/mod.js";
import { createProjectSync, ts } from "../../../@ts-morph/bootstrap/0.24.0/mod.js";
import { getCompilerLibOption, getCompilerScriptTarget, getCompilerSourceMapOptions, getTopLevelAwaitLocation, libNamesToCompilerOption, outputDiagnostics, transformCodeToTarget, } from "./lib/compiler.js";
import { shimOptionsToTransformShims } from "./lib/shims.js";
import { getNpmIgnoreText } from "./lib/npm_ignore.js";
import { glob, runNpmCommand, standardizePath } from "./lib/utils.js";
import { transform, } from "./transform.js";
import * as compilerTransforms from "./lib/compiler_transforms.js";
import { getPackageJson } from "./lib/package_json.js";
import { getTestRunnerCode } from "./lib/test_runner/get_test_runner_code.js";
export { emptyDir } from "../../../@std/fs/1.0.13/empty_dir.js";
/** Builds the specified Deno module to an npm package using the TypeScript compiler. */
export async function build(options) {
    if (options.scriptModule === false && options.esModule === false) {
        throw new Error("`scriptModule` and `esModule` cannot both be `false`");
    }
    // set defaults
    options = {
        ...options,
        outDir: standardizePath(options.outDir),
        entryPoints: options.entryPoints,
        scriptModule: options.scriptModule ?? "cjs",
        esModule: options.esModule ?? true,
        typeCheck: options.typeCheck ?? "single",
        test: options.test ?? true,
        declaration: options.declaration === true
            ? "inline"
            : options.declaration ?? "inline",
    };
    const declarationMap = options.declarationMap ??
        (!!options.declaration && !options.skipSourceOutput);
    const packageManager = options.packageManager ?? "npm";
    const scriptTarget = options.compilerOptions?.target ?? "ES2021";
    const entryPoints = options.entryPoints.map((e, i) => {
        if (typeof e === "string") {
            return {
                name: i === 0 ? "." : e.replace(/\.tsx?$/i, ".js"),
                path: standardizePath(e),
            };
        }
        else {
            return {
                ...e,
                path: standardizePath(e.path),
            };
        }
    });
    await dntShim.Deno.permissions.request({ name: "write", path: options.outDir });
    log("Transforming...");
    const transformOutput = await transformEntryPoints();
    for (const warning of transformOutput.warnings) {
        warn(warning);
    }
    const createdDirectories = new Set();
    const writeFile = (filePath, fileText) => {
        const dir = path.dirname(filePath);
        if (!createdDirectories.has(dir)) {
            dntShim.Deno.mkdirSync(dir, { recursive: true });
            createdDirectories.add(dir);
        }
        dntShim.Deno.writeTextFileSync(filePath, fileText);
    };
    createPackageJson();
    createNpmIgnore();
    // install dependencies in order to prepare for checking TS diagnostics
    const npmInstallPromise = runNpmInstall();
    if (options.typeCheck || options.declaration) {
        // Unfortunately this can't be run in parallel to building the project
        // in this case because TypeScript will resolve the npm packages when
        // creating the project.
        await npmInstallPromise;
    }
    log("Building project...");
    const esmOutDir = path.join(options.outDir, "esm");
    const scriptOutDir = path.join(options.outDir, "script");
    const typesOutDir = path.join(options.outDir, "types");
    const compilerScriptTarget = getCompilerScriptTarget(scriptTarget);
    const project = createProjectSync({
        compilerOptions: {
            outDir: typesOutDir,
            allowJs: true,
            alwaysStrict: true,
            stripInternal: options.compilerOptions?.stripInternal,
            strictBindCallApply: options.compilerOptions?.strictBindCallApply ?? true,
            strictFunctionTypes: options.compilerOptions?.strictFunctionTypes ?? true,
            strictNullChecks: options.compilerOptions?.strictNullChecks ?? true,
            strictPropertyInitialization: options.compilerOptions?.strictPropertyInitialization ?? true,
            suppressExcessPropertyErrors: false,
            suppressImplicitAnyIndexErrors: false,
            noImplicitAny: options.compilerOptions?.noImplicitAny ?? true,
            noImplicitReturns: options.compilerOptions?.noImplicitReturns ?? false,
            noImplicitThis: options.compilerOptions?.noImplicitThis ?? true,
            noStrictGenericChecks: options.compilerOptions?.noStrictGenericChecks ??
                false,
            noUncheckedIndexedAccess: options.compilerOptions?.noUncheckedIndexedAccess ?? false,
            declaration: !!options.declaration,
            declarationMap,
            esModuleInterop: false,
            isolatedModules: true,
            useDefineForClassFields: true,
            experimentalDecorators: true,
            emitDecoratorMetadata: options.compilerOptions?.emitDecoratorMetadata ??
                false,
            jsx: ts.JsxEmit.React,
            jsxFactory: "React.createElement",
            jsxFragmentFactory: "React.Fragment",
            importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
            module: ts.ModuleKind.ESNext,
            moduleResolution: ts.ModuleResolutionKind.Bundler,
            target: compilerScriptTarget,
            lib: libNamesToCompilerOption(options.compilerOptions?.lib ?? getCompilerLibOption(scriptTarget)),
            allowSyntheticDefaultImports: true,
            importHelpers: options.compilerOptions?.importHelpers,
            ...getCompilerSourceMapOptions(options.compilerOptions?.sourceMap),
            inlineSources: options.compilerOptions?.inlineSources,
            skipLibCheck: options.compilerOptions?.skipLibCheck ?? true,
            useUnknownInCatchVariables: options.compilerOptions?.useUnknownInCatchVariables ?? false,
        },
    });
    const binaryEntryPointPaths = new Set(entryPoints.map((e, i) => ({
        kind: e.kind,
        path: transformOutput.main.entryPoints[i],
    })).filter((p) => p.kind === "bin").map((p) => p.path));
    for (const outputFile of [
        ...transformOutput.main.files,
        ...transformOutput.test.files,
    ]) {
        const outputFilePath = path.join(options.outDir, "src", outputFile.filePath);
        const outputFileText = binaryEntryPointPaths.has(outputFile.filePath)
            ? `#!/usr/bin/env node\n${outputFile.fileText}`
            : outputFile.fileText;
        const sourceFile = project.createSourceFile(outputFilePath, outputFileText);
        if (options.scriptModule) {
            // cjs does not support TLA so error fast if we find one
            const tlaLocation = getTopLevelAwaitLocation(sourceFile);
            if (tlaLocation) {
                warn(`Top level await cannot be used when distributing CommonJS/UMD ` +
                    `(See ${outputFile.filePath} ${tlaLocation.line + 1}:${tlaLocation.character + 1}). ` +
                    `Please re-organize your code to not use a top level await or only distribute an ES module by setting the 'scriptModule' build option to false.`);
                throw new Error("Build failed due to top level await when creating CommonJS/UMD package.");
            }
        }
        if (!options.skipSourceOutput) {
            writeFile(outputFilePath, outputFileText);
        }
    }
    let program = getProgramAndMaybeTypeCheck("ESM");
    // emit only the .d.ts files
    if (options.declaration === "separate") {
        log("Emitting declaration files...");
        emit({ onlyDtsFiles: true });
    }
    if (options.esModule) {
        // emit the esm files
        log("Emitting ESM package...");
        project.compilerOptions.set({
            declaration: options.declaration === "inline",
            declarationMap: declarationMap ? options.declaration === "inline" : false,
            outDir: esmOutDir,
        });
        program = project.createProgram();
        emit({
            transformers: {
                before: [compilerTransforms.transformImportMeta],
            },
        });
        writeFile(path.join(esmOutDir, "package.json"), `{\n  "type": "module"\n}\n`);
    }
    // emit the script files
    if (options.scriptModule) {
        log("Emitting script package...");
        project.compilerOptions.set({
            declaration: options.declaration === "inline",
            declarationMap: declarationMap ? options.declaration === "inline" : false,
            esModuleInterop: true,
            outDir: scriptOutDir,
            module: options.scriptModule === "umd"
                ? ts.ModuleKind.UMD
                : ts.ModuleKind.CommonJS,
            moduleResolution: ts.ModuleResolutionKind.Node10,
        });
        program = getProgramAndMaybeTypeCheck("script");
        emit({
            transformers: {
                before: [compilerTransforms.transformImportMeta],
            },
        });
        writeFile(path.join(scriptOutDir, "package.json"), `{\n  "type": "commonjs"\n}\n`);
    }
    // ensure this is done before running tests
    await npmInstallPromise;
    // run post build action
    if (options.postBuild) {
        log("Running post build action...");
        await options.postBuild();
    }
    if (options.test) {
        log("Running tests...");
        createTestLauncherScript();
        await runNpmCommand({
            bin: packageManager,
            args: ["run", "test"],
            cwd: options.outDir,
        });
    }
    log("Complete!");
    function emit(opts) {
        const emitResult = program.emit(undefined, (filePath, data, writeByteOrderMark) => {
            if (writeByteOrderMark) {
                data = "\uFEFF" + data;
            }
            writeFile(filePath, data);
        }, undefined, opts?.onlyDtsFiles, opts?.transformers);
        if (emitResult.diagnostics.length > 0) {
            outputDiagnostics(emitResult.diagnostics);
            throw new Error(`Had ${emitResult.diagnostics.length} emit diagnostics.`);
        }
    }
    function getProgramAndMaybeTypeCheck(current) {
        // When creating the program and type checking, we need to ensure that
        // the cwd is the directory that contains the node_modules directory
        // so that TypeScript will read it and resolve any @types/ packages.
        // This is done in `getAutomaticTypeDirectiveNames` of TypeScript's code.
        const originalDir = dntShim.Deno.cwd();
        let program;
        dntShim.Deno.chdir(options.outDir);
        try {
            program = project.createProgram();
            if (shouldTypeCheck()) {
                log(`Type checking ${current}...`);
                const diagnostics = filterDiagnostics(ts.getPreEmitDiagnostics(program)).filter((d) => options.filterDiagnostic?.(d) ?? true);
                if (diagnostics.length > 0) {
                    outputDiagnostics(diagnostics);
                    throw new Error(`Had ${diagnostics.length} diagnostics.`);
                }
            }
            return program;
        }
        finally {
            dntShim.Deno.chdir(originalDir);
        }
        function filterDiagnostics(diagnostics) {
            // we transform import.meta's when outputting a script, so ignore these diagnostics
            return diagnostics.filter((d) => 
            // 1343: The_import_meta_meta_property_is_only_allowed_when_the_module_option_is_es2020_es2022_esnext_system_node16_or_nodenext
            d.code !== 1343 &&
                // 1470: The_import_meta_meta_property_is_not_allowed_in_files_which_will_build_into_CommonJS_output
                d.code !== 1470 &&
                (options.filterDiagnostic?.(d) ?? true));
        }
        function shouldTypeCheck() {
            const typeCheck = options.typeCheck;
            switch (typeCheck) {
                case "both":
                    return true;
                case false:
                    return false;
                case "single":
                    if (options.esModule) {
                        return current === "ESM";
                    }
                    if (options.scriptModule) {
                        return current === "script";
                    }
                    return false;
                default: {
                    const _assertNever = typeCheck;
                    warn(`Unknown type check option: ${typeCheck}`);
                    return false;
                }
            }
        }
    }
    function createPackageJson() {
        if (options.package?.files != null) {
            warn("Specifying `files` for the package.json is not recommended " +
                "because it will cause the .npmignore file to not be respected.");
        }
        const packageJsonObj = getPackageJson({
            entryPoints,
            transformOutput,
            package: options.package,
            testEnabled: options.test,
            includeEsModule: options.esModule !== false,
            includeScriptModule: options.scriptModule !== false,
            includeDeclarations: options.declaration === "separate",
            includeTsLib: options.compilerOptions?.importHelpers,
            shims: options.shims,
        });
        writeFile(path.join(options.outDir, "package.json"), JSON.stringify(packageJsonObj, undefined, 2));
    }
    function createNpmIgnore() {
        const fileText = getNpmIgnoreText({
            sourceMap: options.compilerOptions?.sourceMap,
            inlineSources: options.compilerOptions?.inlineSources,
            testFiles: transformOutput.test.files,
            includeScriptModule: options.scriptModule !== false,
            includeEsModule: options.esModule !== false,
            declaration: options.declaration,
        });
        writeFile(path.join(options.outDir, ".npmignore"), fileText);
    }
    function runNpmInstall() {
        if (options.skipNpmInstall) {
            return Promise.resolve();
        }
        log(`Running ${packageManager} install...`);
        return runNpmCommand({
            bin: packageManager,
            args: ["install"],
            cwd: options.outDir,
        });
    }
    async function transformEntryPoints() {
        const { shims, testShims } = shimOptionsToTransformShims(options.shims);
        return transform({
            entryPoints: entryPoints.map((e) => e.path),
            testEntryPoints: options.test
                ? await glob({
                    pattern: getTestPattern(),
                    rootDir: options.rootTestDir ?? dntShim.Deno.cwd(),
                    excludeDirs: [options.outDir],
                })
                : [],
            shims,
            testShims,
            mappings: options.mappings,
            target: scriptTarget,
            importMap: options.importMap,
            internalWasmUrl: options.internalWasmUrl,
        });
    }
    function log(message) {
        console.log(`[dnt] ${message}`);
    }
    function warn(message) {
        console.warn(colors.yellow(`[dnt] ${message}`));
    }
    function createTestLauncherScript() {
        const denoTestShimPackage = getDependencyByName("@deno/shim-deno-test") ??
            getDependencyByName("@deno/shim-deno");
        writeFile(path.join(options.outDir, "test_runner.js"), transformCodeToTarget(getTestRunnerCode({
            denoTestShimPackageName: denoTestShimPackage == null
                ? undefined
                : denoTestShimPackage.name === "@deno/shim-deno"
                    ? "@deno/shim-deno/test-internals"
                    : denoTestShimPackage.name,
            testEntryPoints: transformOutput.test.entryPoints,
            includeEsModule: options.esModule !== false,
            includeScriptModule: options.scriptModule !== false,
        }), compilerScriptTarget));
        function getDependencyByName(name) {
            return transformOutput.test.dependencies.find((d) => d.name === name) ??
                transformOutput.main.dependencies.find((d) => d.name === name);
        }
    }
    function getTestPattern() {
        // * named `test.{ts, mts, tsx, js, mjs, jsx}`,
        // * or ending with `.test.{ts, mts, tsx, js, mjs, jsx}`,
        // * or ending with `_test.{ts, mts, tsx, js, mjs, jsx}`
        return options.testPattern ??
            "**/{test.{ts,mts,tsx,js,mjs,jsx},*.test.{ts,mts,tsx,js,mjs,jsx},*_test.{ts,mts,tsx,js,mjs,jsx}}";
    }
}
