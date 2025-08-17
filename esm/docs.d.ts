import { type TypeDocOptions } from "typedoc";
import type { BaseBuildConfig, TemporaryFiles } from "./typedefs.js";
export type { TypeDocOptions } from "typedoc";
/** the configuration for the documentation building function {@link buildDocs}. */
export interface BuildDocsConfig extends BaseBuildConfig {
    /** the desired output directory for the generated docs.
     * if a relative path is provided, then it will be resolved as a path relative to Deno's current working directory. (which is generally where `deno.json` resides.)
     *
     * @defaultValue `"./docs/"`
    */
    dir: string;
    /** the root subpath in the website of the documentation (where the readme goes).
     * for instance, if your domain name is `"www.example.com"`, and your documentation's root should be at `"www.example.com/docs/"`,
     * then this option should be set to `"docs/"` (leading and trailing slashes will be trimmed, i.e. this option is invariant of them).
     * if you leave this option `undefined`, then the script will use your {@link deno | "deno.json"} configuration's {@link DenoJson.repository | `"repository"`} key to parse the github-url,
     * and then assign the site's root subpath to your repository's name, so that it is compatible with github-pages.
     * otherwise, if no `"repository"` is present in your {@link deno | "deno.json"}, then an empty string (`""`) will be assigned,
     * so that the webpage's root is also the documentation pages' root.
    */
    site?: string | undefined;
    /** add custom css styles to be applied to your rendered html pages. <br>
     * you should provide the css content in string-text format here, and the {@link buildDocs} function will convert it to a css file in your "deno.json" directory.
     * after that, its path will be provided to TypeDoc's {@link TypeDocOptions.customCss} property, which in turn will render the html documentation with the cutom css file referenced.
    */
    css?: string;
    /** [`typedoc`](https://www.npmjs.com/package/typedoc) related additional documentation building options for you to configure. */
    typedoc?: Omit<Partial<TypeDocOptions>, "entryPoints" | "out" | "skipErrorChecking">;
    /** specify whether to preserve the intermediate temporary files created for document generation.
     * the three temporary files that are generated for document generation, relative to {@link deno | "deno.json" directory} are: `package.json`, `tsconfig.json`, and `./temp/custom.css`.
     *
     * @defaultValue `false`
    */
    preserveTemporary?: boolean;
}
/** the default configuration used by the {@link buildDocs} function, for missing/unprovided configuration fields. */
export declare const defaultBuildDocsConfig: BuildDocsConfig;
/** this function generates code documentation of your deno-project, using [`typedoc`](https://github.com/TypeStrong/typedoc).
 * this function first reads your "deno.json" file to generate an equivalent "package.json" and "tsconfig.json" files, and then it runs `typedoc` to generate the documentation html site. <br>
 * take a look at {@link BuildDocsConfig} to see what configuration options are available. <br>
 * moreover, to use this transformer via cli, use the [`./cli/docs.ts`](./cli/docs.ts) script file (or [`jsr:@oazmi/build-tools/cli/docs`](https://jsr.io/@oazmi/build-tools) if using jsr), and take a look at its {@link CliArgs} for list of supported cli args.
*/
export declare const buildDocs: (build_config?: Partial<BuildDocsConfig>) => Promise<TemporaryFiles>;
//# sourceMappingURL=docs.d.ts.map