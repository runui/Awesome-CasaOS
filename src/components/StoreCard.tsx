import { For } from 'solid-js';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import type { Store } from '../data/stores';
import { usePage } from '../lib/page';
import { localePath } from '../lib/paths';
import { Icon } from './Icon';
import { StoreArtwork } from './StoreArtwork';
import { StoreSources } from './StoreSources';

export function StoreCard(props: { store: Store; index: number }) {
	const { locale, href, t } = usePage();
	return (
		<Card class={`store-card tone-${props.store.categories[0]}`}>
			<div class={`card-cover cover-${props.store.slug}`} aria-hidden="true">
				<StoreArtwork store={props.store} />
				<span class="cover-index">{String(props.index + 1).padStart(2, '0')}</span>
			</div>
			<CardHeader class="store-card-header">
				<div class="card-category">
					<For each={props.store.categories}>{(category) => <Badge variant="secondary">{t(`categories:${category}`)}</Badge>}</For>
				</div>
				<h3>
					<a href={href(localePath(locale, `stores/${props.store.slug}/`))}>{props.store.name}</a>
				</h3>
				<p class="maintainer">{t('maintainedBy', { name: props.store.maintainer })}</p>
			</CardHeader>
			<CardContent class="store-card-content">
				<p>{props.store.summary}</p>
			</CardContent>
			<CardFooter class="store-card-footer">
				<StoreSources sources={props.store.sources} />
				<a class="store-card-details" href={href(localePath(locale, `stores/${props.store.slug}/`))}>
					<span>{t('viewStore')}</span>
					<Icon name="arrow" />
				</a>
			</CardFooter>
		</Card>
	);
}
