import { catalogs } from './data/stores';
import { getTranslator } from './lib/i18n';
import { PageContext } from './lib/page';
import type { PageData } from './lib/routes';
import { Header, Footer } from './components/Layout';
import { Catalog } from './pages/Catalog';
import { StoreDetail } from './pages/StoreDetail';
import { Guide } from './pages/Guide';
import { LegacyRedirect, NotFound } from './pages/Entry';

export function App(props: { data: PageData }) {
	const route = props.data.route;
	const t = getTranslator(route.locale);
	const stores = catalogs[route.locale].stores;
	const store = route.kind === 'store' ? stores.find((store) => store.slug === route.slug) : undefined;
	return (
		<PageContext.Provider value={props.data}>
			<a class="skip-link" href="#main-content">
				{t('skip')}
			</a>
			<Header />
			<main id="main-content">
				{route.kind === 'catalog' ? (
					<Catalog />
				) : route.kind === 'store' && store ? (
					<StoreDetail store={store} />
				) : route.kind === 'guide' ? (
					<Guide />
				) : route.kind === 'legacy' ? (
					<LegacyRedirect />
				) : (
					<NotFound />
				)}
			</main>
			<Footer />
		</PageContext.Provider>
	);
}
