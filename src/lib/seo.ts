import { catalogs } from '../data/stores';
import { getTranslator } from './i18n';
import { locales } from './locales';
import { withBase } from './paths';
import { translatedPath, type Route } from './routes';

export function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}

export function normalizeSiteUrl(value: string | undefined): string | undefined {
	if (!value) return undefined;
	const url = new URL(value);
	if (!['http:', 'https:'].includes(url.protocol) || url.pathname !== '/' || url.search || url.hash || url.username || url.password)
		throw new Error('SITE_URL must be an origin, e.g. https://awesome.casaos.io; use BASE_PATH for a subdirectory');
	return url.origin;
}

export function pageHead(route: Route, base: string, site?: string): string {
	const t = getTranslator(route.locale);
	const store = route.kind === 'store' ? catalogs[route.locale].stores.find((store) => store.slug === route.slug) : undefined;
	const title = `${store?.name ?? (route.kind === 'guide' ? t('guideTitle') : route.kind === 'not-found' ? '404' : t('directoryTitle'))} · ${t('siteName')}`;
	const description = store?.summary ?? (route.kind === 'guide' ? t('guideDescription') : t('directoryMeta'));
	const indexable = ['catalog', 'store', 'guide'].includes(route.kind);
	// Prefixed default-language aliases share the canonical URL of the unprefixed page.
	const canonical = site ? new URL(withBase(translatedPath(route, route.locale), base), site).href : undefined;
	return [
		`<title>${escapeHtml(title)}</title>`,
		`<meta name="description" content="${escapeHtml(description)}">`,
		`<meta name="robots" content="${indexable ? 'index,follow' : 'noindex,follow'}">`,
		`<meta property="og:site_name" content="${escapeHtml(t('siteName'))}">`,
		`<meta property="og:type" content="website">`,
		`<meta property="og:title" content="${escapeHtml(title)}">`,
		`<meta property="og:description" content="${escapeHtml(description)}">`,
		canonical && indexable ? `<link rel="canonical" href="${escapeHtml(canonical)}"><meta property="og:url" content="${escapeHtml(canonical)}">` : '',
		...(indexable
			? locales.map((locale) => {
					const path = withBase(translatedPath(route, locale), base);
					const href = site ? new URL(path, site).href : path;
					return `<link rel="alternate" hreflang="${locale === 'zh' ? 'zh-CN' : 'en'}" href="${escapeHtml(href)}">`;
				})
			: []),
	]
		.filter(Boolean)
		.join('\n');
}
