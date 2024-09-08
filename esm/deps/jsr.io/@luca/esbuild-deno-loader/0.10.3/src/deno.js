import * as dntShim from "../../../../../../_dnt.shims.js";
export async function rootInfo() {
    if (!tmpDir)
        tmpDir = dntShim.Deno.makeTempDirSync();
    const opts = {
        args: ["info", "--json", "--no-config", "--no-lock"],
        cwd: tmpDir,
        env: { DENO_NO_PACKAGE_JSON: "true" },
        stdout: "piped",
        stderr: "inherit",
    };
    const output = await new dntShim.Deno.Command(dntShim.Deno.execPath(), opts).output();
    if (!output.success) {
        throw new Error(`Failed to call 'deno info'`);
    }
    const txt = new TextDecoder().decode(output.stdout);
    return JSON.parse(txt);
}
let tmpDir;
async function info(specifier, options) {
    const opts = {
        args: ["info", "--json"],
        cwd: undefined,
        env: { DENO_NO_PACKAGE_JSON: "true" },
        stdout: "piped",
        stderr: "inherit",
    };
    if (typeof options.config === "string") {
        opts.args.push("--config", options.config);
    }
    else {
        opts.args.push("--no-config");
    }
    if (options.importMap) {
        opts.args.push("--import-map", options.importMap);
    }
    if (typeof options.lock === "string") {
        opts.args.push("--lock", options.lock);
    }
    else if (!options.cwd) {
        opts.args.push("--no-lock");
    }
    if (options.nodeModulesDir) {
        opts.args.push("--node-modules-dir");
    }
    if (options.cwd) {
        opts.cwd = options.cwd;
    }
    else {
        if (!tmpDir)
            tmpDir = dntShim.Deno.makeTempDirSync();
        opts.cwd = tmpDir;
    }
    opts.args.push(specifier);
    const output = await new dntShim.Deno.Command(dntShim.Deno.execPath(), opts).output();
    if (!output.success) {
        throw new Error(`Failed to call 'deno info' on '${specifier}'`);
    }
    const txt = new TextDecoder().decode(output.stdout);
    return JSON.parse(txt);
}
export class InfoCache {
    #options;
    #pending = null;
    #modules = new Map();
    #redirects = new Map();
    #npmPackages = new Map();
    constructor(options = {}) {
        this.#options = options;
    }
    async get(specifier) {
        let entry = this.#getCached(specifier);
        if (entry !== undefined)
            return entry;
        await this.#queueLoad(specifier);
        entry = this.#getCached(specifier);
        if (entry === undefined) {
            throw new Error(`Unreachable: '${specifier}' loaded but not reachable`);
        }
        return entry;
    }
    getNpmPackage(id) {
        return this.#npmPackages.get(id);
    }
    #resolve(specifier) {
        return this.#redirects.get(specifier) ?? specifier;
    }
    #getCached(specifier) {
        specifier = this.#resolve(specifier);
        return this.#modules.get(specifier);
    }
    async #queueLoad(specifier) {
        while (true) {
            if (this.#pending === null) {
                this.#pending = {
                    specifiers: new Set([specifier]),
                    done: (async () => {
                        await new Promise((r) => setTimeout(r, 5));
                        const specifiers = this.#pending.specifiers;
                        this.#pending.specifiers = null;
                        await this.#load([...specifiers]);
                        this.#pending = null;
                    })(),
                };
                await this.#pending.done;
                return;
            }
            else if (this.#pending.specifiers !== null) {
                this.#pending.specifiers.add(specifier);
                await this.#pending.done;
                return;
            }
            else {
                await this.#pending.done;
            }
        }
    }
    async #load(specifiers) {
        await this.#populate(specifiers);
        for (let specifier of specifiers) {
            specifier = this.#resolve(specifier);
            const entry = this.#modules.get(specifier);
            if (entry === undefined && specifier.startsWith("npm:")) {
                // we hit https://github.com/denoland/deno/issues/18043, so we have to
                // perform another load to get the actual data of the redirected specifier
                await this.#populate([specifier]);
            }
        }
    }
    async #populate(specifiers) {
        let specifier;
        if (specifiers.length === 1) {
            specifier = specifiers[0];
        }
        else {
            specifier = `data:application/javascript,${encodeURIComponent(specifiers.map((s) => `import ${JSON.stringify(s)};`).join(""))}`;
        }
        const { modules, redirects, npmPackages } = await info(specifier, this.#options);
        for (const module of modules) {
            if (specifiers.length !== 1 && module.specifier === specifier)
                continue;
            this.#modules.set(module.specifier, module);
        }
        for (const [from, to] of Object.entries(redirects)) {
            this.#redirects.set(from, to);
        }
        for (const [id, npmPackage] of Object.entries(npmPackages)) {
            this.#npmPackages.set(id, npmPackage);
        }
    }
}
