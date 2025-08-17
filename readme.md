# @oazmi/build-tools

This package contains various convenience tools for codebase transformation, documentation generation, and code bundling.

Under the hood, it relies on:

- [`esbuild`](https://www.npmjs.com/package/esbuild) + [`@oazmi/esbuild-plugin-deno`](https://jsr.io/@oazmi/esbuild-plugin-deno) for bundling ({@link dist!}).
- [`dnt`](https://jsr.io/@deno/dnt) for deno to node project transformation ({@link docs!}).
- [`typedoc`](https://www.npmjs.com/package/typedoc) for documentation generation ({@link npm!}).

## Building Typescript Documentation

### Through the CLI

To generate documentation for your typescript project through the shell, simply run:

```shell
deno run -A "jsr:@oazmi/build-tools/cli/docs"
```

You may also provide a json file containing a documentation-generation configuration, by passing its location using the cli `--config="./path/to/config.json"`, and then using the schema in {@link cli/docs!CliConfigJson | `CliConfigJson`} to configure the json bundling options. <br>
See the {@link cli/docs!} module's documentation for further reading.

### Through Scripting

To generate documentation through scripting, use the {@link docs!buildDocs | `buildDocs`} function. <br>
Read the {@link docs!} module's documentation for advanced usage.

An example to get a taste of the configurable options:

```ts
import { buildDocs, type BuildDocsConfig, defaultBuildDocsConfig } from "jsr:@oazmi/build-tools/docs"

const my_config: BuildDocsConfig = {
	...defaultBuildDocsConfig,
	dir: "./mydocs/",
	site: "./mydocs/",
	preserveTemporary: false,
	typedoc: {
		// place optional typedoc configurations here
		githubPages: true,
	},
	text: ["./helloworld.txt", "Konichiwa Meena-San!\nShine' Kuda Sai Meena-San!\nSosshtte Arigato yo Meena-San Desu Desu!"],
}
const docs_artifacts = await buildDocs(my_config)
alert("press any button to delete the generated docs in:", my_config.dir)
// cleanup the generated documentation html site under "./mydocs/"
docs_artifacts.cleanup()
```

## Transforming Deno project to Node project

### Through the CLI

To transform your deno project to a node-based project through the shell, simply run:

```shell
deno run -A "jsr:@oazmi/build-tools/cli/npm" --install
```

You may also provide a json file containing a node-project-generation configuration, by passing its location using the cli `--config="./path/to/config.json"`, and then using the schema in {@link cli/npm!CliConfigJson | `CliConfigJson`} to configure the json bundling options. <br>
See the {@link cli/npm!} module's documentation for further reading.

### Through Scripting

To transform to a node-based project through scripting, use the {@link npm!buildNpm | `buildNpm`} function. <br>
Read the {@link npm!} module's documentation for advanced usage.

An example to catch a whiff of stinky node's configurable options:

```ts
import { buildNpm, type BuildNpmConfig, defaultBuildNpmConfig } from "jsr:@oazmi/build-tools/npm"

const my_config: BuildNpmConfig = {
	...defaultBuildNpmConfig,
	dir: "./npm-release/",
	dnt: {
		// place optional dnt configurations here
		typeCheck: true,
		declaration: "inline",
		test: true,
		skipNpmInstall: false,
	},
	text: ["./helloworld.txt", "Konichiwa Meena-San!\nShine' Kuda Sai Meena-San!\nSosshtte Arigato yo Meena-San Desu Desu!"],
}
const npm_artifacts = await buildNpm(my_config)
alert("press any button to delete the generated npm-build in:", my_config.dir)
// cleanup the generated npm-build under "./npm-release/"
npm_artifacts.cleanup()
```

## Bundle Source Code to Javascript

### Through the CLI

To create a bundled and minified distribution of your deno project's exports through the shell, simply run:

```shell
deno run -A "jsr:@oazmi/build-tools/cli/dist"
```

Check out the {@link cli/dist!CliArgs | `CliArgs`} interface for a list of configurable options via command line switches (i.e. `--command-name="command_value"`)

You may also provide a json file containing a bundling configuration, by passing its location using the cli `--config="./path/to/config.json"`, and then using the schema in {@link cli/dist!CliConfigJson | `CliConfigJson`} to configure the json bundling options. <br>
See the {@link cli/dist!} module's documentation for further reading.

### Through Scripting

To bundle your source code to javascript through scripting, use the {@link dist!buildDist | `buildDist`} function for single-pass builds, and for double-pass builds use: {@link dist!bundle | `bundle`} + {@link dist!transform | `transform`} + {@link funcdefs!createFiles | `createFiles`} sequentially. <br>
Read the {@link dist!} module's documentation for advanced usage.

An example to get a flavor of the configurable options:

```ts
import { buildDist, type BuildDistConfig, defaultBuildDistConfig, esStop } from "jsr:@oazmi/build-tools/dist"

const my_config: BuildDistConfig = {
	...defaultBuildDistConfig,
	// when no input files are provided, the function reads your "deno.json" file to use its "exports" field as the input.
	input: {
		"my-lib.js": "./src/mod.ts",
		"plugins/hello.js": "./src/plugins/hello.ts",
		"plugins/world.js": "./src/plugins/world.ts",
	},
	deno: "./deno.json",
	dir: "./dist/",
	log: "verbose",
	// enabling `splitting` makes the `input` entrypoints use the same source for shared code.
	esbuild: { splitting: true },
}
await buildDist(my_config)
// your output files are now saved to: "./dist/my-lib.js", "./dist/plugins/hello.js", and "./dist/plugins/world.js"

// it is important that you stop esbuild manually, otherwise the deno process will not quit automatically.
await esStop()
```
