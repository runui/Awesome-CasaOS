# Awesome ZimaOS

A community resource directory for **ZimaOS and CasaOS**, with **ZimaOS as the recommended starting point**. Browse third-party app stores and find source URLs for your personal cloud. Individual projects document their own platform, version, and architecture requirements.

Built with **Vite, SolidJS, TypeScript, [TileUI Solid](https://solid.tileui.zmorg.cn/docs), and i18next**. English and Chinese pages are pre-rendered to standalone HTML. Search, category filters, language preferences, and copying source URLs run in the browser.

## Development

Use Node.js **22.12 or newer** (CI uses Node 24) and npm.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. English is the default language at `/`, with stores at `/stores/{slug}/` and the tutorial at `/guides/create-app-store/`. The equivalent `/en/.../` paths also serve complete pages. Chinese uses `/zh/.../`. Content URLs always determine the language, including when a different language is saved or preferred by the browser. Historic transition pages use the saved preference, then browser languages, then English.

```sh
npm run format        # Format source, data, and docs with .oxfmtrc.json
npm run format:check  # Check formatting without changing files
npm run lint          # Oxlint: check source, scripts, configs, and tests
npm run lint:fix      # Apply safe automatic lint fixes
npm run check         # TypeScript, content schemas, translations, tutorial links
npm test              # Vitest: search/filter, language, URL, SEO, JSON merging
npm run build         # Validate, bundle, and pre-render all routes into dist/
npm run preview       # Preview the build locally
```

## Static hosting

Upload the **contents of `dist/`** to any static web server. No Node server, API, database, or SPA rewrite is required. The host should serve directory `index.html` files; configure its error page to use `404.html` where supported.

To generate absolute canonical URLs and a sitemap, set the public origin at build time:

```sh
SITE_URL=https://awesome.casaos.io npm run build
```

For project or subdirectory hosting, use a base path:

```sh
BASE_PATH=/Awesome-CasaOS/ SITE_URL=https://example.com npm run build
BASE_PATH=/Awesome-CasaOS/ npm run preview
```

`SITE_URL` is an origin only; put any subdirectory in `BASE_PATH`. The base defaults to `/`. Without `SITE_URL`, canonical URLs and the sitemap are omitted. All page links, assets, tutorial links, and language redirects honor the base.

The GitHub Actions workflow checks formatting, lints, validates, tests, builds, runs browser checks, and uploads a static artifact. It **does not publish**. Optional repository variables `SITE_URL` and `BASE_PATH` configure the artifact.

## Architecture

- `data/*.json`: declarative stores, categories, and UI messages. Base files contain shared fields and default English text; `*.zh.json` contains only Chinese replacements. `*.en.json` is optional when English needs its own overrides.
- `content/guides/{en,zh}/`: translated Markdown tutorials. Raw HTML is disabled, and internal links are rewritten for the configured base.
- `src/lib/`: shared route definitions, i18next internationalization, filtering, path handling, and SEO. UI and category translation keys are typed against the base JSON declarations.
- `src/pages/` and `src/components/`: Solid pages and shared site components; `src/App.tsx` dispatches the current route. Ordinary anchors navigate between static pages; no client router is needed.
- `src/components/ui/` and `src/styles/`: TileUI Solid component source, shared helpers, and SCSS installed from the official registry with the shadcn CLI. Components are maintained locally and imported through the `@/` alias.
- `scripts/content.ts`: build-time JSON merging, schema checks, and a bilingual search index. The merged `.build/content.json` and intermediate SSR bundle are generated artifacts outside the deployment output. `src/data/stores.ts` only exposes typed access to the compiled content.
- `src/entry-server.tsx` and `scripts/prerender.ts`: build-only rendering. Vite builds browser and SSR entries; Solid renders each route to HTML, then hydrates it in the browser.

### TileUI components through shadcn

[`components.json`](components.json) configures the official `@tile-ui` registry at `https://solid.tileui.zmorg.cn/r/{name}.json`. The project uses the official shadcn CLI to install Solid components and their shared dependencies as local source files. The `tailwind` section is required by shadcn's configuration schema; TileUI's components use SCSS and do not require Tailwind or React.

Add a component with the versioned CLI command provided by the project:

```sh
npm run ui:add -- @tile-ui/button
npm run ui:add -- @tile-ui/input @tile-ui/checkbox
```

The directory currently uses Button, Badge, Card, Checkbox, Collapsible, DropdownMenu, and Input. Each component lives under `src/components/ui/{name}/`, with shared implementation in `src/components/ui/lib/`. Registry styles live under `src/styles/`; `globals.scss` loads the global theme/reset, and `registry.css` receives CSS variables from the CLI. Vite removes the CLI's Tailwind-only `@theme` and `@custom-variant` hints while keeping ordinary CSS variables. `site.scss` defines the directory's theme overrides and layout. Import components directly, for example `import { Button } from '@/components/ui/button'`.

Installed component source belongs to this project and can be customized. To review an upstream update before applying it:

```sh
npm run ui:add -- @tile-ui/button --dry-run
npm run ui:add -- @tile-ui/button --diff
```

After reviewing the diff, re-run with `--overwrite` to replace installed files. Shared helpers and styles may affect other components, so review those changes too and run formatting, lint, type checks, build, and browser tests afterward. The upstream MIT notice is retained in [`src/components/ui/LICENSE`](src/components/ui/LICENSE) and distributed with the static site as `licenses/tile-ui.txt`.

### JSON data and language overrides

The source pairs are `stores.json` / `stores.zh.json`, `categories.json` / `categories.zh.json`, and `messages.json` / `messages.zh.json`. Store entries are keyed by their stable URL slug; sources are keyed by source ID, so translating a source label does not duplicate its URL or depend on array positions.

For example, `stores.zh.json` may replace only these fields:

```json
{
	"appstore-play": {
		"summary": "收录常用国内应用，并提供 ARMv7 设备专用源。",
		"sources": {
			"armv7": { "label": "ARMv7 专用源" }
		}
	}
}
```

Every locale is merged independently as **base JSON + that locale’s optional overrides**. Omitted keys inherit the base value, nested objects merge by key, and arrays replace in full. Unknown keys or files, wrong types, invalid URLs, and empty required text fail compilation. The browser receives resolved content with plain string fields and does not load or merge override files at runtime.

`npm run content:build` writes the ignored compiled artifact. `dev`, `check`, `test`, and `build` run this automatically; the dev server also recompiles and reloads when source JSON changes. Tutorials remain translated Markdown documents.

i18next consumes the compiled `messages` and `categories` namespaces from memory. Initialization is synchronous, so static HTML and browser hydration use the same translated text without network requests for translations. Each page uses a translator fixed to its route language; pre-rendering English and Chinese pages never changes a shared current language. Language switching follows the corresponding static page link.

Components obtain `t` from `usePage()` and call `t('directory')` or `t('categories:general')`. Code outside components uses `getTranslator(locale)` from `src/lib/i18n.ts`, including SEO generation. Interpolation uses i18next syntax, for example `"maintainedBy": "By {{name}}"` with `t('maintainedBy', { name })`. Solid escapes UI text; the SEO renderer escapes its HTML output.

Default-language routes are `/`, `/stores/{slug}/`, and `/guides/create-app-store/`; `/en/`, `/en/stores/{slug}/`, and `/en/guides/create-app-store/` remain accessible as static aliases. Chinese routes use the `/zh/` prefix. Site navigation and language switching use canonical paths, with the English prefix omitted. With `SITE_URL` set, aliases point to the unprefixed canonical URLs and the sitemap includes only canonical content routes. Historic list/tutorial paths, including `.html` variants, remain as static transition pages with links usable without JavaScript.

Pre-rendered pages include all catalog cards, store details, source URLs, and tutorials before JavaScript loads. Interactive controls are enabled after hydration. Search uses `q`; repeated `category` parameters represent OR choices, combined with search using AND. Search covers both languages regardless of the current interface language.

The collection supports card and list layouts. The view toggle keeps the current search and category filters, and remembers the choice across refreshes and language changes when browser storage is available. Both layouts use flat source actions. Single-source stores copy immediately; cards show the source name and list rows show a compact copy link at the right edge. Multi-source stores use one copy link with a chevron: opening it does not copy a default or previously chosen URL. The menu shows every variant's label and full URL; selecting an item copies that URL and closes the menu. The menu uses the TileUI dropdown installed through the shadcn CLI, with keyboard navigation, Escape, outside-click dismissal, viewport-aware positioning, and scrolling for longer collections. Successful copies confirm that the URL was written to the clipboard; failures show a retry message without opening any input or dialog. A hidden, temporary copy command provides compatibility when the Clipboard API is unavailable or rejects the request. Catalog items and detail pages share the clipboard helper. Without JavaScript, the pre-rendered cards and detail links remain available, with full source URLs on each detail page.

## Tests

Unit tests run in Node with Vitest, using `vitest.config.ts` to collect `tests/**/*.test.ts`. `npm test` compiles the JSON content first and runs once, including in CI. Playwright runs the browser scenarios separately from `tests/browser/`.

```sh
npx playwright install chromium
npm run build
npm run test:browser
```

Tests use an ordinary static file server with **no SPA fallback**. They cover hydration, search, filters, refreshes, language detection/switching, clipboard success/failure, mobile layouts, historic links, and no-JavaScript reading. To verify subdirectory hosting, build and test with the same `BASE_PATH`.

See [CONTRIBUTING.md](CONTRIBUTING.md) to add a store or improve a translation. Store descriptions come from community submissions; source URLs and application availability are not checked live.

MIT licensed.
