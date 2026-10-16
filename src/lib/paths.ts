import { defaultLocale, type Locale } from './locales.ts';

export function normalizeBase(base: string): string {
	if (!/^\/?[a-zA-Z0-9/_-]*\/?$/.test(base) || base.includes('//')) throw new Error('BASE_PATH must be a URL path such as / or /awesome/');
	const path = base.replace(/^\/+|\/+$/g, '');
	return path ? `/${path}/` : '/';
}

export function withBase(path: string, base: string): string {
	return `${normalizeBase(base)}${path.replace(/^\//, '')}`;
}

export function localePath(locale: Locale, suffix = ''): string {
	const prefix = locale === defaultLocale ? '/' : `/${locale}/`;
	return `${prefix}${suffix.replace(/^\//, '')}`;
}

export function stripBase(path: string, base: string): string | null {
	const normalized = normalizeBase(base);
	if (normalized !== '/' && path === normalized.slice(0, -1)) return '/';
	return path.startsWith(normalized) ? `/${path.slice(normalized.length)}` : null;
}
