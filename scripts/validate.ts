import { readFile } from 'node:fs/promises';
import MarkdownIt from 'markdown-it';
import { z } from 'zod';
import { catalogs, stores } from '../src/data/stores';
import { storeSchema } from '../src/data/schema';
import { locales } from '../src/lib/locales';
import type { Messages } from '../src/data/types';
import { allRoutes } from '../src/lib/routes';
import { normalizeBase } from '../src/lib/paths';
import { normalizeSiteUrl } from '../src/lib/seo';

for (const locale of locales) z.array(storeSchema).min(1).parse(catalogs[locale].stores);
if (new Set(stores.map((store) => store.slug)).size !== stores.length) throw new Error('Duplicate store slug');
const routes = allRoutes();
if (new Set(routes.map((route) => route.path)).size !== routes.length) throw new Error('Duplicate route');
const paths = new Set(routes.map((route) => route.path));
for (const locale of locales) {
	for (const [key, value] of Object.entries(catalogs.en.messages)) {
		if (!value.trim() || !catalogs[locale].messages[key as keyof Messages]?.trim()) throw new Error(`Missing ${locale} translation: ${key}`);
	}
	const source = await readFile(`content/guides/${locale}/create-app-store.md`, 'utf8');
	if (!source.trim()) throw new Error(`Empty ${locale} tutorial`);
	const tokens = new MarkdownIt({ html: false }).parse(source, {});
	for (const token of tokens.flatMap((token) => token.children ?? [])) {
		const href = token.attrGet('href');
		if (href?.startsWith('/') && !paths.has(href.split(/[?#]/)[0])) throw new Error(`Broken tutorial link: ${href}`);
	}
}
normalizeBase(process.env.BASE_PATH ?? '/');
normalizeSiteUrl(process.env.SITE_URL);
console.log(`Validated ${stores.length} stores, ${stores.reduce((count, store) => count + store.sources.length, 0)} source URLs, translations, tutorials, and route uniqueness.`);
