import { mkdir, readFile, writeFile, access, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { allRoutes, translatedPath, type PageData, type Route } from '../src/lib/routes';
import { normalizeBase, withBase } from '../src/lib/paths';
import { escapeHtml, normalizeSiteUrl, pageHead } from '../src/lib/seo';

const base = normalizeBase(process.env.BASE_PATH ?? '/');
const site = normalizeSiteUrl(process.env.SITE_URL);
const output = 'dist';
const template = await readFile(join(output, 'index.html'), 'utf8');
const { renderPage } = (await import(pathToFileURL(join(process.cwd(), '.build/server/entry-server.js')).href)) as {
	renderPage: (route: Route, base: string) => { html: string; data: PageData; hydration: string };
};

function outputPath(path: string): string {
	return join(output, path.endsWith('.html') ? path.slice(1) : `${path.replace(/^\//, '').replace(/\/$/, '')}/index.html`);
}

const rendered = new Map<string, string>();
for (const route of allRoutes()) {
	const { html, data, hydration } = renderPage(route, base);
	// JSON is embedded in an HTML script element: escape '<' to prevent a closing-script injection.
	const serialized = JSON.stringify(data)
		.replace(/</g, '\\u003c')
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029');
	const page = template
		.replace('<html lang="en">', `<html lang="${route.locale === 'zh' ? 'zh-CN' : 'en'}">`)
		.replace('<!--app-head-->', pageHead(route, base, site) + '\n' + hydration)
		.replace('<!--app-html-->', html)
		.replace('<!--app-data-->', `<script id="page-data" type="application/json">${serialized}</script>`);
	const file = outputPath(route.path);
	await mkdir(dirname(file), { recursive: true });
	await writeFile(file, page);
	rendered.set(file, page);
}

// Check internal HTML links and bundled assets on disk; no host-specific SPA fallback can hide mistakes.
for (const [file, html] of rendered) {
	for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
		const href = match[1].replace(/&amp;/g, '&');
		if (!href.startsWith('/') || href.startsWith('//')) continue;
		const path = href.split(/[?#]/)[0];
		if (!path.startsWith(base)) throw new Error(`${file}: internal URL misses BASE_PATH: ${href}`);
		const relative = decodeURIComponent(path.slice(base.length));
		const target = join(output, relative);
		try {
			await access(path.endsWith('/') ? join(target, 'index.html') : target);
		} catch {
			throw new Error(`${file}: broken internal link or asset: ${href}`);
		}
	}
}

if (site) {
	const urls = allRoutes()
		// Only canonical content pages belong in the sitemap; language aliases are rendered separately.
		.filter((route) => ['catalog', 'store', 'guide'].includes(route.kind) && route.path === translatedPath(route, route.locale))
		.map((route) => `<url><loc>${escapeHtml(new URL(withBase(route.path, base), site).href)}</loc></url>`);
	await writeFile(join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>\n`);
}
await writeFile(join(output, 'robots.txt'), `User-agent: *\nAllow: /\n${site ? `Sitemap: ${new URL(withBase('/sitemap.xml', base), site).href}\n` : ''}`);
await writeFile(join(output, '.nojekyll'), '');
// The Vite manifest and intermediate SSR bundle are build tooling, not deployment requirements.
await rm(join(output, '.vite'), { recursive: true, force: true });
console.log(`Pre-rendered ${rendered.size} HTML files. All internal links and assets checked. Output: dist/`);
if (!site) console.log('SITE_URL is unset; canonical URLs and sitemap are omitted.');
