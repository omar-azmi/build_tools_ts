/** this is a cli tool for generating a documentation site for your deno project, using [`typedoc`](https://github.com/TypeStrong/typedoc) under the hood. <br>
 * this tool reads your "deno.json" file and generates a equivalent "package.json" and "tsconfig.json" files, which can then be used by `TypeDoc` for generating the documentation site's html files.
 * this tool comes with a handful of useful preset configurations, so that you won't have to write lengthy cli args. <br>
 * take a look at {@link CliArgs} and {@link CliConfigJson} to see what configuration options are available. <br>
 * moreover, to use this document generator via javascript instead of the shell, use the {@link buildDocsFn | buildDocs} function from the [`docs.ts` file](../docs.ts) (or [`jsr:@oazmi/build-tools/docs`](https://jsr.io/@oazmi/build-tools) if using jsr).
 *
 * @module
*/
import "../_dnt.polyfills.js";
import { type BuildDocsConfig } from "../docs.js";
/** the cli args for generating the documentation of your deno project to via the {@link buildDocsFn | buildDocs} function. */
export interface CliArgs {
    /** {@inheritDoc BuildDocsConfig.dir} */
    dir?: BuildDocsConfig["dir"];
    /** {@inheritdoc BuildDocsConfig.deno} */
    deno?: BuildDocsConfig["deno"];
    /** {@inheritdoc BuildDocsConfig.log} */
    log?: BuildDocsConfig["log"];
    /** {@inheritdoc BuildDocsConfig.dryrun} */
    dryrun?: BuildDocsConfig["dryrun"];
    /** {@inheritdoc BuildDocsConfig.site} */
    site?: BuildDocsConfig["site"];
    /** {@inheritdoc BuildDocsConfig.preserveTemporary} */
    preserveTemporary?: BuildDocsConfig["preserveTemporary"];
    /** a path to an docs-build configuration json file that provides additional modifiable parameters.
     * see {@link CliConfigJson} for more details on the available extended configurations.
     * in case there is a contradiction between the {@link CliConfigJson} setting and the current cli args, the cli arg will take precedence.
    */
    config?: string;
}
/** contains the relevant fields within the {@link CliConfigJson | configuration json file}, that are used for configuring documentation generation. */
export interface CliDocsConfig extends Omit<CliArgs, "config"> {
    /** {@inheritdoc BuildDocsConfig.copy} */
    copy?: BuildDocsConfig["copy"];
    /** {@inheritdoc BuildDocsConfig.text} */
    text?: BuildDocsConfig["text"];
    /** {@inheritdoc BuildDocsConfig.css} */
    css?: BuildDocsConfig["css"];
    /** {@inheritdoc BuildDocsConfig.typedoc} */
    typedoc?: BuildDocsConfig["typedoc"];
}
/** the schema of a docs-generation configuration json file, which can be referenced in the {@link CliArgs}, by passing its file-path with the `--config` switch. <br>
 * notice that there is only one property named {@link buildDocs | `buildDocs`}, which then holds all of the relevant configuration (as specified in {@link CliDocsConfig}).
 * this is because doing so allows one to embed this configuration within other json files, such as "deno.json" itself, or a single dedicated configuration json file,
 * containing the configurations of different build tools altogether. <br>
 * in case there is a contradiction between the configurations in this json file and the current cli args, the cli arg will take precedence.
*/
export interface CliConfigJson {
    buildDocs?: CliDocsConfig;
}
//# sourceMappingURL=docs.d.ts.map