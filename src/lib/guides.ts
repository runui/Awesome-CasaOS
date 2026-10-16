import MarkdownIt from 'markdown-it';
import { withBase } from './paths';
import type { Locale } from './locales';

const guides = import.meta.glob<string>('../../content/guides/*/*.md', {
	query: '?raw',
	import: 'default',
	eager: true,
});

export function renderGuide(locale: Locale, base: string): string {
	const source = guides[`../../content/guides/${locale}/create-app-store.md`];
	if (!source?.trim()) throw new Error(`Missing tutorial translation: ${locale}`);
	const markdown = new MarkdownIt({
		html: false,
		linkify: false,
		typographer: true,
	});
	const defaultLink = markdown.renderer.rules.link_open;
	// Rewrite at token level so tutorial links use the same base as page navigation.
	markdown.renderer.rules.link_open = (tokens, index, options, env, self) => {
		const href = tokens[index].attrGet('href');
		if (href?.startsWith('/') && !href.startsWith('//')) tokens[index].attrSet('href', withBase(href, base));
		return defaultLink ? defaultLink(tokens, index, options, env, self) : self.renderToken(tokens, index, options);
	};
	return markdown.render(source);
}
