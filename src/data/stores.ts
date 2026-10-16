import compiled from '../../.build/content.json';
import type { Catalogs, Category } from './types';
export type { Store, Category } from './types';

// This artifact is produced before dev/check/build; the browser only receives merged data.
export const catalogs = compiled as Catalogs;
export const stores = catalogs.en.stores;
export const categories = Object.keys(catalogs.en.categoryLabels) as Category[];
