import * as dntShim from "../../../../../_dnt.shims.js";
import { ensureDir, ensureDirSync } from "../../../@std/fs/0.229.3/ensure_dir.js";
import { expandGlob, expandGlobSync } from "../../../@std/fs/0.229.3/expand_glob.js";
import * as stdPath from "../../../@std/path/0.225.2/mod.js";

// deno-lint-ignore no-explicit-any

export class DenoRuntime {
  fs = new DenoRuntimeFileSystem();
  path = new DenoRuntimePath();

  getEnvVar(name: string) {
    return dntShim.Deno.env.get(name);
  }

  getEndOfLine() {
    return dntShim.Deno.build.os === "windows" ? "\r\n" : "\n";
  }

  getPathMatchesPattern(path: string, pattern: string) {
    return stdPath.globToRegExp(pattern, {
      extended: true,
      globstar: true,
      os: "linux", // use the same behaviour across all operating systems
    }).test(path);
  }
}

class DenoRuntimePath {
  join(...paths: string[]) {
    return stdPath.join(...paths);
  }

  normalize(path: string) {
    return stdPath.normalize(path);
  }

  relative(from: string, to: string) {
    return stdPath.relative(from, to);
  }
}

class DenoRuntimeFileSystem {
  delete(path: string) {
    return dntShim.Deno.remove(path, { recursive: true });
  }

  deleteSync(path: string) {
    dntShim.Deno.removeSync(path, { recursive: true });
  }

  readDirSync(dirPath: string) {
    return Array.from(dntShim.Deno.readDirSync(dirPath));
  }

  readFile(filePath: string, _encoding = "utf-8") {
    return dntShim.Deno.readTextFile(filePath);
  }

  readFileSync(filePath: string, _encoding = "utf-8") {
    return dntShim.Deno.readTextFileSync(filePath);
  }

  writeFile(filePath: string, fileText: string) {
    return dntShim.Deno.writeTextFile(filePath, fileText);
  }

  writeFileSync(filePath: string, fileText: string) {
    return dntShim.Deno.writeTextFileSync(filePath, fileText);
  }

  async mkdir(dirPath: string) {
    await ensureDir(dirPath);
  }

  mkdirSync(dirPath: string) {
    ensureDirSync(dirPath);
  }

  move(srcPath: string, destPath: string) {
    return dntShim.Deno.rename(srcPath, destPath);
  }

  moveSync(srcPath: string, destPath: string) {
    dntShim.Deno.renameSync(srcPath, destPath);
  }

  copy(srcPath: string, destPath: string) {
    return dntShim.Deno.copyFile(srcPath, destPath);
  }

  copySync(srcPath: string, destPath: string) {
    return dntShim.Deno.copyFileSync(srcPath, destPath);
  }

  async stat(filePath: string) {
    try {
      const stat = await dntShim.Deno.stat(filePath);
      return this.#toStat(stat);
    } catch (err) {
      if (err instanceof dntShim.Deno.errors.NotFound)
        return undefined;
      else
        throw err;
    }
  }

  statSync(path: string) {
    try {
      const stat = dntShim.Deno.statSync(path);
      return this.#toStat(stat);
    } catch (err) {
      if (err instanceof dntShim.Deno.errors.NotFound)
        return undefined;
      else
        throw err;
    }
  }

  // deno-lint-ignore no-explicit-any
  #toStat(stat: any) {
    return {
      isFile() {
        return stat.isFile;
      },
      isDirectory() {
        return stat.isDirectory;
      },
    };
  }

  realpathSync(path: string) {
    return dntShim.Deno.realPathSync(path);
  }

  getCurrentDirectory(): string {
    return dntShim.Deno.cwd();
  }

  async glob(patterns: ReadonlyArray<string>) {
    const { excludePatterns, pattern } = globPatternsToPattern(patterns);
    const result: string[] = [];
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

  globSync(patterns: ReadonlyArray<string>) {
    const { excludePatterns, pattern } = globPatternsToPattern(patterns);
    const result: string[] = [];
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

function globPatternsToPattern(patterns: ReadonlyArray<string>) {
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

  function isNegatedGlob(glob: string) {
    // https://github.com/micromatch/is-negated-glob/blob/master/index.js
    return glob[0] === "!" && glob[1] !== "(";
  }
}
