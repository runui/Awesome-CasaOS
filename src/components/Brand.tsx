import { For, Show } from 'solid-js';
import { localePath } from '../lib/paths';
import { usePage } from '../lib/page';

const brands = [
	{ name: 'CasaOS', phase: 'casaos', logo: '/logo.png' },
	{ name: 'ZimaOS', phase: 'zimaos', logo: '/zimaos-logo.png' },
];

export function BrandArtwork(props: { hero?: boolean }) {
	const { href, t } = usePage();
	return (
		<span class="brand-sequence" classList={{ 'brand-sequence--hero': props.hero }} aria-hidden="true">
			<For each={brands}>
				{(brand) => (
					<span class={`brand-phase brand-phase--${brand.phase}`}>
						{/* Each placement shares the same layers and keyframes, including the clipped color echoes. */}
						<For each={['base', 'cyan', 'red']}>
							{(layer) => (
								<span class={`brand-face brand-face--${layer}`}>
									<img src={href(brand.logo)} width={props.hero ? 78 : 30} height={props.hero ? 67 : 30} alt="" />
									<Show
										when={props.hero}
										fallback={
											<span>
												Awesome <span class="brand-light">{brand.name}</span>
											</span>
										}>
										<span class="brand-art-name">{brand.name}</span>
										<small>{t('madeForBrand', { brand: brand.name })}</small>
									</Show>
								</span>
							)}
						</For>
					</span>
				)}
			</For>
		</span>
	);
}

export function Brand() {
	const { locale, href, t } = usePage();
	return (
		<a class="brand brand--animated" href={href(localePath(locale))} aria-label={`${t('siteName')} · ${t('platforms')}`}>
			<BrandArtwork />
		</a>
	);
}
