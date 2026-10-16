import { usePage } from '../lib/page';
import { localePath } from '../lib/paths';
import { Icon } from '../components/Icon';
import { Contribution } from '../components/Community';

export function Guide() {
	const { guideHtml, t, href, locale } = usePage();
	return (
		<div class="container guide-page">
			<a class="back-link" href={href(localePath(locale))}>
				<Icon name="back" />
				{t('back')}
			</a>
			<header class="guide-heading">
				<p class="eyebrow">{t('guideEyebrow')}</p>
				<h1>{t('guideTitle')}</h1>
				<p>{t('guideDescription')}</p>
			</header>
			<article class="prose" innerHTML={guideHtml} />
			<Contribution />
		</div>
	);
}
