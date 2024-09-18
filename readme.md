# @oazmi/build-tools

This package contains various convenience tools for codebase transformation, documentation generation, and code bundling.

Under the hood, it relies on:
- [`esbuild`](https://www.npmjs.com/package/esbuild) + [`esbuild-deno-loader`](https://jsr.io/@luca/esbuild-deno-loader) for bundling.
- [`dnt`](https://jsr.io/@deno/dnt) for deno to node project transformation.
- [`typedoc`](https://www.npmjs.com/package/typedoc) for documentation generation.


## Building Typescript Documentation

### Through the CLI
To generate documentation for your typescript project through the shell, simply run:
```shell
deno run -A "jsr:@oazmi/build-tools/cli/docs"
```

### Through Scripting
To generate documentation through scripting (and get an understanding of the configurable options), follow the example:

```ts
import { buildDocs, defaultBuildDocsConfig, type BuildDocsConfig } from "jsr:@oazmi/build-tools/docs"

const my_config: BuildDocsConfig = {
	...defaultBuildDocsConfig,
	dir: "./mydocs/",
	site: "./mydocs/",
	preserveTemporary: false,
	typedoc: {
		// place optional typedoc configurations here
		githubPages: true,
	},
	text: ["./helloworld.txt", "Konichiwa Meena-San!\nShine\' Kuda Sai Meena-San!\nSosshtte Arigato yo Meena-San Desu Desu!"],
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

### Through Scripting
To transform to a node-based project through scripting (and get an understanding of the configurable options), follow the example:

```ts
import { buildNpm, defaultBuildNpmConfig, type BuildNpmConfig } from "jsr:@oazmi/build-tools/npm"

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
	text: ["./helloworld.txt", "Konichiwa Meena-San!\nShine\' Kuda Sai Meena-San!\nSosshtte Arigato yo Meena-San Desu Desu!"]
}
const npm_artifacts = await buildNpm(my_config)
alert("press any button to delete the generated npm-build in:", my_config.dir)
// cleanup the generated npm-build under "./npm-release/" 
npm_artifacts.cleanup()
```
