import { z } from 'zod';
import baseCategories from '../../data/categories.json' with { type: 'json' };
import type { Category } from './types.ts';
import { platforms, type Platform } from './platforms.ts';

const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const text = z.string().trim().min(1);
const httpsUrl = z.url().refine((url) => url.startsWith('https://'), 'Use an HTTPS URL');
const platform = z.enum(platforms);
const sourceDefinition = z
	.object({ label: text, platform, url: httpsUrl })
	.strict()
	.superRefine((source, context) => {
		// ZimaOS uses native JSON manifests. App compatibility alone does not make a CasaOS archive a ZimaOS source.
		if (source.platform === 'zimaos' && URL.canParse(source.url) && /\.(?:zip|tar|tar\.gz|tgz|7z)\/?$/i.test(new URL(source.url).pathname))
			context.addIssue({ code: 'custom', path: ['url'], message: 'ZimaOS sources require a JSON manifest URL; archive URLs are not supported' });
	});

// A support declaration must have an installable source, and a source cannot silently expand support.
function validatePlatformSources(store: { platforms: Platform[]; sources: { platform: Platform }[] }, context: z.RefinementCtx) {
	for (const source of store.sources) {
		if (!store.platforms.includes(source.platform))
			context.addIssue({ code: 'custom', path: ['sources'], message: `Source platform ${source.platform} is not declared by the store` });
	}
	for (const supported of store.platforms) {
		if (!store.sources.some((source) => source.platform === supported))
			context.addIssue({ code: 'custom', path: ['platforms'], message: `Platform ${supported} requires at least one source` });
	}
}

function storeFields(categoryIds: readonly string[]) {
	return {
		name: text,
		mark: text,
		maintainer: text,
		repository: httpsUrl,
		categories: z.array(z.custom<Category>((value) => typeof value === 'string' && categoryIds.includes(value), 'Unknown category')).min(1),
		platforms: z
			.array(platform)
			.min(1)
			.refine((values) => new Set(values).size === values.length, 'Supported platforms must be unique'),
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
			.strict()
			.superRefine((store, context) => validatePlatformSources({ ...store, sources: Object.values(store.sources) }, context)),
	);
}

// Schemas are build-only. Store/source keys become stable public slugs and IDs after merging.
export function createStoreSchema(categoryIds: readonly string[]) {
	return z
		.object({
			slug: id,
			...storeFields(categoryIds),
			sources: z.array(sourceDefinition.safeExtend({ id })).min(1),
			searchText: z.string().default(''),
		})
		.strict()
		.superRefine((store, context) => {
			validatePlatformSources(store, context);
			if (new Set(store.sources.map((source) => source.id)).size !== store.sources.length)
				context.addIssue({
					code: 'custom',
					message: 'Source IDs must be unique within a store',
				});
		});
}

export const storeSchema = createStoreSchema(Object.keys(baseCategories));
