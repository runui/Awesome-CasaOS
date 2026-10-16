import { expect, test } from 'vitest';
import { stores } from '../src/data/stores';
import { storeSchema } from '../src/data/schema';
import { filterStores, parseQuery, serializeQuery } from '../src/lib/catalog';

test('ZimaOS stores appear first while preserving the original source order within each support group', () => {
	expect(stores).toHaveLength(10);
	expect(stores.map((store) => store.slug)).toStrictEqual([
		'big-bear',
		'linuxserver',
		'appstore-play',
		'lintuxer',
		'coolstore',
		'edge',
		'home-automation',
		'tmc',
		'pentest-docker',
		'generative-ai-workbench',
	]);
	expect(stores.flatMap((store) => store.sources.filter((source) => source.platform === 'casaos').map((source) => source.url))).toStrictEqual([
		'https://github.com/bigbeartechworld/big-bear-casaos/archive/refs/heads/master.zip',
		'https://paodayag.dev/linuxserver/casaos/store.zip',
		'https://play.cuse.eu.org/Cp0204-AppStore-Play.zip',
		'https://play.cuse.eu.org/Cp0204-AppStore-Play-arm.zip',
		'https://casaos-appstore.paodayag.dev/coolstore.zip',
		'https://paodayag.dev/casaos-appstore-edge.zip',
		'https://github.com/mr-manuel/CasaOS-HomeAutomation-AppStore/archive/refs/tags/latest.zip',
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

test('platform filtering composes with category OR choices and search, and dual-platform stores appear in both', () => {
	expect(filterStores(stores, { search: '', categories: [], platform: 'zimaos' }).map((store) => store.slug)).toStrictEqual([
		'big-bear',
		'linuxserver',
		'appstore-play',
		'lintuxer',
	]);
	expect(filterStores(stores, { search: '', categories: [], platform: 'casaos' })).toHaveLength(9);
	expect(filterStores(stores, { search: 'lintuxer', categories: [], platform: 'casaos' })).toHaveLength(0);
	expect(filterStores(stores, { search: 'linuxserver', categories: ['ai', 'general'], platform: 'zimaos' }).map((store) => store.slug)).toStrictEqual(['linuxserver']);
	expect(filterStores(stores, { search: '', categories: ['china'], platform: 'zimaos' }).map((store) => store.slug)).toStrictEqual(['appstore-play']);
	expect(filterStores(stores, { search: '', categories: ['security'], platform: 'zimaos' })).toHaveLength(0);
	expect(filterStores(stores, { search: 'zimaos', categories: [] }).map((store) => store.slug)).toStrictEqual([
		'big-bear',
		'linuxserver',
		'appstore-play',
		'lintuxer',
		'generative-ai-workbench',
	]);
	// Compatibility mentioned in prose cannot grant membership in the native ZimaOS source filter.
	expect(filterStores(stores, { search: 'workbench', categories: [], platform: 'zimaos' })).toHaveLength(0);
});

test('platform query values round-trip with Unicode and categories, and invalid values are ignored', () => {
	const query = { search: '应用 & AI', categories: ['ai'] as const, platform: 'zimaos' as const };
	expect(parseQuery(serializeQuery({ ...query, categories: [...query.categories] }))).toStrictEqual(query);
	for (const value of ['invalid', '', 'ZimaOS']) expect(parseQuery(`?platform=${value}`)).toStrictEqual({ search: '', categories: [] });
	expect(serializeQuery({ search: '', categories: [], platform: 'casaos' })).toBe('?platform=casaos');
});

test('platform declarations require a source for every declared platform and reject inconsistent or missing metadata', () => {
	const store = stores[0];
	expect(storeSchema.safeParse(store).success).toBe(true);
	for (const platforms of [[], ['invalid'], ['zimaos', 'zimaos'], ['casaos']]) expect(storeSchema.safeParse({ ...store, platforms }).success).toBe(false);
	expect(storeSchema.safeParse({ ...store, platforms: undefined }).success).toBe(false);
	expect(storeSchema.safeParse({ ...store, sources: store.sources.filter((source) => source.platform === 'casaos') }).success).toBe(false);
	expect(storeSchema.safeParse({ ...store, sources: [{ ...store.sources[0], platform: undefined }] }).success).toBe(false);
	expect(storeSchema.safeParse({ ...store, sources: [{ ...store.sources[0], platform: 'other' }] }).success).toBe(false);
	expect(storeSchema.safeParse({ ...store, sources: [{ ...store.sources[0], url: '' }, store.sources[1]] }).success).toBe(false);
});

test('ZimaOS rejects archive sources even with query strings or uppercase extensions, while CasaOS retains ZIP support', () => {
	const store = stores[0];
	for (const url of ['https://example.com/store.zip', 'https://example.com/store.ZIP?version=2#source', 'https://example.com/store.zip/', 'https://example.com/store.tar.gz']) {
		expect(storeSchema.safeParse({ ...store, sources: store.sources.map((source) => (source.platform === 'zimaos' ? { ...source, url } : source)) }).success).toBe(false);
	}
	expect(storeSchema.safeParse(store).success).toBe(true);
	// Extensionless endpoints can also serve JSON; validation must not invent a filename requirement.
	expect(
		storeSchema.safeParse({ ...store, sources: store.sources.map((source) => (source.platform === 'zimaos' ? { ...source, url: 'https://example.com/api/store' } : source)) })
			.success,
	).toBe(true);
});
