/** this is a cli tool for generating distribution files for your deno project, using [`esbuild`](https://github.com/evanw/esbuild) + [esbuild-deno-loader](https://jsr.io/@luca/esbuild-deno-loader). <br>
 * to provide input file(s), list them as `--input="./path/to/file.ts"` (or `-i="./path/to/file.ts"` for shorthand), and do it for each input file that you have.
 * the paths that you provide must be relative to your configured "deno.json" file (which is also usually your working dir). <br>
 * if no input is provided, this tool reads your "deno.json" file to figure out the entry-points of your library (specified in the {@link DenoJson.exports | exports field}), and then runs esbuild to get your javascript distribution files ready.
 *
 * this tool comes with a handful of useful preset configurations, so that you won't have to write lengthy cli args. <br>
 * take a look at {@link CliArgs} and {@link CliConfigJson} to see what configuration options are available. <br>
 * moreover, to use this document generator via javascript instead of the shell, use the {@link buildDistFn | buildDist} function from the [`dist.ts` file](../dist.ts) (or [`jsr:@oazmi/build-tools/dist`](https://jsr.io/@oazmi/build-tools) if using jsr).
 *
 * @example
 * ```shell
 * # bundle the three files "./src/mod.ts", "./src/plugins/hello.ts", and "./src/plugins/world.ts" in the "./dist/" folder, with code-splitting and minification enabled.
 * deno run -A "jsr:@oazmi/build-tools/cli/dist" --dir="./dist/" --passes=2 --log="basic" --minify --split --input="./src/mod.ts" -i="./src/plugins/hello.ts" -i="./src/plugins/world.ts"
 * ```
 *
 * @example
 * ```shell
 * # do a mock-run (dryrun) of the bundling process of your "deno.json" exports in the "./dist/" folder, with code-splitting and minification enabled.
 * deno run -A "jsr:@oazmi/build-tools/cli/dist" --dir="./dist/" --passes=2 --log="verbose" --minify --split --dryrun
 * ```
 *
 * @module
*/
import "../_dnt.polyfills.js";
import * as dntShim from "../_dnt.shims.js";
import { buildDist as buildDistFn, bundle as bundleFn, esStop, transform as transformFn } from "../dist.js";
import { copyAndCreateFiles, createFiles } from "../funcdefs.js";
import { setLog } from "../logger.js";
import { parseArgs } from "./deps.js";
const { input, i, ...cli_args } = parseArgs(dntShim.Deno.args, {
    collect: ["input"],
    alias: { input: ["i"] },
});
const { config: config_path, ...rest_cli_args } = cli_args;
const config_file = config_path
    ? JSON.parse(await dntShim.Deno.readTextFile(config_path))
    : {};
if (input && (input.length > 0)) {
    (config_file.buildDist ??= {}).input = input;
}
const { deno = "./deno.json", dir = "./dist/", log = false, passes = "1", format = "esm", minify = "syntax", split = false, transform = [{ pattern: "**.js", loader: "js", options: { minify: true, platform: "browser", format: "esm", target: "esnext" } }], esbuild: esbuild_config, ...combined_config } = { ...config_file.buildDist, ...rest_cli_args };
const esbuild = {
    ...esbuild_config,
    format,
    splitting: split,
    minify: (minify === true || minify === false) ? minify : undefined,
    minifyIdentifiers: minify === "identifiers" ? true : undefined,
    minifySyntax: minify === "syntax" ? true : undefined,
    minifyWhitespace: minify === "whitespace" ? true : undefined,
};
const config = {
    ...combined_config, esbuild, dir, deno
};
setLog({ log });
let artifacts_info;
if (passes == "2") {
    // we shall now perform double compilation (bundling then transformation)
    const { copy, text, dryrun, ...bundle_config } = config, bundled_files = await bundleFn(bundle_config), transformed_files = await transformFn(bundled_files, transform);
    await createFiles(transformed_files, { dir, dryrun });
    await copyAndCreateFiles({ deno, dir, copy, text, dryrun });
}
else {
    // a single pass compilation can be done by esbuild natively
    artifacts_info = await buildDistFn(config);
}
// it is important that we stop esbuild manually, otherwise the deno process will not quit automatically.
await esStop();