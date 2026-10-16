import { z } from 'zod';
import baseCategories from '../../data/categories.json' with { type: 'json' };
import type { Category } from './types.ts';

const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const text = z.string().trim().min(1);
const httpsUrl = z.url().refine((url) => url.startsWith('https://'), 'Use an HTTPS URL');
const sourceDefinition = z.object({ label: text, url: httpsUrl }).strict();

function storeFields(categoryIds: readonly string[]) {
	return {
		name: text,
		mark: text,
		maintainer: text,
		repository: httpsUrl,
		categories: z.array(z.custom<Category>((value) => typeof value === 'string' && categoryIds.includes(value), 'Unknown category')).min(1),
		summary: text,
		description: text,
	};
}

export function createRawStoresSchema(categoryIds: readonly string[]) {
	return z.record(
		id,
		z
			.object({
				...storeFields(categoryIds),
				sources: z.record(id, sourceDefinition).refine((sources) => Object.keys(sources).length > 0, 'At least one source is required'),
			})
			.strict(),
	);
}

// Schemas are build-only. Store/source keys become stable public slugs and IDs after merging.
export function createStoreSchema(categoryIds: readonly string[]) {
	return z
		.object({
			slug: id,
			...storeFields(categoryIds),
			sources: z.array(sourceDefinition.extend({ id })).min(1),
			searchText: z.string().default(''),
		})
		.strict()
		.superRefine((store, context) => {
			if (new Set(store.sources.map((source) => source.id)).size !== store.sources.length)
				context.addIssue({
					code: 'custom',
					message: 'Source IDs must be unique within a store',
				});
		});
}

export const storeSchema = createStoreSchema(Object.keys(baseCategories));
