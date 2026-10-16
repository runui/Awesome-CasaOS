import type { Category, Messages } from '../data/types';

declare module 'i18next' {
	interface CustomTypeOptions {
		defaultNS: 'messages';
		keySeparator: false;
		returnNull: false;
		strictKeyChecks: true;
		resources: {
			messages: Messages;
			categories: Record<Category, string>;
		};
	}
}
