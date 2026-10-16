import { categories, type Category, type Store } from '../data/stores';
import { isPlatform, type Platform } from '../data/platforms';

export type CatalogQuery = { search: string; categories: Category[]; platform?: Platform };
export function parseQuery(search: string): CatalogQuery {
	const params = new URLSearchParams(search);
	const platform = params.get('platform');
	return {
		search: params.get('q') ?? '',
		categories: categories.filter((category) => params.getAll('category').includes(category)),
		...(isPlatform(platform) ? { platform } : {}),
	};
}

export function serializeQuery(query: CatalogQuery): string {
	const params = new URLSearchParams();
	if (query.search.trim()) params.set('q', query.search);
	if (query.platform) params.set('platform', query.platform);
	for (const category of categories) if (query.categories.includes(category)) params.append('category', category);
	return params.size ? `?${params}` : '';
}

export function filterStores(stores: readonly Store[], query: CatalogQuery): Store[] {
	const terms = query.search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
	return stores.filter((store) => {
		const text = store.searchText;
		return (
			(!query.platform || store.platforms.includes(query.platform)) &&
			terms.every((term) => text.includes(term)) &&
			(!query.categories.length || store.categories.some((category) => query.categories.includes(category)))
		);
	});
}
