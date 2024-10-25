import * as dntShim from "../../../../../_dnt.shims.js";
import { ensureDir, ensureDirSync } from "../../../@std/fs/0.229.3/ensure_dir.js";
import { expandGlob, expandGlobSync } from "../../../@std/fs/0.229.3/expand_glob.js";
import * as stdPath from "../../../@std/path/0.225.2/mod.js";
// deno-lint-ignore no-explicit-any
export class DenoRuntime {
    fs = new DenoRuntimeFileSystem();
    path = new DenoRuntimePath();
    getEnvVar(name) {
        return dntShim.Deno.env.get(name);
    }
    getEndOfLine() {
        return dntShim.Deno.build.os === "windows" ? "\r\n" : "\n";
    }
    getPathMatchesPattern(path, pattern) {
        return stdPath.globToRegExp(pattern, {
            extended: true,
            globstar: true,
            os: "linux", // use the same behaviour across all operating systems
        }).test(path);
    }
}
class DenoRuntimePath {
    join(...paths) {
        return stdPath.join(...paths);
    }
    normalize(path) {
        return stdPath.normalize(path);
    }
    relative(from, to) {
        return stdPath.relative(from, to);
    }
}
class DenoRuntimeFileSystem {
    delete(path) {
        return dntShim.Deno.remove(path, { recursive: true });
    }
    deleteSync(path) {
        dntShim.Deno.removeSync(path, { recursive: true });
    }
    readDirSync(dirPath) {
        return Array.from(dntShim.Deno.readDirSync(dirPath));
    }
    readFile(filePath, _encoding = "utf-8") {
        return dntShim.Deno.readTextFile(filePath);
    }
    readFileSync(filePath, _encoding = "utf-8") {
        return dntShim.Deno.readTextFileSync(filePath);
    }
    writeFile(filePath, fileText) {
        return dntShim.Deno.writeTextFile(filePath, fileText);
    }
    writeFileSync(filePath, fileText) {
        return dntShim.Deno.writeTextFileSync(filePath, fileText);
    }
    async mkdir(dirPath) {
        await ensureDir(dirPath);
    }
    mkdirSync(dirPath) {
        ensureDirSync(dirPath);
    }
    move(srcPath, destPath) {
        return dntShim.Deno.rename(srcPath, destPath);
    }
    moveSync(srcPath, destPath) {
        dntShim.Deno.renameSync(srcPath, destPath);
    }
    copy(srcPath, destPath) {
        return dntShim.Deno.copyFile(srcPath, destPath);
    }
    copySync(srcPath, destPath) {
        return dntShim.Deno.copyFileSync(srcPath, destPath);
    }
    async stat(filePath) {
        try {
            const stat = await dntShim.Deno.stat(filePath);
            return this.#toStat(stat);
        }
        catch (err) {
            if (err instanceof dntShim.Deno.errors.NotFound)
                return undefined;
            else
                throw err;
        }
    }
    statSync(path) {
        try {
            const stat = dntShim.Deno.statSync(path);
            return this.#toStat(stat);
        }
        catch (err) {
            if (err instanceof dntShim.Deno.errors.NotFound)
                return undefined;
            else
                throw err;
        }
    }
    // deno-lint-ignore no-explicit-any
    #toStat(stat) {
        return {
            isFile() {
                return stat.isFile;
            },
            isDirectory() {
                return stat.isDirectory;
            },
        };
    }
    realpathSync(path) {
        return dntShim.Deno.realPathSync(path);
    }
    getCurrentDirectory() {
        return dntShim.Deno.cwd();
    }
    async glob(patterns) {
        const { excludePatterns, pattern } = globPatternsToPattern(patterns);
        const result = [];
        const globEntries = expandGlob(pattern, {
            root: this.getCurrentDirectory(),
            extended: true,
            globstar: true,
            exclude: excludePatterns,
        });
        for await (const globEntry of globEntries) {
            if (globEntry.isFile)
                result.push(globEntry.path);
        }
        return result;
    }
    globSync(patterns) {
        const { excludePatterns, pattern } = globPatternsToPattern(patterns);
        const result = [];
        const globEntries = expandGlobSync(pattern, {
            root: this.getCurrentDirectory(),
            extended: true,
            globstar: true,
            exclude: excludePatterns,
        });
        for (const globEntry of globEntries) {
            if (globEntry.isFile)
                result.push(globEntry.path);
        }
        return result;
    }
    isCaseSensitive() {
        const platform = dntShim.Deno.build.os;
        return platform !== "windows" && platform !== "darwin";
    }
}
function globPatternsToPattern(patterns) {
    const excludePatterns = [];
    const includePatterns = [];
    for (const pattern of patterns) {
        if (isNegatedGlob(pattern))
            excludePatterns.push(pattern);
        else
            includePatterns.push(pattern);
    }
    return {
        excludePatterns,
        pattern: includePatterns.length === 0 ? "." : includePatterns.length === 1 ? includePatterns[0] : `{${includePatterns.join(",")}}`,
    };
    function isNegatedGlob(glob) {
        // https://github.com/micromatch/is-negated-glob/blob/master/index.js
        return glob[0] === "!" && glob[1] !== "(";
    }
}
