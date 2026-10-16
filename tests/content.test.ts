import { expect, onTestFinished, test } from 'vitest';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compileContent, mergeOverride } from '../scripts/content';

function fixture() {
	const directory = mkdtempSync(join(tmpdir(), 'awesome-casaos-json-'));
	// Register cleanup before copying so failed tests cannot leave fixture directories behind.
	onTestFinished(() => rmSync(directory, { recursive: true, force: true }));
	cpSync('data', directory, { recursive: true });
	return {
		directory,
		write: (name: string, value: unknown) => writeFileSync(join(directory, name), JSON.stringify(value)),
	};
}

test('locale files only replace selected fields and inherit the rest from base JSON', () => {
	const { directory, write } = fixture();
	write('stores.zh.json', {
		'appstore-play': {
			summary: '中文摘要',
			sources: { armv7: { label: '专用源' } },
		},
	});
	write('messages.zh.json', { directory: '中文目录' });
	const { en, zh } = compileContent(directory);
	const english = en.stores.find((store) => store.slug === 'appstore-play')!;
	const chinese = zh.stores.find((store) => store.slug === 'appstore-play')!;
	expect(chinese.summary).toBe('中文摘要');
	expect(chinese.name).toBe(english.name);
	expect(chinese.description).toBe(english.description);
	expect(chinese.repository).toBe(english.repository);
	expect(chinese.sources[0].label).toBe(english.sources[0].label);
	expect(chinese.sources[1].label).toBe('专用源');
	expect(chinese.sources[1].url).toBe(english.sources[1].url);
	expect(zh.messages.directory).toBe('中文目录');
	expect(zh.messages.guide).toBe(en.messages.guide);
	expect(chinese.summary).toBeTypeOf('string');
});

test('optional language files may be absent and en overrides merge independently with base', () => {
	const { directory, write } = fixture();
	for (const name of ['stores', 'categories', 'messages']) rmSync(join(directory, `${name}.zh.json`));
	const plain = compileContent(directory);
	expect(plain.en).toStrictEqual(plain.zh);
	write('stores.en.json', { linuxserver: { name: 'English display name' } });
	const compiled = compileContent(directory);
	expect(compiled.en.stores[0].name).toBe('English display name');
	expect(compiled.zh.stores[0].name).toBe(plain.zh.stores[0].name);
	expect(compiled.zh.stores[0].searchText).toContain('english display name');
});

test('overrides merge nested IDs without mutating the base; arrays replace as a whole', () => {
	const base = {
		store: {
			name: 'Name',
			sources: {
				first: { label: 'One', url: 'https://example.com/one.zip' },
				second: { label: 'Two', url: 'https://example.com/two.zip' },
			},
			tags: ['one', 'two'],
		},
	};
	const result = mergeOverride(base, {
		store: { sources: { second: { label: '二' } }, tags: ['three'] },
	}) as typeof base;
	expect(result.store.sources.second.url).toBe(base.store.sources.second.url);
	expect(result.store.sources.second.label).toBe('二');
	expect(base.store.sources.second.label).toBe('Two');
	expect(result.store.tags).toStrictEqual(['three']);
});

test('unknown slugs, source IDs, fields and mismatched types fail with a useful path', () => {
	expect(() => mergeOverride({ store: { summary: 'text' } }, { typo: {} })).toThrow(/data\.typo/);
	expect(() => mergeOverride({ store: { sources: { arm: { label: 'ARM' } } } }, { store: { sources: { typo: {} } } })).toThrow(/sources\.typo/);
	expect(() => mergeOverride({ summary: 'text' }, { summary: 123 })).toThrow(/summary.*type/);
	expect(() => mergeOverride({ store: {} }, { store: null })).toThrow(/store.*object/);
});

test('invalid override URLs and unknown data filenames fail the build', () => {
	const { directory, write } = fixture();
	write('stores.zh.json', {
		linuxserver: { repository: 'javascript:alert(1)' },
	});
	expect(() => compileContent(directory)).toThrow(/HTTPS/);
	write('stores.zh.json', {});
	write('stores.chinese.json', {});
	expect(() => compileContent(directory)).toThrow(/Unknown data file/);
});

test('committed language overrides do not repeat shared fields or unchanged UI messages', () => {
	const base = JSON.parse(readFileSync('data/stores.json', 'utf8'));
	const zh = JSON.parse(readFileSync('data/stores.zh.json', 'utf8'));
	for (const [slug, override] of Object.entries(zh) as [string, Record<string, unknown>][]) {
		expect(base[slug].summary).toBeTypeOf('string');
		for (const key of ['repository', 'maintainer', 'name', 'categories', 'mark']) expect(override).not.toHaveProperty(key);
		for (const source of Object.values(override.sources as Record<string, object>)) expect(source).not.toHaveProperty('url');
	}
	const messages = JSON.parse(readFileSync('data/messages.json', 'utf8'));
	const messagesZh = JSON.parse(readFileSync('data/messages.zh.json', 'utf8'));
	for (const [key, value] of Object.entries(messagesZh)) expect(value).not.toEqual(messages[key]);
});
