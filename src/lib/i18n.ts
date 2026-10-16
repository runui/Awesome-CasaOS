import { createInstance } from 'i18next';
import { catalogs } from '../data/stores';
import { defaultLocale, isLocale, locales, type Locale } from './locales';
export { locales, isLocale, type Locale } from './locales';

export const localeStorageKey = 'awesome-casaos.locale';

const i18n = createInstance();
// Resources are merged and validated at build time. Synchronous initialization keeps
// pre-rendering and hydration identical without fetching or merging locale files in the browser.
void i18n.init({
	initAsync: false,
	lng: defaultLocale,
	fallbackLng: defaultLocale,
	supportedLngs: [...locales],
	load: 'languageOnly',
	ns: ['messages', 'categories'],
	defaultNS: 'messages',
	keySeparator: false,
	returnNull: false,
	resources: Object.fromEntries(
		locales.map((locale) => [
			locale,
			{
				messages: catalogs[locale].messages,
				categories: catalogs[locale].categoryLabels,
			},
		]),
	),
	// Solid escapes text and attributes; SEO escapes the final string before writing HTML.
	interpolation: { escapeValue: false },
});

export function getTranslator(locale: Locale) {
	// Fix the route language per translator instead of mutating shared state during SSR.
	return i18n.getFixedT(locale, ['messages', 'categories']);
}

// Content paths define their language; preference detection is only for historic links.
export function resolveLocale(saved: unknown, languages: readonly string[]): Locale {
	if (isLocale(saved)) return saved;
	for (const language of languages) {
		const prefix = language.toLowerCase().split(/[-_]/)[0];
		if (isLocale(prefix)) return prefix;
	}
	return defaultLocale;
}

export function readPreferredLocale(): Locale {
	let saved: string | null = null;
	try {
		saved = localStorage.getItem(localeStorageKey);
	} catch {
		/* Storage may be disabled. */
	}
	return resolveLocale(saved, navigator.languages?.length ? navigator.languages : [navigator.language]);
}

export function saveLocale(locale: Locale) {
	try {
		localStorage.setItem(localeStorageKey, locale);
	} catch {
		/* Navigation must not depend on storage. */
	}
}
