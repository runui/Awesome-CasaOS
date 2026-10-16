import { For } from 'solid-js';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import type { Store } from '../data/stores';
import type { Platform } from '../data/platforms';
import { usePage } from '../lib/page';
import { localePath } from '../lib/paths';
import { Icon } from './Icon';
import { StoreArtwork } from './StoreArtwork';
import { StoreSources } from './StoreSources';
import { PlatformBadges } from './PlatformBadges';

export function StoreCard(props: { store: Store; platform?: Platform }) {
	const { locale, href, t } = usePage();
	return (
		<Card class={`store-card tone-${props.store.categories[0]}`}>
			<div class={`card-cover cover-${props.store.slug}`}>
				<StoreArtwork store={props.store} />
				<span class="cover-maintainer">{t('maintainedBy', { name: props.store.maintainer })}</span>
			</div>
			<CardHeader class="store-card-header">
				<div class="card-category">
					<PlatformBadges supported={props.store.platforms} />
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
				<StoreSources sources={props.store.sources.filter((source) => !props.platform || source.platform === props.platform)} />
				<a class="store-card-details" href={href(localePath(locale, `stores/${props.store.slug}/`))}>
					<span>{t('viewStore')}</span>
					<Icon name="arrow" />
				</a>
			</CardFooter>
		</Card>
	);
}
