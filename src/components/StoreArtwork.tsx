import { Show } from 'solid-js';
import type { Store } from '../data/stores';
import { Icon, type IconName } from './Icon';

const coverIcons: Partial<Record<string, IconName>> = {
	coolstore: 'snow',
	'appstore-play': 'play',
	'home-automation': 'home',
	'generative-ai-workbench': 'spark',
	edge: 'layers',
};

// Cards and detail banners share their decorative identity; the community's store names stay intact.
export function StoreArtwork(props: { store: Store }) {
	return (
		<div class="store-artwork" aria-hidden="true">
			<div class="cover-orbit" />
			<span class="cover-word">
				<Show when={coverIcons[props.store.slug]} fallback={props.store.mark}>
					{(name) => <Icon name={name()} />}
				</Show>
			</span>
		</div>
	);
}
