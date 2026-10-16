import { categories, type Category, type Store } from '../data/stores';

export type CatalogQuery = { search: string; categories: Category[] };
export function parseQuery(search: string): CatalogQuery {
	const params = new URLSearchParams(search);
	return {
		search: params.get('q') ?? '',
		categories: categories.filter((category) => params.getAll('category').includes(category)),
	};
}

export function serializeQuery(query: CatalogQuery): string {
	const params = new URLSearchParams();
	if (query.search.trim()) params.set('q', query.search);
	for (const category of categories) if (query.categories.includes(category)) params.append('category', category);
	return params.size ? `?${params}` : '';
}

export function filterStores(stores: readonly Store[], query: CatalogQuery): Store[] {
	const terms = query.search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
	return stores.filter((store) => {
		const text = store.searchText;
		return terms.every((term) => text.includes(term)) && (!query.categories.length || store.categories.some((category) => query.categories.includes(category)));
	});
}
