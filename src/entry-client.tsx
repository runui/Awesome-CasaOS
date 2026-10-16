import { hydrate, render } from 'solid-js/web';
import { App } from './App';
import './styles/globals.scss';
import './styles/registry.css';
import './styles/site.scss';
import { resolveRoute, type PageData } from './lib/routes';
import { stripBase } from './lib/paths';

const root = document.getElementById('app')!;
const serialized = document.getElementById('page-data');
if (serialized) {
	const data = JSON.parse(serialized.textContent!) as PageData;
	hydrate(() => <App data={data} />, root);
} else if (import.meta.env.DEV) {
	// Development uses Vite's HTML fallback; production pages always arrive pre-rendered.
	const base = import.meta.env.BASE_URL;
	const route = resolveRoute(stripBase(window.location.pathname, base) ?? '/404.html');
	const data: PageData = { route, base };
	if (route.kind === 'guide') data.guideHtml = (await import('./lib/guides')).renderGuide(route.locale, base);
	document.documentElement.lang = route.locale === 'zh' ? 'zh-CN' : 'en';
	render(() => <App data={data} />, root);
}
