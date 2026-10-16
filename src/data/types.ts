import type baseMessages from '../../data/messages.json';
import type baseCategories from '../../data/categories.json';
import type { Locale } from '../lib/locales';
import type { Platform } from './platforms';

export type Category = keyof typeof baseCategories;
export type Messages = { [Key in keyof typeof baseMessages]: string };

export type Store = {
	slug: string;
	name: string;
	mark: string;
	maintainer: string;
	repository: string;
	categories: Category[];
	platforms: Platform[];
	summary: string;
	description: string;
	sources: { id: string; label: string; platform: Platform; url: string }[];
	searchText: string;
};

export type Catalog = {
	stores: Store[];
	categoryLabels: Record<Category, string>;
	messages: Messages;
};
export type Catalogs = Record<Locale, Catalog>;
