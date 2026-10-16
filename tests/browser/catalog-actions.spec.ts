import { test, expect } from '@playwright/test';

test('layout choice survives refresh and language changes without changing filters or the URL', async ({ page, baseURL }) => {
	await page.goto('./?category=china&campaign=community#collection');
	await expect(page.locator('.store-card')).toHaveCount(1);
	await expect(page.getByRole('button', { name: 'Card view', exact: true })).toHaveAttribute('aria-pressed', 'true');
	await page.getByRole('button', { name: 'List view', exact: true }).click();
	await expect(page.locator('#store-results')).toHaveAttribute('data-layout', 'list');
	await expect(page).toHaveURL(`${baseURL}?category=china&campaign=community#collection`);
	await page.reload();
	await expect(page.getByRole('button', { name: 'List view', exact: true })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.locator('.store-card')).toHaveCount(1);
	await page.getByRole('link', { name: '切换到中文' }).click();
	await expect(page.locator('#store-results')).toHaveAttribute('data-layout', 'list');
	await expect(page.locator('.store-card')).toHaveCount(1);
	await expect(page).toHaveURL(`${baseURL}zh/?category=china&campaign=community`);
	await page.getByRole('button', { name: '卡片视图', exact: true }).click();
	await expect(page.locator('#store-results')).toHaveAttribute('data-layout', 'cards');
	await page.reload();
	await expect(page.getByRole('button', { name: '卡片视图', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('flat source actions copy exact variants from cards and list menus without navigating or opening inputs', async ({ page, baseURL }) => {
	await page.goto('./#collection');
	// Use a per-context clipboard stub so parallel browser tests cannot overwrite each other's system clipboard.
	await page.evaluate(() =>
		Object.defineProperty(navigator.clipboard, 'writeText', {
			configurable: true,
			value: async (url: string) => {
				sessionStorage.setItem('test-copied-url', url);
			},
		}),
	);
	const play = page.locator('.store-card').filter({ has: page.getByRole('heading', { name: 'CasaOS-AppStore-Play', exact: true }) });
	const trigger = play.getByRole('button', { name: 'Choose a source (2 available)', exact: true });
	await expect(play.locator('.source-actions')).toHaveCount(1);
	await expect(play.getByRole('button')).toHaveCount(1);
	await expect(page.getByRole('menu')).toHaveCount(0);
	await trigger.click();
	expect(await page.evaluate(() => sessionStorage.getItem('test-copied-url'))).toBeNull();
	await expect(page.getByRole('menu').locator('.source-menu-url')).toHaveText([
		'https://play.cuse.eu.org/Cp0204-AppStore-Play.zip',
		'https://play.cuse.eu.org/Cp0204-AppStore-Play-arm.zip',
	]);
	await page.getByRole('menuitem', { name: 'Copy URL: Standard source', exact: true }).click();
	await expect(trigger).toHaveText('Copied to clipboard');
	await expect(play.getByRole('status')).toHaveText('Copied to clipboard Standard source');
	expect(await page.evaluate(() => sessionStorage.getItem('test-copied-url'))).toBe('https://play.cuse.eu.org/Cp0204-AppStore-Play.zip');
	await page.getByRole('button', { name: 'List view', exact: true }).click();
	await expect(trigger).toHaveText('Copied to clipboard');
	await trigger.click();
	await expect(page.getByRole('menuitem')).toHaveCount(2);
	await page.getByRole('menuitem', { name: 'Copy URL: ARMv7 · Raspberry Pi 2 / OneCloud', exact: true }).click();
	await expect(page.getByRole('menu')).toHaveCount(0);
	await expect(trigger).toHaveText('Copied to clipboard');
	await expect(play.getByRole('status')).toHaveText('Copied to clipboard ARMv7 · Raspberry Pi 2 / OneCloud');
	expect(await page.evaluate(() => sessionStorage.getItem('test-copied-url'))).toBe('https://play.cuse.eu.org/Cp0204-AppStore-Play-arm.zip');
	await expect(play.getByRole('textbox')).toHaveCount(0);
	await expect(page).toHaveURL(`${baseURL}#collection`);

	await page.evaluate(() => {
		Object.defineProperty(navigator.clipboard, 'writeText', { value: () => Promise.reject(new Error('denied')) });
		Object.defineProperty(document, 'execCommand', { value: () => false });
	});
	const edge = page.locator('.store-card').filter({ has: page.getByRole('heading', { name: 'CasaOS (Edge) AppStore', exact: true }) });
	await edge.getByRole('button', { name: 'Copy URL: App store source', exact: true }).click();
	await expect(edge.getByRole('status')).toHaveText('Couldn’t write to the clipboard. Please try again.');
	await expect(edge.getByRole('textbox')).toHaveCount(0);
	await expect(page.locator('textarea')).toHaveCount(0);
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await page.getByRole('button', { name: 'Card view', exact: true }).click();
	await expect(edge.getByRole('status')).toHaveText('Couldn’t write to the clipboard. Please try again.');
	await expect(edge.getByRole('textbox')).toHaveCount(0);
	await expect(page).toHaveURL(`${baseURL}#collection`);
	await edge.getByRole('heading').getByRole('link').click();
	await expect(page).toHaveURL(`${baseURL}stores/edge/`);
});

test('pending copying stays disabled through view changes and can finish safely after filtering removes the item', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto('./#collection');
	await page.evaluate(() =>
		Object.defineProperty(navigator.clipboard, 'writeText', {
			value: () =>
				new Promise<void>((resolve) => {
					Object.assign(window, { completeCopy: resolve });
				}),
		}),
	);
	const first = page.locator('.store-card').first();
	await first.getByRole('button', { name: 'Copy URL: App store source', exact: true }).click();
	await expect(first.getByRole('button', { name: 'Copying…: App store source', exact: true })).toBeDisabled();
	await page.getByRole('button', { name: 'List view', exact: true }).click();
	await expect(first.getByRole('button', { name: 'Copying…: App store source', exact: true })).toBeDisabled();
	await page.getByRole('searchbox').fill('Coolstore');
	await expect(page.locator('.store-card')).toHaveCount(1);
	await page.evaluate(() => (window as unknown as { completeCopy: () => void }).completeCopy());
	await expect(page.locator('.store-card h3')).toHaveText('CasaOS-Coolstore');
	await expect(page.locator('.store-card').getByRole('button', { name: 'Copy URL: App store source', exact: true })).toBeEnabled();
	expect(errors).toEqual([]);
});

test('direct copy uses a temporary invisible compatibility control when storage and the Clipboard API are unavailable', async ({ page }) => {
	await page.addInitScript(() => {
		Object.defineProperty(window, 'localStorage', {
			get() {
				throw new Error('blocked');
			},
		});
		Object.defineProperty(navigator, 'clipboard', { value: undefined });
		Object.defineProperty(document, 'execCommand', {
			value: (command: string) => {
				const control = document.activeElement;
				if (command !== 'copy' || !(control instanceof HTMLTextAreaElement)) return false;
				sessionStorage.setItem('test-copied-url', control.value);
				sessionStorage.setItem('test-copy-control-hidden', String(control.getBoundingClientRect().right < 0 && control.readOnly));
				return true;
			},
		});
	});
	await page.goto('zh/#collection');
	await page.getByRole('button', { name: '列表视图', exact: true }).click();
	await expect(page.locator('#store-results')).toHaveAttribute('data-layout', 'list');
	const first = page.locator('.store-card').first();
	await first.getByRole('button', { name: '复制地址: 应用商店源', exact: true }).click();
	await expect(first.getByRole('button', { name: '已写入剪贴板: 应用商店源', exact: true })).toBeVisible();
	expect(await page.evaluate(() => sessionStorage.getItem('test-copied-url'))).toBe('https://casaos-appstore.paodayag.dev/linuxserver.zip');
	expect(await page.evaluate(() => sessionStorage.getItem('test-copy-control-hidden'))).toBe('true');
	await expect(page.locator('textarea')).toHaveCount(0);
	await expect(first.getByRole('textbox')).toHaveCount(0);
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await page.getByRole('button', { name: '卡片视图', exact: true }).click();
	await expect(page.locator('#store-results')).toHaveAttribute('data-layout', 'cards');
});

test('source menu supports keyboard navigation and requires an explicit URL choice on every copy', async ({ page }) => {
	await page.goto('./#collection');
	await page.evaluate(() =>
		Object.defineProperty(navigator.clipboard, 'writeText', {
			value: async (url: string) => {
				sessionStorage.setItem('test-copied-url', url);
			},
		}),
	);
	const play = page.locator('.store-card').filter({ has: page.getByRole('heading', { name: 'CasaOS-AppStore-Play', exact: true }) });
	const trigger = play.getByRole('button', { name: 'Choose a source (2 available)', exact: true });
	await trigger.focus();
	await page.keyboard.press('ArrowDown');
	await expect(trigger).toHaveAttribute('aria-expanded', 'true');
	await expect(page.getByRole('menuitem').first()).toBeFocused();
	await page.keyboard.press('Escape');
	await expect(page.getByRole('menu')).toHaveCount(0);
	await expect(trigger).toBeFocused();
	await page.keyboard.press('ArrowUp');
	await expect(page.getByRole('menuitem').last()).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(page.getByRole('menu')).toHaveCount(0);
	await expect(trigger).toHaveText('Copied to clipboard');
	await expect(play.getByRole('status')).toHaveText('Copied to clipboard ARMv7 · Raspberry Pi 2 / OneCloud');
	await expect(trigger).toBeFocused();
	expect(await page.evaluate(() => sessionStorage.getItem('test-copied-url'))).toBe('https://play.cuse.eu.org/Cp0204-AppStore-Play-arm.zip');
	await page.evaluate(() => sessionStorage.removeItem('test-copied-url'));
	await trigger.click();
	await expect(page.getByRole('menu')).toBeVisible();
	expect(await page.evaluate(() => sessionStorage.getItem('test-copied-url'))).toBeNull();
	await page.getByRole('menuitem', { name: 'Copy URL: Standard source', exact: true }).click();
	expect(await page.evaluate(() => sessionStorage.getItem('test-copied-url'))).toBe('https://play.cuse.eu.org/Cp0204-AppStore-Play.zip');
	await trigger.click();
	await page.getByRole('heading', { name: 'The collection', exact: false }).click();
	await expect(page.getByRole('menu')).toHaveCount(0);
	await trigger.click();
	await page.getByRole('searchbox').fill('Coolstore');
	await expect(page.getByRole('menu')).toHaveCount(0);
	await expect(page.locator('.store-card')).toHaveCount(1);
});

test('multi-source copying stays tied to the chosen URL while pending and can be retried from the menu', async ({ page }) => {
	await page.goto('./#collection');
	await page.evaluate(() => {
		Object.defineProperty(navigator.clipboard, 'writeText', {
			configurable: true,
			value: (url: string) =>
				new Promise<void>((_resolve, reject) => {
					sessionStorage.setItem('test-requested-url', url);
					Object.assign(window, { rejectSourceCopy: () => reject(new Error('denied')) });
				}),
		});
		Object.defineProperty(document, 'execCommand', { value: () => false });
	});
	const play = page.locator('.store-card').filter({ has: page.getByRole('heading', { name: 'CasaOS-AppStore-Play', exact: true }) });
	const trigger = play.getByRole('button', { name: 'Choose a source (2 available)', exact: true });
	await trigger.click();
	await page.getByRole('menuitem', { name: 'Copy URL: ARMv7 · Raspberry Pi 2 / OneCloud', exact: true }).click();
	await expect(trigger).toHaveText('Copying…');
	await expect(trigger).toBeFocused();
	await page.getByRole('button', { name: 'List view', exact: true }).click();
	await trigger.click();
	await expect(page.getByRole('menuitem').first()).toHaveAttribute('aria-disabled', 'true');
	await expect(page.getByRole('menuitem').last()).toHaveAttribute('aria-disabled', 'true');
	expect(await page.evaluate(() => sessionStorage.getItem('test-requested-url'))).toBe('https://play.cuse.eu.org/Cp0204-AppStore-Play-arm.zip');
	await page.keyboard.press('Escape');
	await page.evaluate(() => (window as unknown as { rejectSourceCopy: () => void }).rejectSourceCopy());
	await expect(play.getByRole('status')).toHaveText('Couldn’t write to the clipboard. Please try again.');
	await expect(play.getByRole('textbox')).toHaveCount(0);
	await page.evaluate(() =>
		Object.defineProperty(navigator.clipboard, 'writeText', {
			value: async (url: string) => {
				sessionStorage.setItem('test-copied-url', url);
			},
		}),
	);
	await trigger.click();
	await page.getByRole('menuitem', { name: 'Copy URL: Standard source', exact: true }).click();
	await expect(trigger).toHaveText('Copied to clipboard');
	await expect(play.getByRole('status')).toHaveText('Copied to clipboard Standard source');
	expect(await page.evaluate(() => sessionStorage.getItem('test-copied-url'))).toBe('https://play.cuse.eu.org/Cp0204-AppStore-Play.zip');
});

for (const view of ['Card view', 'List view']) {
	test(`outside clicks dismiss the ${view} source menu before copying, switching layouts, or navigating`, async ({ page, baseURL }) => {
		await page.setViewportSize({ width: 1440, height: 1080 });
		await page.goto('./#collection');
		await page.evaluate(() =>
			Object.defineProperty(navigator.clipboard, 'writeText', {
				value: async (url: string) => {
					sessionStorage.setItem('test-copied-url', url);
				},
			}),
		);
		await page.getByRole('button', { name: view, exact: true }).click();
		const play = page.locator('.store-card').filter({ has: page.getByRole('heading', { name: 'CasaOS-AppStore-Play', exact: true }) });
		const trigger = play.getByRole('button', { name: 'Choose a source (2 available)', exact: true });
		const singleCopy = page.locator('.store-card').first().getByRole('button', { name: 'Copy URL: App store source', exact: true });
		await trigger.click();
		await singleCopy.click();
		await expect(page.getByRole('menu')).toHaveCount(0);
		expect(await page.evaluate(() => sessionStorage.getItem('test-copied-url'))).toBeNull();
		await expect(trigger).toBeFocused();
		await singleCopy.click();
		expect(await page.evaluate(() => sessionStorage.getItem('test-copied-url'))).toBe('https://casaos-appstore.paodayag.dev/linuxserver.zip');

		await trigger.click();
		const nextView = page.getByRole('button', { name: view === 'Card view' ? 'List view' : 'Card view', exact: true });
		await nextView.click();
		await expect(page.getByRole('menu')).toHaveCount(0);
		await expect(page.locator('#store-results')).toHaveAttribute('data-layout', view === 'Card view' ? 'cards' : 'list');
		await nextView.click();
		await expect(nextView).toHaveAttribute('aria-pressed', 'true');

		await trigger.click();
		const link = play.getByRole('heading').getByRole('link');
		await link.click();
		await expect(page.getByRole('menu')).toHaveCount(0);
		await expect(page).toHaveURL(`${baseURL}#collection`);
		await link.click();
		await expect(page).toHaveURL(`${baseURL}stores/appstore-play/`);
	});
}

test('outside touch dismisses the source menu and the next tap activates its target', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
	const page = await context.newPage();
	await page.goto(`${baseURL}zh/#collection`);
	const play = page.locator('.store-card').filter({ has: page.getByRole('heading', { name: 'CasaOS-AppStore-Play', exact: true }) });
	const trigger = play.getByRole('button', { name: '选择应用源（共 2 个）', exact: true });
	const link = play.getByRole('heading').getByRole('link');
	for (const view of ['卡片视图', '列表视图']) {
		await page.getByRole('button', { name: view, exact: true }).tap();
		await trigger.tap();
		await link.tap();
		await expect(page.getByRole('menu')).toHaveCount(0);
		await expect(page).toHaveURL(`${baseURL}zh/#collection`);
	}
	await link.tap();
	await expect(page).toHaveURL(`${baseURL}zh/stores/appstore-play/`);
	await context.close();
});

for (const width of [320, 390, 600, 768, 1440]) {
	test(`both layouts and source menus fit a ${width}px viewport in both languages`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 });
		for (const [path, cards, list] of [
			['./#collection', 'Card view', 'List view'],
			['zh/#collection', '卡片视图', '列表视图'],
		]) {
			await page.goto(path);
			for (const view of [list, cards]) {
				await page.getByRole('button', { name: view, exact: true }).click();
				expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
				await expect(page.locator('.store-card').first().getByRole('button')).toBeVisible();
				await expect(page.locator('.store-card').first().getByRole('button')).toHaveText(path.startsWith('zh/') ? '复制地址' : 'Copy URL');
				if (view === cards) {
					// Both source types sit on the left and align with store details at the right edge.
					for (const card of await page.locator('.store-card').all()) {
						expect(
							await card.evaluate((element) => {
								const footer = element.querySelector('.store-card-footer')!.getBoundingClientRect();
								const details = element.querySelector('.store-card-details')!.getBoundingClientRect();
								const copy = element.querySelector('.source-actions-copy')!.getBoundingClientRect();
								return (
									Math.abs(details.top + details.height / 2 - copy.top - copy.height / 2) < 1 &&
									copy.right <= details.left &&
									Math.abs(copy.left - footer.left) < 1 &&
									Math.abs(details.right - footer.right) < 1
								);
							}),
						).toBe(true);
					}
				}
				await page
					.locator('.store-card')
					.nth(1)
					.getByRole('button', { name: /Choose a source|选择应用源/ })
					.click();
				const menu = page.getByRole('menu');
				await expect(menu).toBeInViewport();
				await expect(menu.getByRole('menuitem')).toHaveCount(2);
				expect(
					await menu.evaluate((element) => {
						const rect = element.getBoundingClientRect();
						return rect.left >= 0 && rect.right <= innerWidth && rect.top >= 0 && rect.bottom <= innerHeight;
					}),
				).toBe(true);
				expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
				await page.keyboard.press('Escape');
			}
		}
	});
}
