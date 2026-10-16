import { onMount } from 'solid-js';
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
	onMount(() => {
		// Align every brand layer to the header's original clock after hydration, including the offscreen footer.
		// This preserves the current phase if static HTML started animating before JavaScript arrived.
		const animations = document.getAnimations().filter((animation) => animation instanceof CSSAnimation && animation.animationName.startsWith('brand-'));
		const startTime = animations[0]?.startTime ?? document.timeline.currentTime;
		if (startTime !== null) {
			for (const animation of animations) animation.startTime = startTime;
		}
	});
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
