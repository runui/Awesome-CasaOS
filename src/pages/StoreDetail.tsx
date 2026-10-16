import { For } from 'solid-js';
import { Badge } from '@/components/ui/badge';
import type { Store } from '../data/stores';
import { usePage } from '../lib/page';
import { localePath } from '../lib/paths';
import { Icon } from '../components/Icon';
import { CommunityNote, Contribution } from '../components/Community';
import { StoreArtwork } from '../components/StoreArtwork';
import { SourceCopy } from '../components/SourceCopy';

export function StoreDetail(props: { store: Store }) {
	const { locale, href, t, stores } = usePage();
	return (
		<div class="container detail-page">
			<a class="back-link" href={href(localePath(locale))}>
				<Icon name="back" />
				{t('back')}
			</a>
			<div class={`detail-banner cover-${props.store.slug}`}>
				<StoreArtwork store={props.store} />
				<p>
					{t('community')} / {String(stores.indexOf(props.store) + 1).padStart(2, '0')}
				</p>
			</div>
			<div class="detail-heading">
				<div>
					<div class="detail-badges">
						<For each={props.store.categories}>{(category) => <Badge variant="secondary">{t(`categories:${category}`)}</Badge>}</For>
					</div>
					<h1>{props.store.name}</h1>
					<p>{props.store.summary}</p>
				</div>
				<a class="primary-link" href={props.store.repository}>
					{t('visitRepository')}
					<Icon name="external" />
				</a>
			</div>
			<div class="detail-layout">
				<div class="detail-body">
					<section>
						<p class="eyebrow">01 / {t('about')}</p>
						<h2>{t('about')}</h2>
						<p class="about-text">{props.store.description}</p>
					</section>
					<section class="sources-section">
						<p class="eyebrow">02 / {t('sources')}</p>
						<h2>{t('sources')}</h2>
						<p>{t('sourcesDescription')}</p>
						<For each={props.store.sources}>{(source) => <SourceCopy source={source} />}</For>
					</section>
					<section class="steps-section">
						<h2>{t('howTo')}</h2>
						<div class="steps">
							<For
								each={[
									[t('stepOne'), t('stepOneDescription')],
									[t('stepTwo'), t('stepTwoDescription')],
									[t('stepThree'), t('stepThreeDescription')],
								]}>
								{(step, index) => (
									<div>
										<span class="step-number">0{index() + 1}</span>
										<h3>{step[0]}</h3>
										<p>{step[1]}</p>
									</div>
								)}
							</For>
						</div>
					</section>
				</div>
				<aside class="detail-facts">
					<div>
						<h2>{t('maintainer')}</h2>
						<p>{props.store.maintainer}</p>
					</div>
					<div>
						<h2>{t('categories')}</h2>
						<p>{props.store.categories.map((category) => t(`categories:${category}`)).join(' / ')}</p>
					</div>
					<div>
						<h2>{t('sourceCount')}</h2>
						<p>{props.store.sources.length.toString().padStart(2, '0')}</p>
					</div>
					<a href={props.store.repository}>
						{t('repository')}
						<Icon name="external" />
					</a>
				</aside>
			</div>
			<CommunityNote />
			<Contribution />
		</div>
	);
}
