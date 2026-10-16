import { generateHydrationScript, renderToString } from 'solid-js/web';
import { App } from './App';
import { renderGuide } from './lib/guides';
import type { PageData, Route } from './lib/routes';

export function renderPage(route: Route, base: string) {
	const data: PageData = { route, base };
	if (route.kind === 'guide') data.guideHtml = renderGuide(route.locale, base);
	const html = renderToString(() => <App data={data} />);
	return { html, data, hydration: generateHydrationScript() };
}
