import { expect, test } from 'vitest';
import { getTranslator } from '../src/lib/i18n';
import { resolveRoute } from '../src/lib/routes';
import { escapeHtml, pageHead } from '../src/lib/seo';

test('i18next resolves UI and category namespaces, including fields inherited from base JSON', () => {
	const en = getTranslator('en');
	const zh = getTranslator('zh');
	expect(en('directory')).toBe('App stores');
	expect(zh('directory')).toBe('应用商店');
	expect(en('categories:general')).toBe('General apps');
	expect(zh('categories:general')).toBe('综合应用');
	expect(en('categories:ai')).toBe('Generative AI');
	expect(zh('categories:ai')).toBe('生成式 AI');
	expect(zh('github')).toBe('GitHub');
	expect(zh('casaos')).toBe('CasaOS');
});

test('route translators are ready synchronously and keep their language across interleaved renders', () => {
	const en = getTranslator('en');
	const zh = getTranslator('zh');
	expect(zh('copy')).toBe('复制地址');
	expect(en('copy')).toBe('Copy URL');
	expect(getTranslator('zh')('directoryTitle')).toBe('ZimaOS 和 CasaOS 应用商店');
	expect(en('directoryTitle')).toBe('ZimaOS and CasaOS app stores');
	expect(zh('copy')).toBe('复制地址');
});

test('interpolation keeps names intact and the HTML renderer escapes them exactly once', () => {
	const name = 'A&B <team>';
	const en = getTranslator('en');
	const zh = getTranslator('zh');
	expect(en('maintainedBy', { name })).toBe('By A&B <team>');
	expect(zh('maintainedBy', { name })).toBe('维护者 A&B <team>');
	expect(escapeHtml(en('maintainedBy', { name }))).toBe('By A&amp;B &lt;team&gt;');
});

test('SEO renders translated titles and descriptions without waiting for browser initialization', () => {
	const zh = pageHead(resolveRoute('/zh/'), '/');
	const en = pageHead(resolveRoute('/'), '/');
	const guide = pageHead(resolveRoute('/zh/guides/create-app-store/'), '/');
	expect(zh).toContain('<title>ZimaOS 和 CasaOS 应用商店 · Awesome ZimaOS</title>');
	expect(zh).toContain('探索 ZimaOS 和 CasaOS 的社区应用商店。');
	expect(en).toContain('<title>ZimaOS and CasaOS app stores · Awesome ZimaOS</title>');
	expect(en).toContain('Explore community app stores for ZimaOS and CasaOS.');
	expect(guide).toContain('<title>创建你的第一个应用商店 · Awesome ZimaOS</title>');
	expect(pageHead(resolveRoute('/zh/'), '/')).toBe(zh);
});
