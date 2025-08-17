/** a mermaid graph plugin to transform your mermaid code blocks (i.e. that start with ```` ```mermaid ````) to rendered graphs.
 * 
 * rendering is done in client side, by loading the mermaid-js library from a [cdn](https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs).
 * 
 * @module
*/

import type { Application, CommentDisplayPart, Context, Converter, PageEvent } from "typedoc"


const
	mermaid_codeblock_regex = /^\s*\`\`\`mermaid(?<content>.*?)\`\`\`\s*$/s,
	mermaid_class = "mermaid",
	mermaid_class_str = `class="${mermaid_class}"`
const mermaid_block = {
	start: `<pre><code ${mermaid_class_str}>`,
	end: `</code></pre>`,
}
const mermaid_script = String.raw`<script type="module">
import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs"

document.addEventListener("DOMContentLoaded", (event) => {
	let theme = getTypedocTheme()
	mermaid.initialize({
		theme: (theme ?? "light"),
		darkMode: theme === "dark",
		// startOnLoad: true, // no need for this, since we've already wrapped the initialization inside the "DOMContentLoaded" event.
	})
	// mermaid.run({ querySelector: ".${mermaid_class}" }) // allows manual re-runs
})

const getTypedocTheme = () => {
	let theme = document.documentElement.dataset.theme?.toLowerCase()
	if(theme !== "light" || theme !== "dark") { theme = localStorage.getItem("tsd-theme")?.toLowerCase() }
	theme ??= "os"
	if(theme === "os") { theme = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light" }
	return theme
}
</script>
`

const
	EVENT_RESOLVE_BEGIN: (typeof Converter)["EVENT_RESOLVE_BEGIN"] = "resolveBegin",
	EVENT_PAGE_END: (typeof PageEvent)["END"] = "endPage"

const mutateMermaidBlockPart = (part: CommentDisplayPart): void => {
	const content = mermaid_codeblock_regex.exec(part.text)?.groups?.content
	if (content === undefined) { return }
	const inner_html = htmlEscape(content.trim())
	part.text = mermaid_block.start + "\n" + inner_html + "\n" + mermaid_block.end
}

export const load = (app: Application): void => {
	// this portion for converting ts-comments is not really necessary,
	// since typedoc will precisely convert untouched mermaid code blocks into `<pre><code class="mermaid">` blocks.
	// however, typedoc will produce a warning whenever it encounters a code-block language that it does not know how to highlight.
	// so by doing the conversion to html ourselves, we save ourselves from the warnings.
	// plus, I'm doing the conversion here for learning purposes anyway.
	app.converter.on(EVENT_RESOLVE_BEGIN, (ctx: Context) => {
		for (const key in ctx.project.reflections) {
			const reflection = ctx.project.reflections[key]
			// process each code block in the comment, one by one, and mutate it if it's a mermaid code block.
			reflection.comment?.summary
				.filter((part) => (part.kind === "code" && mermaid_codeblock_regex.test(part.text)))
				.forEach(mutateMermaidBlockPart)
		}
	})

	// this is the code that actually permits runtime-rendering of mermaid code-blocks.
	app.renderer.on(EVENT_PAGE_END, (event: PageEvent) => {
		const contents = event.contents
		if (!contents?.includes(mermaid_class_str)) { return }
		// insert the mermaid script if the page contains a `<pre class="mermaid">` block.
		// we'll insert the script after the last </body> element.
		const bodytag_end_index = contents.lastIndexOf("</body>")
		event.contents = (
			contents.slice(0, bodytag_end_index)
			+ mermaid_script
			+ contents.slice(bodytag_end_index)
		)
	})
}

const char_to_html_escaped_map = new Map([
	["&", "&amp;"],
	["<", "&lt;"],
	[">", "&gt;"],
	["\"", "&quot;"],
	["'", "&#39;"],
])
const char_to_html_escaped_regex = new RegExp(`[${[...char_to_html_escaped_map.keys()].join("")}]`, "g")
const htmlEscape = (text: string): string => {
	return text.replaceAll(char_to_html_escaped_regex, ((char) => {
		return char_to_html_escaped_map.get(char)!
	}))
}
