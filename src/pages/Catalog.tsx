import { createMemo, createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { categories } from '../data/stores';
import { filterStores, parseQuery, serializeQuery, type CatalogQuery } from '../lib/catalog';
import { localePath } from '../lib/paths';
import { usePage } from '../lib/page';
import { Icon } from '../components/Icon';
import { BrandArtwork } from '../components/Brand';
import { StoreCard } from '../components/StoreCard';
import { CommunityNote, Contribution } from '../components/Community';

type CatalogLayout = 'cards' | 'list';
const layoutStorageKey = 'awesome-casaos.catalog-layout';

function Hero() {
	const { locale, href, t } = usePage();
	return (
		<section class="hero">
			<div class="container hero-inner">
				<div class="hero-copy">
					<p class="eyebrow">{t('community')}</p>
					<h1>
						{t('heroFirst')}
						<br />
						<span>{t('heroSecond')}</span>
					</h1>
					<p class="hero-description">{t('heroDescription')}</p>
					<div class="hero-actions">
						<a class="primary-link" href="#collection">
							{t('explore')}
							<Icon name="arrow" />
						</a>
						<a class="text-link" href={href(localePath(locale, 'guides/create-app-store/'))}>
							{t('heroGuide')}
							<Icon name="arrow" />
						</a>
					</div>
				</div>
				<div class="hero-art" aria-hidden="true">
					<div class="art-halo halo-blue" />
					<div class="art-halo halo-lilac" />
					<div class="art-orbit" />
					<div class="art-tile tile-ls">
						<span class="tile-symbol">LS</span>
						<span>LinuxServer</span>
					</div>
					<div class="art-tile tile-ai">
						<Icon name="spark" />
						<span>Imagine</span>
					</div>
					<div class="art-center">
						<BrandArtwork hero />
					</div>
					<div class="art-tile tile-ha">
						<Icon name="home" />
						<span>Home</span>
					</div>
					<div class="art-tile tile-cool">
						<Icon name="snow" />
						<span>Coolstore</span>
					</div>
					<div class="art-tile tile-play">
						<Icon name="play" />
						<span>Play</span>
					</div>
					<div class="art-tile tile-edge">
						<Icon name="layers" />
						<span>Discover</span>
					</div>
				</div>
				<div class="hero-qualities">
					<span>
						<Icon name="grid" />
						{t('madeFor')}
					</span>
					<span>
						<Icon name="check" />
						{t('curated')}
					</span>
					<span>
						<Icon name="github" />
						{t('openSource')}
					</span>
				</div>
			</div>
		</section>
	);
}

export function Catalog() {
	const { stores, t } = usePage();
	const [query, setQuery] = createSignal<CatalogQuery>({
		search: '',
		categories: [],
	});
	const [filtersOpen, setFiltersOpen] = createSignal(true);
	const [interactive, setInteractive] = createSignal(false);
	const [layout, setLayout] = createSignal<CatalogLayout>('cards');
	const visible = createMemo(() => filterStores(stores, query()));
	const hasFilters = () => Boolean(query().search || query().categories.length);

	function changeLayout(next: CatalogLayout) {
		setLayout(next);
		try {
			localStorage.setItem(layoutStorageKey, next);
		} catch {
			/* The view switch must work even when storage is disabled. */
		}
	}

	function update(next: CatalogQuery) {
		setQuery(next);
		// Replace only our query fields; unrelated query parameters and the fragment remain intact.
		const url = new URL(window.location.href);
		url.searchParams.delete('q');
		url.searchParams.delete('category');
		new URLSearchParams(serializeQuery(next)).forEach((value, key) => url.searchParams.append(key, value));
		window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
	}
	onMount(() => {
		// Restore only after hydration so every static language route starts with identical markup.
		try {
			const saved = localStorage.getItem(layoutStorageKey);
			if (saved === 'cards' || saved === 'list') setLayout(saved);
		} catch {
			/* Fall back to cards when storage is unavailable. */
		}
		setQuery(parseQuery(window.location.search));
		const mobile = window.matchMedia('(max-width: 760px)');
		setFiltersOpen(!mobile.matches);
		// Keep visibility and ARIA state aligned when crossing the responsive breakpoint.
		const resize = (event: MediaQueryListEvent) => setFiltersOpen(!event.matches);
		mobile.addEventListener('change', resize);
		setInteractive(true);
		const sync = () => setQuery(parseQuery(window.location.search));
		window.addEventListener('popstate', sync);
		onCleanup(() => {
			window.removeEventListener('popstate', sync);
			mobile.removeEventListener('change', resize);
		});
	});

	return (
		<>
			<Hero />
			<div class="container collection" id="collection">
				<div class="collection-heading">
					<div>
						<p class="eyebrow">{t('filterHeading')}</p>
						<h2>
							{t('collection')}
							<span class="collection-count">{stores.length.toString().padStart(2, '0')}</span>
						</h2>
						<p>{t('collectionDescription')}</p>
					</div>
					<div class="layout-switcher" role="group" aria-label={t('layout')}>
						<Button
							variant="ghost"
							size="icon"
							aria-label={t('cardView')}
							title={t('cardView')}
							aria-pressed={layout() === 'cards'}
							aria-controls="store-results"
							disabled={!interactive()}
							onClick={() => changeLayout('cards')}>
							<Icon name="grid" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							aria-label={t('listView')}
							title={t('listView')}
							aria-pressed={layout() === 'list'}
							aria-controls="store-results"
							disabled={!interactive()}
							onClick={() => changeLayout('list')}>
							<Icon name="list" />
						</Button>
					</div>
				</div>
				<div class="catalog-layout">
					<aside class="filter-sidebar">
						<Collapsible open={filtersOpen()} onOpenChange={setFiltersOpen} triggerId="filter-trigger" contentId="filter-content">
							<CollapsibleTrigger class="filter-trigger">
								{t('filters')}
								<Icon name="chevron" />
							</CollapsibleTrigger>
							<CollapsibleContent>
								<div class="filter-inner">
									<p class="filter-heading">{t('filterHeading')}</p>
									<label class="sr-only" for="store-search">
										{t('search')}
									</label>
									<div class="search-input">
										<Icon name="search" />
										<Input
											id="store-search"
											type="search"
											placeholder={t('searchPlaceholder')}
											value={query().search}
											onInput={(event) =>
												update({
													...query(),
													search: event.currentTarget.value,
												})
											}
											disabled={!interactive()}
										/>
									</div>
									<div class="category-heading">{t('categories')}</div>
									<Button
										variant="ghost"
										class={`all-stores ${!query().categories.length ? 'selected' : ''}`}
										onClick={() => update({ ...query(), categories: [] })}
										disabled={!interactive()}>
										<Icon name="grid" />
										<span>{t('allStores')}</span>
										<span class="filter-count">{stores.length}</span>
									</Button>
									<div class="category-list">
										<For each={categories}>
											{(category) => (
												<div class="category-option">
													<Checkbox
														id={`category-${category}`}
														checked={query().categories.includes(category)}
														disabled={!interactive()}
														onCheckedChange={(checked) =>
															update({
																...query(),
																categories: checked ? [...query().categories, category] : query().categories.filter((value) => value !== category),
															})
														}
													/>
													<label for={`category-${category}`}>{t(`categories:${category}`)}</label>
													<span class="filter-count">{stores.filter((store) => store.categories.includes(category)).length}</span>
												</div>
											)}
										</For>
									</div>
									<Show when={hasFilters()}>
										<Button variant="ghost" class="clear-filters" onClick={() => update({ search: '', categories: [] })}>
											{t('clear')}
										</Button>
									</Show>
									<div class="sidebar-note">
										<Icon name="spark" />
										<p>{t('footerDescription')}</p>
										<span>{t('communityName')} ↗</span>
									</div>
								</div>
							</CollapsibleContent>
						</Collapsible>
					</aside>
					<section class="catalog-results" aria-label={t('directory')}>
						<div class="results-toolbar">
							<p role="status" aria-live="polite">
								<strong>{visible().length}</strong> {t('of')} {stores.length} {t('results')}
							</p>
							<span>
								{t('curated')}
								<span class="tiny-dot" />
							</span>
						</div>
						<div class="store-grid" classList={{ 'store-grid--list': layout() === 'list' }} id="store-results" data-layout={layout()}>
							<For
								each={visible()}
								fallback={
									<div class="empty-state">
										<Icon name="search" />
										<h3>{t('noResults')}</h3>
										<p>{t('noResultsDescription')}</p>
										<Button onClick={() => update({ search: '', categories: [] })}>{t('clear')}</Button>
									</div>
								}>
								{(store) => <StoreCard store={store} index={stores.indexOf(store)} />}
							</For>
						</div>
					</section>
				</div>
				<CommunityNote />
				<Contribution />
			</div>
		</>
	);
}
