import { test, expect } from '@playwright/test';

const zimaosUrl = 'https://paodayag.dev/linuxserver/zimaos/store.json';
const casaosUrl = 'https://paodayag.dev/linuxserver/casaos/store.zip';

for (const { name, slug, url, sourceCount, casaos } of [
	{ name: 'CasaOS-AppStore-Play', slug: 'appstore-play', url: 'https://play.cuse.eu.org/store.json', sourceCount: 3, casaos: true },
	{ name: 'Big Bear CasaOS App Store', slug: 'big-bear', url: 'https://cdn.jsdelivr.net/gh/bigbeartechworld/big-bear-casaos@gh-pages/store.json', sourceCount: 2, casaos: true },
	{ name: 'Lintuxer Apps', slug: 'lintuxer', url: 'https://chicohaager.github.io/zima-appstore/store.json', sourceCount: 1, casaos: false },
]) {
	test(`${name} copies its documented native source from the platform filter and detail page`, async ({ page, baseURL }) => {
		await page.addInitScript(() =>
			Object.defineProperty(navigator.clipboard, 'writeText', { value: async (value: string) => sessionStorage.setItem('documented-source-url', value) }),
		);
		await page.goto('./?platform=zimaos#collection');
		const card = page.locator('.store-card').filter({ has: page.getByRole('heading', { name, exact: true }) });
		await expect(card.locator('.platform-badge--zimaos')).toHaveText('Supports ZimaOS');
		await expect(card.locator('.platform-badge--casaos')).toHaveCount(casaos ? 1 : 0);
		await expect(card.getByRole('button')).toHaveCount(1);
		await card.getByRole('button', { name: 'Copy URL: ZimaOS · App store source', exact: true }).click();
		expect(await page.evaluate(() => sessionStorage.getItem('documented-source-url'))).toBe(url);
		if (!casaos) {
			await page.getByRole('radio', { name: 'CasaOS', exact: true }).check();
			await expect(card).toHaveCount(0);
			await expect(page.locator('.store-card')).toHaveCount(9);
			await page.getByRole('radio', { name: 'ZimaOS', exact: true }).check();
		}
		await card.getByRole('heading').getByRole('link').click();
		await expect(page).toHaveURL(`${baseURL}stores/${slug}/`);
		await expect(page.locator('.source-url')).toHaveCount(sourceCount);
		await expect(page.locator('.platform-source-group').first()).toHaveAttribute('data-platform', 'zimaos');
		await expect(page.locator('.platform-source-group[data-platform="zimaos"] .source-url')).toHaveValue(url);
		await page.evaluate(() => sessionStorage.removeItem('documented-source-url'));
		await page.getByRole('button', { name: 'Copy URL: ZimaOS · App store source', exact: true }).click();
		expect(await page.evaluate(() => sessionStorage.getItem('documented-source-url'))).toBe(url);
	});
}

test('platform filters compose with search and categories and survive refresh, layouts, language changes and history', async ({ page, baseURL }) => {
	await page.goto('./?campaign=community#collection');
	const recommended = ['Big Bear CasaOS App Store', 'CasaOS-LinuxServer-AppStore', 'CasaOS-AppStore-Play', 'Lintuxer Apps'];
	await expect(page.locator('.store-card:nth-child(-n+4) h3')).toHaveText(recommended);
	await page.getByRole('radio', { name: 'ZimaOS', exact: true }).check();
	await expect(page.locator('.store-card')).toHaveCount(4);
	await expect(page.locator('.store-card .platform-badge--zimaos')).toHaveCount(4);
	await expect(page).toHaveURL(`${baseURL}?campaign=community&platform=zimaos#collection`);
	await page.getByRole('button', { name: 'List view', exact: true }).click();
	await expect(page.locator('#store-results')).toHaveAttribute('data-layout', 'list');
	await expect(page.locator('.store-card h3')).toHaveText(recommended);
	await expect(page.locator('.store-card .platform-badge--zimaos')).toHaveCount(4);
	await page.getByRole('checkbox', { name: 'General apps', exact: true }).check();
	await page.getByRole('searchbox').fill('LinuxServer');
	await expect(page.locator('.store-card')).toHaveCount(1);
	await page.reload();
	await expect(page.getByRole('radio', { name: 'ZimaOS', exact: true })).toBeChecked();
	await expect(page.getByRole('searchbox')).toHaveValue('LinuxServer');
	await page.getByRole('link', { name: '切换到中文' }).click();
	await expect(page).toHaveURL(/zh\/\?.*platform=zimaos/);
	await expect(page.locator('.store-card .platform-badge--zimaos')).toHaveText('支持 ZimaOS');
	await expect(page.getByRole('checkbox', { name: '综合应用', exact: true })).toBeChecked();
	await page.getByRole('button', { name: '清空筛选', exact: true }).click();
	await expect(page.getByRole('radio', { name: '全部平台', exact: true })).toBeChecked();
	await expect(page.locator('.store-card')).toHaveCount(10);
	await expect(page).toHaveURL(`${baseURL}zh/?campaign=community`);
	await page.evaluate(() => {
		const url = new URL(location.href);
		url.searchParams.set('platform', 'zimaos');
		history.pushState(null, '', url);
		window.dispatchEvent(new PopStateEvent('popstate'));
	});
	await expect(page.locator('.store-card')).toHaveCount(4);
	await page.goBack();
	await expect(page.locator('.store-card')).toHaveCount(10);
	await page.getByRole('radio', { name: 'ZimaOS', exact: true }).check();
	await page.getByRole('checkbox', { name: '安全工具', exact: true }).check();
	await expect(page.locator('.empty-state')).toBeVisible();
	await page.locator('.empty-state').getByRole('button', { name: '清空筛选', exact: true }).click();
	await expect(page.locator('.store-card')).toHaveCount(10);
});

test('all-platform menus label and copy distinct platform URLs, while filtered cards expose only the selected system', async ({ page }) => {
	await page.addInitScript(() => Object.defineProperty(navigator.clipboard, 'writeText', { value: async (url: string) => sessionStorage.setItem('copied-platform-url', url) }));
	await page.goto('./#collection');
	const store = page.locator('.store-card').filter({ has: page.getByRole('heading', { name: 'CasaOS-LinuxServer-AppStore', exact: true }) });
	await store.getByRole('button', { name: 'Choose a source (2 available)', exact: true }).click();
	await expect(page.getByRole('menuitem').first()).toHaveAttribute('aria-label', 'Copy URL: ZimaOS · App store source');
	await expect(page.getByRole('menu').locator('.source-menu-url')).toHaveText([zimaosUrl, casaosUrl]);
	await page.getByRole('menuitem', { name: 'Copy URL: ZimaOS · App store source', exact: true }).click();
	expect(await page.evaluate(() => sessionStorage.getItem('copied-platform-url'))).toBe(zimaosUrl);
	await expect(store.getByRole('status')).toHaveText('Copied to clipboard ZimaOS · App store source');
	await page.getByRole('radio', { name: 'CasaOS', exact: true }).check();
	await expect(store.getByRole('button', { name: 'Copy URL: CasaOS · App store source', exact: true })).toBeEnabled();
	await expect(store.getByRole('status')).toHaveText('');
	await store.getByRole('button', { name: 'Copy URL: CasaOS · App store source', exact: true }).click();
	expect(await page.evaluate(() => sessionStorage.getItem('copied-platform-url'))).toBe(casaosUrl);
	await page.getByRole('radio', { name: 'ZimaOS', exact: true }).check();
	await expect(store.getByRole('button', { name: 'Copy URL: ZimaOS · App store source', exact: true })).toBeEnabled();
	await store.getByRole('button', { name: 'Copy URL: ZimaOS · App store source', exact: true }).click();
	expect(await page.evaluate(() => sessionStorage.getItem('copied-platform-url'))).toBe(zimaosUrl);
	await store.getByRole('heading').getByRole('link').click();
	await expect(page.locator('.detail-badges .platform-badge--zimaos')).toHaveText('Supports ZimaOS');
	await expect(page.locator('.platform-source-group').first()).toHaveAttribute('data-platform', 'zimaos');
	await expect(page.locator('.source-url').nth(0)).toHaveValue(zimaosUrl);
	await expect(page.locator('.source-url').nth(1)).toHaveValue(casaosUrl);
	await page.getByRole('button', { name: 'Copy URL: CasaOS · App store source', exact: true }).click();
	expect(await page.evaluate(() => sessionStorage.getItem('copied-platform-url'))).toBe(casaosUrl);
	await page.getByRole('button', { name: 'Copy URL: ZimaOS · App store source', exact: true }).click();
	expect(await page.evaluate(() => sessionStorage.getItem('copied-platform-url'))).toBe(zimaosUrl);
});

test('changing platform during a pending copy never reuses its URL or shows its success for another system', async ({ page }) => {
	await page.goto('./?platform=zimaos#collection');
	await page.evaluate(() =>
		Object.defineProperty(navigator.clipboard, 'writeText', {
			configurable: true,
			value: (url: string) =>
				new Promise<void>((resolve) => {
					sessionStorage.setItem('requested-platform-url', url);
					Object.assign(window, { finishPlatformCopy: resolve });
				}),
		}),
	);
	const store = page.locator('.store-card').filter({ has: page.getByRole('heading', { name: 'CasaOS-LinuxServer-AppStore', exact: true }) });
	await store.getByRole('button', { name: 'Copy URL: ZimaOS · App store source', exact: true }).click();
	await page.getByRole('radio', { name: 'CasaOS', exact: true }).check();
	await expect(store.getByRole('button', { name: 'Copying…: CasaOS · App store source', exact: true })).toBeDisabled();
	expect(await page.evaluate(() => sessionStorage.getItem('requested-platform-url'))).toBe(zimaosUrl);
	await page.evaluate(() => (window as unknown as { finishPlatformCopy: () => void }).finishPlatformCopy());
	await expect(store.getByRole('button', { name: 'Copy URL: CasaOS · App store source', exact: true })).toBeEnabled();
	await expect(store.getByRole('status')).toHaveText('');
	await page.evaluate(() => Object.defineProperty(navigator.clipboard, 'writeText', { value: async (url: string) => sessionStorage.setItem('requested-platform-url', url) }));
	await store.getByRole('button', { name: 'Copy URL: CasaOS · App store source', exact: true }).click();
	expect(await page.evaluate(() => sessionStorage.getItem('requested-platform-url'))).toBe(casaosUrl);
	await expect(store.getByRole('status')).toHaveText('Copied to clipboard CasaOS · App store source');
});

test('mobile platform controls and platform-specific detail sections fit narrow screens', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 850 });
	await page.goto('zh/#collection');
	await page.getByRole('button', { name: '搜索与筛选', exact: true }).click();
	await page.getByRole('radio', { name: 'ZimaOS', exact: true }).check();
	await expect(page.locator('.store-card')).toHaveCount(4);
	for (const layout of ['列表视图', '卡片视图']) {
		await page.getByRole('button', { name: layout, exact: true }).click();
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
	}
	await page.locator('.store-card').first().getByRole('heading').getByRole('link').click();
	await expect(page.locator('.platform-source-group').first().getByRole('heading')).toHaveText('ZimaOS 应用源');
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('platform badges and both source formats remain readable without JavaScript', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	const page = await context.newPage();
	await page.goto(baseURL!);
	await expect(page.locator('.platform-badge--zimaos')).toHaveCount(4);
	await expect(page.locator('.store-card:nth-child(-n+4) h3')).toHaveText(['Big Bear CasaOS App Store', 'CasaOS-LinuxServer-AppStore', 'CasaOS-AppStore-Play', 'Lintuxer Apps']);
	await page.getByRole('heading', { name: 'CasaOS-LinuxServer-AppStore', exact: true }).getByRole('link').click();
	await expect(page.getByRole('heading', { name: 'ZimaOS sources', exact: true })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'CasaOS sources', exact: true })).toBeVisible();
	await expect(page.locator('.source-url').nth(0)).toHaveValue(zimaosUrl);
	await expect(page.locator('.source-url').nth(1)).toHaveValue(casaosUrl);
	await context.close();
});
