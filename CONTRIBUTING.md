# Contributing to Awesome ZimaOS

Have a useful app store for ZimaOS or CasaOS that you’re committed to maintaining? Submit a pull request for consideration. This directory gathers resources for **ZimaOS and CasaOS**, with **ZimaOS as the recommended starting point**. Improvements to translations and tutorials are welcome too.

## Add or update a store

Edit `data/stores.json`, the only maintained base store list. Use a stable lowercase slug as the object key and append new entries. The compiled collection puts stores with ZimaOS sources first and preserves the JSON order within each support group.

Include the store’s name and short `mark`, maintainer, HTTPS GitHub repository URL, at least one existing category ID, and English `summary` and `description`. Add translated fields under the same slug in `data/stores.zh.json`. Keep summaries brief and descriptions factual; avoid unsupported claims about availability, security, or compatibility.

Declare `platforms` explicitly with one or both of `"zimaos"` and `"casaos"`. Including `"zimaos"` enables the distinctive ZimaOS support badge and platform filter. Keep platform support separate from topic categories.

The `sources` object uses stable source IDs as keys. Each source requires an English `label`, a single `platform` (`"zimaos"` or `"casaos"`), and the exact HTTPS `url` accepted by that platform’s App Store. ZimaOS requires a native JSON manifest URL; a CasaOS ZIP archive cannot be declared as a ZimaOS source. Archive URLs assigned to ZimaOS fail validation. Multiple URLs for the same platform are allowed, for example architecture-specific variants. Application compatibility does not prove that a store offers a native source for both systems. Each platform declaration needs its own verified installation URL.

Every declared platform must have at least one source, and every source must belong to a declared platform. Empty, duplicate, unknown, or mismatched platform declarations fail the build. Platform declarations and source platform assignments belong only in the base file; locale overrides cannot change them. Translate only the source label in locale overrides, without repeating the URL.

For example, the verified LinuxServer sources are:

```json
{
	"platforms": ["zimaos", "casaos"],
	"sources": {
		"zimaos": {
			"label": "App store source",
			"platform": "zimaos",
			"url": "https://paodayag.dev/linuxserver/zimaos/store.json"
		},
		"default": {
			"label": "App store source",
			"platform": "casaos",
			"url": "https://paodayag.dev/linuxserver/casaos/store.zip"
		}
	}
}
```

Confirm compatibility and installation URLs from upstream documentation or a reproducible device test. Check published branches (such as `gh-pages`), hosted manifests, releases, and the [ZimaOS community stores documentation](https://www.zimaspace.com/docs/zimaos/app-store/awesome-third-party-stores) alongside default-branch READMEs. Fetch the declared JSON manifest and its index to confirm the source identity and format. Record supporting links in [docs/platform-sources.md](docs/platform-sources.md), including relevant versions, architectures, and any limitations. Do not infer support from a repository name, a similar URL, or another store’s compatibility. A CasaOS-only declaration means that only CasaOS support is currently recorded; it does not assert incompatibility with ZimaOS.

Store slugs are public URLs. Avoid changing them; a necessary change should include static transition routes for the old links. Logos are optional: the directory creates a consistent text cover from `mark`.

## Translations and tutorials

Interface text lives in `data/messages.json`, with replacements in `data/messages.zh.json`. Category labels use `data/categories.json` and `data/categories.zh.json`. English-specific overrides may use the optional `*.en.json` files.

Locale files are partial overrides: include only fields that need replacement. Missing values inherit the base JSON, nested objects merge by key, and arrays replace as a whole. Do not add new stores, sources, or message keys in a locale file; define their shared structure in the base first. Unknown keys and invalid merged data fail the build. Never edit `.build/content.json`, which is generated automatically.

UI and category labels are rendered by i18next from the compiled `messages` and `categories` namespaces. In components, use `t` from `usePage()`, for example `t('directory')` or `t('categories:ai')`; translation keys are checked by TypeScript. Preserve interpolation placeholders such as `{{name}}` when translating, and pass their values with `t('maintainedBy', { name })`. Keep translations as plain text so Solid can escape them safely. Use `getTranslator(locale)` outside components, and keep the translator fixed to the page locale during pre-rendering.

Translated tutorials live in `content/guides/en/` and `content/guides/zh/`.

Use Markdown without raw HTML. Prefer unprefixed English links such as `/` or `/stores/linuxserver/`, and `/zh/.../` links for Chinese. English `/en/.../` aliases remain accessible. The build adds the deployment base path automatically. Translate both versions when changing tutorial behavior.

## UI components

Use TileUI Solid components installed through the official shadcn CLI and the `@tile-ui` registry configured in `components.json`:

```sh
npm run ui:add -- @tile-ui/button
```

Import installed components from `@/components/ui/{name}`. Component TSX and module SCSS live in that directory; shared registry helpers live in `src/components/ui/lib/`, and shared SCSS lives in `src/styles/`. Keep site layout and theme customizations in `src/styles/site.scss`. The installed source can be edited locally; review `npm run ui:add -- @tile-ui/button --diff` before updating with `--overwrite`, since updates can also replace shared files. See the README for the full workflow and preserve the upstream MIT notice.

## Validate your changes

Run `npm run format` before submitting changes. Oxfmt uses the project’s `.oxfmtrc.json` configuration, respects `.gitignore`, and excludes the paths listed in `ignorePatterns`. CI checks formatting with `npm run format:check`.

Run `npm run lint` for Oxlint checks configured in `.oxlintrc.json`. It checks source files, scripts, configuration, and tests, with Vitest rules enabled for unit tests. Generated files and reports are excluded. Lint warnings fail the check in both local runs and CI; `npm run lint:fix` applies safe automatic fixes.

```sh
npm ci
npm run format:check
npm run lint
npm run check
npm test
npm run build
```

`npm test` compiles the JSON content and runs the Vitest unit tests once. Add unit tests as `tests/**/*.test.ts`, using `test` and `expect` from `vitest`.

For changes to navigation, rendering, or interaction, also run the Playwright browser tests:

```sh
npx playwright install chromium
npm run test:browser
```

Explain what the store offers or what your change fixes, and include relevant verification in your pull request. See the README for local development and static hosting configuration.
