import { expect, test } from 'vitest';
import { resolveLocale } from '../src/lib/i18n';
import { allRoutes, resolveRoute, translatedPath } from '../src/lib/routes';
import { localePath, normalizeBase, stripBase, withBase } from '../src/lib/paths';
import { normalizeSiteUrl, pageHead } from '../src/lib/seo';

test('saved language wins; browser languages match in order; unsupported languages fall back to English', () => {
	expect(resolveLocale('zh', ['en-US'])).toBe('zh');
	expect(resolveLocale(null, ['fr-FR', 'zh-Hant-TW', 'en'])).toBe('zh');
	expect(resolveLocale(null, ['en-GB', 'zh-CN'])).toBe('en');
	expect(resolveLocale('invalid', ['ja-JP'])).toBe('en');
	expect(resolveLocale(null, [])).toBe('en');
});

test('all stores and tutorials have matching language routes', () => {
	const routes = allRoutes();
	expect(routes.filter((route) => route.kind === 'store')).toHaveLength(27);
	for (const route of routes.filter((route) => ['catalog', 'store', 'guide'].includes(route.kind))) {
		const counterpart = resolveRoute(translatedPath(route, route.locale === 'en' ? 'zh' : 'en'));
		expect(counterpart.kind).toBe(route.kind);
		expect(counterpart.locale).not.toBe(route.locale);
	}
	expect(resolveRoute('/zh/stores/appstore-play').kind).toBe('store');
	expect(resolveRoute('/zh/does-not-exist/').locale).toBe('zh');
});

test('default-language content has unprefixed canonical paths and working prefixed aliases', () => {
	expect(localePath('en')).toBe('/');
	expect(localePath('zh')).toBe('/zh/');
	expect(localePath('en', 'stores/linuxserver/')).toBe('/stores/linuxserver/');
	for (const path of ['/', '/stores/linuxserver/', '/guides/create-app-store/']) {
		const canonical = resolveRoute(path);
		const alias = resolveRoute(`/en${path}`);
		expect(canonical.locale).toBe('en');
		expect(['catalog', 'store', 'guide']).toContain(canonical.kind);
		expect({ ...alias, path }).toStrictEqual(canonical);
		expect(translatedPath(alias, 'en')).toBe(path);
		expect(resolveRoute(`/en${path}`.slice(0, -1))).toStrictEqual(alias);
	}
	expect(translatedPath(resolveRoute('/zh/guides/create-app-store/'), 'en')).toBe('/guides/create-app-store/');
	expect(translatedPath(resolveRoute('/en/stores/linuxserver/'), 'zh')).toBe('/zh/stores/linuxserver/');
	expect(resolveRoute('/stores/not-a-store/').kind).toBe('not-found');
});

test('both historic URL forms and trailing slashes resolve', () => {
	for (const slug of ['list', 'create-your-first-custom-appstore']) {
		for (const suffix of ['', '/', '.html']) expect(resolveRoute(`/content/3rd-party-app-stores/${slug}${suffix}`).kind).toBe('legacy');
	}
});

test('base paths work for root and project hosting and reject unsafe paths', () => {
	expect(normalizeBase('awesome')).toBe('/awesome/');
	expect(withBase(localePath('en'), '/awesome/')).toBe('/awesome/');
	expect(withBase(localePath('en', 'stores/linuxserver/'), '/awesome/')).toBe('/awesome/stores/linuxserver/');
	expect(withBase('/zh/stores/linuxserver/', '/awesome/')).toBe('/awesome/zh/stores/linuxserver/');
	expect(stripBase('/awesome/zh/', '/awesome/')).toBe('/zh/');
	expect(stripBase('/awesome', '/awesome/')).toBe('/');
	expect(stripBase('/other/zh/', '/awesome/')).toBeNull();
	for (const base of ['https://example.com', '/../', '/x?y', '//example.com/']) expect(() => normalizeBase(base)).toThrow();
});

test('default-language aliases share canonical and alternate URLs with the unprefixed pages', () => {
	for (const path of ['/', '/stores/linuxserver/', '/guides/create-app-store/']) {
		const head = pageHead(resolveRoute(path), '/awesome/', 'https://example.com');
		const aliasHead = pageHead(resolveRoute(`/en${path}`), '/awesome/', 'https://example.com');
		expect(aliasHead).toBe(head);
		expect(head).toContain(`<link rel="canonical" href="https://example.com/awesome${path}">`);
		expect(head).toContain(`hreflang="en" href="https://example.com/awesome${path}"`);
		expect(head).toContain(`hreflang="zh-CN" href="https://example.com/awesome/zh${path}"`);
		expect(head).not.toContain('https://example.com/awesome/en/');
	}
});

test('SEO uses the correct translated path and only emits canonicals with an explicit origin', () => {
	const route = resolveRoute('/zh/stores/appstore-play/');
	const head = pageHead(route, '/awesome/', 'https://example.com');
	expect(head).toMatch(/https:\/\/example.com\/awesome\/zh\/stores\/appstore-play\//);
	expect(head).toMatch(/hreflang="en"/);
	expect(pageHead(route, '/')).not.toMatch(/rel="canonical"/);
	expect(() => normalizeSiteUrl('https://example.com/subpath/')).toThrow();
	expect(() => normalizeSiteUrl('file:///tmp')).toThrow();
});
