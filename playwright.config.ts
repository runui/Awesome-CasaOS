import { defineConfig } from '@playwright/test';
import { normalizeBase } from './src/lib/paths';

const base = normalizeBase(process.env.BASE_PATH ?? '/');
export default defineConfig({
	testDir: './tests/browser',
	fullyParallel: true,
	retries: process.env.CI ? 1 : 0,
	reporter: 'list',
	use: {
		baseURL: `http://127.0.0.1:4173${base}`,
		browserName: 'chromium',
		trace: 'retain-on-failure',
	},
	webServer: {
		command: 'npx tsx scripts/serve.ts',
		url: `http://127.0.0.1:4173${base}`,
		reuseExistingServer: !process.env.CI,
	},
});
