import { expect, test } from 'vitest';
import { stores } from '../src/data/stores';
import { storeSchema } from '../src/data/schema';
import { filterStores, parseQuery, serializeQuery } from '../src/lib/catalog';

test('the migration preserves all nine stores and ten original source URLs in order', () => {
	expect(stores).toHaveLength(9);
	expect(stores.flatMap((store) => store.sources.map((source) => source.url))).toStrictEqual([
		'https://casaos-appstore.paodayag.dev/linuxserver.zip',
		'https://play.cuse.eu.org/Cp0204-AppStore-Play.zip',
		'https://play.cuse.eu.org/Cp0204-AppStore-Play-arm.zip',
		'https://casaos-appstore.paodayag.dev/coolstore.zip',
		'https://paodayag.dev/casaos-appstore-edge.zip',
		'https://github.com/mr-manuel/CasaOS-HomeAutomation-AppStore/archive/refs/tags/latest.zip',
		'https://github.com/bigbeartechworld/big-bear-casaos/archive/refs/heads/master.zip',
		'https://github.com/mariosemes/CasaOS-TMCstore/archive/refs/heads/main.zip',
		'https://github.com/arch3rPro/Pentest-Docker/archive/refs/heads/master.zip',
		'https://github.com/justserdar/ZimaOS-AppStore/archive/refs/tags/latest-v0.0.8.zip',
	]);
});

test('search matches Chinese, English, maintainers and categories case-insensitively', () => {
	for (const [search, slug] of [
		['迅雷', 'appstore-play'],
		['LINUXSERVER', 'linuxserver'],
		['mr-manuel', 'home-automation'],
		['生成式', 'generative-ai-workbench'],
	]) {
		expect(filterStores(stores, { search, categories: [] }).some((store) => store.slug === slug)).toBe(true);
	}
	expect(filterStores(stores, { search: '  nonexistent-1234 ', categories: [] })).toHaveLength(0);
});

test('category choices use OR and combine with search using AND', () => {
	expect(filterStores(stores, { search: '', categories: ['ai', 'security'] })).toHaveLength(2);
	expect(
		filterStores(stores, {
			search: 'workbench',
			categories: ['ai', 'security'],
		}),
	).toHaveLength(1);
	expect(filterStores(stores, { search: 'workbench', categories: ['security'] })).toHaveLength(0);
	expect(filterStores(stores, { search: '  ', categories: [] })).toStrictEqual(stores);
});

test('query serialization round-trips Unicode and ignores unknown or duplicate categories', () => {
	const query = { search: '迅雷 & AI', categories: ['ai', 'china'] as const };
	const encoded = serializeQuery({
		...query,
		categories: [...query.categories],
	});
	expect(parseQuery(encoded)).toStrictEqual({
		search: query.search,
		categories: ['china', 'ai'],
	});
	expect(parseQuery('?category=invalid&category=ai&category=ai')).toStrictEqual({
		search: '',
		categories: ['ai'],
	});
	expect(serializeQuery({ search: '  ', categories: [] })).toBe('');
});

test('content validation rejects empty required fields, invalid URLs and duplicate source IDs', () => {
	expect(storeSchema.safeParse({ ...stores[0], summary: '' }).success).toBe(false);
	expect(storeSchema.safeParse({ ...stores[0], repository: 'javascript:alert(1)' }).success).toBe(false);
	expect(
		storeSchema.safeParse({
			...stores[0],
			sources: [stores[0].sources[0], stores[0].sources[0]],
		}).success,
	).toBe(false);
});
