import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		// Playwright owns browser scenarios; Vitest only collects unit tests.
		include: ['tests/**/*.test.ts'],
	},
});
