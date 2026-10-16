import { stores } from '../data/stores';
import { defaultLocale, isLocale, locales, type Locale } from './locales';
import { localePath } from './paths';

export type Route =
	| { kind: 'catalog'; locale: Locale; path: string }
	| { kind: 'store'; locale: Locale; path: string; slug: string }
	| { kind: 'guide'; locale: Locale; path: string }
	| { kind: 'legacy'; locale: 'en'; path: string; target: 'catalog' | 'guide' }
	| { kind: 'not-found'; locale: Locale; path: string };

const legacyPrefix = '/content/3rd-party-app-stores/';
export function allRoutes(): Route[] {
	const content: Route[] = locales.flatMap((locale): Route[] => [
		{ kind: 'catalog', locale, path: localePath(locale) },
		...stores.map((store): Route => ({
			kind: 'store',
			locale,
			path: localePath(locale, `stores/${store.slug}/`),
			slug: store.slug,
		})),
		{
			kind: 'guide',
			locale,
			path: localePath(locale, 'guides/create-app-store/'),
		},
	]);
	// Default-language prefixes remain real static pages, while navigation uses the shorter paths.
	const aliases = content.filter((route) => route.locale === defaultLocale).map((route) => ({ ...route, path: `/${defaultLocale}${route.path}` }));
	return [
		...content,
		...aliases,
		...(['list', 'create-your-first-custom-appstore'] as const).flatMap((slug): Route[] =>
			['', '/', '.html'].map((extension) => ({
				kind: 'legacy',
				locale: 'en',
				path: `${legacyPrefix}${slug}${extension}`,
				target: slug === 'list' ? 'catalog' : 'guide',
			})),
		),
		{ kind: 'not-found', locale: defaultLocale, path: '/404.html' },
	];
}

export function resolveRoute(path: string): Route {
	const routes = allRoutes();
	const exact = routes.find((route) => route.path === path);
	if (exact) return exact;
	const withSlash = routes.find((route) => route.path === `${path}/`);
	if (withSlash) return withSlash;
	const first = path.split('/')[1];
	return { kind: 'not-found', locale: isLocale(first) ? first : defaultLocale, path };
}

export function translatedPath(route: Route, locale: Locale): string {
	if (route.kind === 'store') return localePath(locale, `stores/${route.slug}/`);
	if (route.kind === 'guide' || (route.kind === 'legacy' && route.target === 'guide')) return localePath(locale, 'guides/create-app-store/');
	return localePath(locale);
}

export type PageData = { route: Route; base: string; guideHtml?: string };
