import { test, expect } from '@playwright/test';

test('pre-rendered catalog hydrates, searches, filters, clears, and restores query state', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto('./');
	await expect(page.locator('.store-card')).toHaveCount(10);
	await expect(page.locator('.filter-trigger')).toBeHidden();
	await page.getByRole('searchbox').fill('迅雷');
	await expect(page.locator('.store-card')).toHaveCount(1);
	await expect(page).toHaveURL(/q=/);
	await page.reload();
	await expect(page.getByRole('searchbox')).toHaveValue('迅雷');
	await expect(page.locator('.store-card')).toHaveCount(1);
	await page.getByRole('button', { name: 'Clear filters' }).click();
	await page.getByRole('checkbox', { name: 'Generative AI' }).check();
	await page.getByRole('checkbox', { name: 'Security tools' }).check();
	await expect(page.locator('.store-card')).toHaveCount(2);
	await page.getByRole('searchbox').fill('impossible-xyz');
	await expect(page.getByText('Nothing here just yet.')).toBeVisible();
	expect(errors).toEqual([]);
});

test('language switch preserves the corresponding page and directory query', async ({ page, baseURL }) => {
	await page.goto('./?category=ai');
	await expect(page.locator('.store-card')).toHaveCount(1);
	await page.getByRole('link', { name: '切换到中文' }).click();
	await expect(page).toHaveURL(/zh\/\?category=ai/);
	await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
	await expect(page.locator('.store-card')).toHaveCount(1);
	await page.locator('.store-card h3 a').click();
	await page.getByRole('link', { name: 'Switch to English' }).click();
	await expect(page).toHaveURL(`${baseURL}stores/generative-ai-workbench/`);
});

test('default paths and explicit language paths take precedence over browser and saved preferences', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ locale: 'zh-CN' });
	const page = await context.newPage();
	await page.goto(baseURL!);
	await expect(page).toHaveURL(baseURL!);
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	await expect(page.locator('.store-card')).toHaveCount(10);
	await page.goto(`${baseURL}content/3rd-party-app-stores/list.html`);
	await expect(page).toHaveURL(`${baseURL}zh/`);
	await page.getByRole('link', { name: 'Switch to English' }).click();
	await page.goto(`${baseURL}content/3rd-party-app-stores/list.html`);
	await expect(page).toHaveURL(baseURL!);
	await page.getByRole('link', { name: '切换到中文' }).click();
	await expect(page).toHaveURL(/zh\/$/);
	await page.goto(baseURL!);
	await expect(page).toHaveURL(baseURL!);
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	await page.goto(`${baseURL}en/`);
	await expect(page).toHaveURL(`${baseURL}en/`);
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	await page.goto(`${baseURL}zh/`);
	await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
	await context.close();
});

test('detail refresh, both source variants, native and compatibility clipboard writes, and failure', async ({ page, context }) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await page.goto('stores/appstore-play/');
	await page.reload();
	await expect(page.locator('.source-url')).toHaveCount(3);
	await page.getByRole('button', { name: 'Copy URL: CasaOS · Standard source', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Copied to clipboard' })).toBeVisible();
	expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('https://play.cuse.eu.org/Cp0204-AppStore-Play.zip');
	await page.evaluate(() =>
		Object.defineProperty(navigator.clipboard, 'writeText', {
			value: () => Promise.reject(new Error('denied')),
		}),
	);
	await page.getByRole('button', { name: 'Copy URL: CasaOS · ARMv7 · Raspberry Pi 2 / OneCloud', exact: true }).click();
	const armCopy = page.getByRole('button', { name: 'Copied to clipboard: CasaOS · ARMv7 · Raspberry Pi 2 / OneCloud', exact: true });
	await expect(armCopy).toBeVisible();
	expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('https://play.cuse.eu.org/Cp0204-AppStore-Play-arm.zip');
	await page.evaluate(() => Object.defineProperty(document, 'execCommand', { value: () => false }));
	await armCopy.click();
	await expect(page.getByText('Couldn’t write to the clipboard. Please try again.')).toBeVisible();
	await expect(page.locator('.source-url')).toHaveCount(3);
	await expect(page.locator('textarea')).toHaveCount(0);
});

test('default pages, prefixed aliases, tutorials, and legacy links work without JavaScript', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	const page = await context.newPage();
	await page.goto(baseURL!);
	await expect(page.locator('.store-card')).toHaveCount(10);
	await page.getByRole('heading', { name: 'CasaOS-LinuxServer-AppStore', exact: true }).getByRole('link').click();
	await expect(page.locator('h1')).toHaveText('CasaOS-LinuxServer-AppStore');
	await expect(page.locator('.platform-source-group[data-platform="casaos"] .source-url')).toHaveValue('https://paodayag.dev/linuxserver/casaos/store.zip');
	await page.goto(`${baseURL}zh/guides/create-app-store/`);
	await expect(page.getByRole('heading', { name: '01 — Fork 一个商店' })).toBeVisible();
	await page.goto(baseURL!);
	await expect(page.getByRole('link', { name: '切换到中文' })).toBeVisible();
	await page.goto(`${baseURL}en/stores/appstore-play/`);
	await expect(page.locator('.source-url')).toHaveCount(3);
	await page.goto(`${baseURL}en/guides/create-app-store/`);
	await expect(page.getByRole('heading', { name: '01 — Fork an app store' })).toBeVisible();
	await page.goto(`${baseURL}content/3rd-party-app-stores/list.html`);
	await expect(page.getByRole('link', { name: 'Explore in English' })).toBeVisible();
	await context.close();
});

test('old URLs redirect and missing pages return a real 404', async ({ page, baseURL }) => {
	await page.goto('content/3rd-party-app-stores/create-your-first-custom-appstore.html');
	await expect(page).toHaveURL(`${baseURL}guides/create-app-store/`);
	const response = await page.goto('does-not-exist/');
	expect(response?.status()).toBe(404);
	await expect(page.getByRole('heading', { name: 'A little off the beaten path.' })).toBeVisible();
});

test('mobile filters, keyboard focus, and layouts fit the viewport', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('zh/');
	await expect(page.getByRole('button', { name: '搜索与筛选' })).toHaveAttribute('aria-expanded', 'false');
	await page.getByRole('button', { name: '搜索与筛选' }).click();
	await page.getByRole('checkbox', { name: '国内应用' }).check();
	await expect(page.locator('.store-card')).toHaveCount(1);
	await page.keyboard.press('Tab');
	expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true);
	for (const width of [390, 600, 768, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		for (const path of ['zh/', 'zh/stores/appstore-play/', 'zh/guides/create-app-store/']) {
			await page.goto(path);
			expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
		}
	}
	expect(errors).toEqual([]);
});

test('disabled storage does not break default pages, legacy links, or language switching', async ({ page, baseURL }) => {
	await page.addInitScript(() => {
		Object.defineProperty(window, 'localStorage', {
			get() {
				throw new Error('blocked');
			},
		});
	});
	await page.goto('./');
	await expect(page).toHaveURL(baseURL!);
	await page.getByRole('link', { name: '切换到中文' }).click();
	await expect(page).toHaveURL(/zh\/$/);
	await page.goto('content/3rd-party-app-stores/list.html');
	await expect(page).toHaveURL(baseURL!);
});

test('prefixed aliases refresh, hydrate, and navigate to the unprefixed default pages', async ({ page, baseURL }) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto('en/');
	await page.reload();
	await expect(page).toHaveURL(`${baseURL}en/`);
	await page.getByRole('searchbox').fill('LINUXSERVER');
	await expect(page.locator('.store-card')).toHaveCount(1);
	await page.locator('.store-card h3 a').click();
	await expect(page).toHaveURL(`${baseURL}stores/linuxserver/`);
	await page.goto('en/stores/appstore-play/');
	await page.reload();
	await expect(page).toHaveURL(`${baseURL}en/stores/appstore-play/`);
	await expect(page.locator('.source-url')).toHaveCount(3);
	await page.getByRole('link', { name: '切换到中文' }).click();
	await expect(page).toHaveURL(`${baseURL}zh/stores/appstore-play/`);
	await page.getByRole('link', { name: 'Switch to English' }).click();
	await expect(page).toHaveURL(`${baseURL}stores/appstore-play/`);
	await page.goto('en/guides/create-app-store/');
	await page.reload();
	await expect(page.getByRole('heading', { name: '01 — Fork an app store' })).toBeVisible();
	await page.getByRole('link', { name: 'community collection', exact: true }).click();
	await expect(page).toHaveURL(baseURL!);
	expect(errors).toEqual([]);
});
