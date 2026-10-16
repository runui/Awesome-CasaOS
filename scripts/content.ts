import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { z } from 'zod';
import { createRawStoresSchema, createStoreSchema } from '../src/data/schema.ts';
import type { Catalogs, Category, Messages } from '../src/data/types.ts';
import { locales } from '../src/lib/locales.ts';

export const dataDirectory = resolve('data');
const names = ['stores', 'categories', 'messages'] as const;
type JsonObject = { [key: string]: unknown };

function isObject(value: unknown): value is JsonObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Overlay objects merge by key, including store slugs and source IDs; arrays replace as a whole. */
export function mergeOverride(base: unknown, override: unknown, path = 'data'): unknown {
	if (isObject(base)) {
		if (!isObject(override)) throw new Error(`${path}: expected an object override`);
		const result = { ...base };
		for (const [key, value] of Object.entries(override)) {
			if (!Object.hasOwn(base, key)) throw new Error(`${path}.${key}: override key does not exist in base data`);
			result[key] = mergeOverride(base[key], value, `${path}.${key}`);
		}
		return result;
	}
	if (Array.isArray(base)) {
		if (!Array.isArray(override)) throw new Error(`${path}: expected an array override`);
		return structuredClone(override);
	}
	if (typeof override !== typeof base || override === null) throw new Error(`${path}: override type must match base data`);
	return override;
}

function readJson(directory: string, name: string): unknown {
	try {
		return JSON.parse(readFileSync(join(directory, name), 'utf8'));
	} catch (error) {
		throw new Error(`${name}: could not read valid JSON`, { cause: error });
	}
}

export function compileContent(directory = dataDirectory): Catalogs {
	const validFiles = new Set<string>(names.flatMap((name) => [`${name}.json`, ...locales.map((locale) => `${name}.${locale}.json`)]));
	for (const file of readdirSync(directory).filter((file) => file.endsWith('.json'))) {
		if (!validFiles.has(file)) throw new Error(`Unknown data file: ${file}`);
	}
	const base = Object.fromEntries(names.map((name) => [name, readJson(directory, `${name}.json`)])) as Record<(typeof names)[number], unknown>;
	const textMap = z.record(z.string().min(1), z.string().trim().min(1));
	const baseLabels = textMap.parse(base.categories);
	const baseMessages = textMap.parse(base.messages);
	if (!Object.keys(baseLabels).length || !Object.keys(baseMessages).length) throw new Error('Categories and messages must not be empty');
	const rawSchema = createRawStoresSchema(Object.keys(baseLabels));
	const storeSchema = createStoreSchema(Object.keys(baseLabels));
	rawSchema.parse(base.stores);

	const catalogs = Object.fromEntries(
		locales.map((locale) => {
			const merged = Object.fromEntries(
				names.map((name) => {
					const file = `${name}.${locale}.json`;
					const override = existsSync(join(directory, file)) ? readJson(directory, file) : undefined;
					// Platform identity is shared across languages; translations may only change its display text.
					if (name === 'stores' && isObject(override)) {
						for (const [slug, store] of Object.entries(override)) {
							if (!isObject(store)) continue;
							if ('platforms' in store) throw new Error(`${file}.${slug}.platforms: platform declarations belong in stores.json`);
							if (isObject(store.sources))
								for (const [id, source] of Object.entries(store.sources)) {
									if (isObject(source) && 'platform' in source) throw new Error(`${file}.${slug}.sources.${id}.platform: source platforms belong in stores.json`);
								}
						}
					}
					const value = override === undefined ? base[name] : mergeOverride(base[name], override, file);
					return [name, value];
				}),
			);
			const rawStores = rawSchema.parse(merged.stores);
			if (!Object.keys(rawStores).length) throw new Error('At least one store is required');
			return [
				locale,
				{
					stores: Object.entries(rawStores).map(([slug, store]) =>
						storeSchema.parse({
							...store,
							slug,
							sources: Object.entries(store.sources).map(([id, source]) => ({
								...source,
								id,
							})),
						}),
					),
					categoryLabels: textMap.parse(merged.categories) as Record<Category, string>,
					messages: textMap.parse(merged.messages) as Messages,
				},
			];
		}),
	) as Catalogs;

	// Search keeps both languages available without shipping a translation merge engine to the browser.
	for (const index of catalogs.en.stores.keys()) {
		const searchText = locales
			.flatMap((locale) => {
				const store = catalogs[locale].stores[index];
				return [
					store.name,
					store.maintainer,
					store.summary,
					store.description,
					...store.platforms,
					...store.categories.map((category) => catalogs[locale].categoryLabels[category]),
				];
			})
			.join(' ')
			.toLowerCase();
		for (const locale of locales) catalogs[locale].stores[index].searchText = searchText;
	}
	// Sort the compiled catalogs so static HTML, hydrated views, and detail indexes share one order.
	// Stable sorting preserves the source JSON order within each platform-support group.
	for (const locale of locales) catalogs[locale].stores.sort((first, second) => Number(second.platforms.includes('zimaos')) - Number(first.platforms.includes('zimaos')));
	return catalogs;
}

export function writeCompiledContent(): Catalogs {
	const catalogs = compileContent();
	const file = resolve('.build/content.json');
	const output = JSON.stringify(catalogs) + '\n';
	mkdirSync(resolve('.build'), { recursive: true });
	if (!existsSync(file) || readFileSync(file, 'utf8') !== output) writeFileSync(file, output);
	return catalogs;
}
