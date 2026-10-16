# Contributing to Awesome CasaOS

Have a useful CasaOS app store you’re committed to maintaining? Submit a pull request for consideration. Improvements to translations and tutorials are welcome too.

## Add or update a store

Edit `data/stores.json`, the only maintained base store list. Use a stable lowercase slug as the object key and append new entries to preserve the existing collection order.

Include the store’s name and short `mark`, maintainer, HTTPS GitHub repository URL, at least one existing category ID, and English `summary` and `description`. Add translated fields under the same slug in `data/stores.zh.json`. Keep summaries brief and descriptions factual; avoid unsupported claims about availability, security, or compatibility.

The `sources` object uses stable source IDs as keys, each containing an English `label` and the exact HTTPS ZIP `url` accepted by CasaOS. Translate only the label in the locale override; do not repeat the URL. Keep architecture-specific variants separate and clearly labeled. Do not infer architecture support from a repository name.

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
