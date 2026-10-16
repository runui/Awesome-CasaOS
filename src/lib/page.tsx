import { createContext, useContext } from 'solid-js';
import { catalogs } from '../data/stores';
import { getTranslator } from './i18n';
import { withBase } from './paths';
import type { PageData } from './routes';

export const repository = 'https://github.com/IceWhaleTech/Awesome-CasaOS';
export const PageContext = createContext<PageData>();

export function usePage() {
	const data = useContext(PageContext)!;
	const catalog = catalogs[data.route.locale];
	return {
		...data,
		locale: data.route.locale,
		t: getTranslator(data.route.locale),
		stores: catalog.stores,
		href: (path: string) => withBase(path, data.base),
	};
}
