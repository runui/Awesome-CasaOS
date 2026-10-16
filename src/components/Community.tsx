import { usePage, repository } from '../lib/page';
import { Icon } from './Icon';

export function CommunityNote() {
	const { t } = usePage();
	return (
		<aside class="community-note">
			<Icon name="globe" />
			<div>
				<h2>{t('communityNote')}</h2>
				<p>{t('disclaimer')}</p>
			</div>
		</aside>
	);
}

export function Contribution() {
	const { t } = usePage();
	return (
		<section class="contribution">
			<div>
				<p class="eyebrow">{t('contributeEyebrow')}</p>
				<h2>{t('contributeTitle')}</h2>
				<p>{t('contributeDescription')}</p>
			</div>
			<a class="primary-link" href={`${repository}/blob/main/CONTRIBUTING.md`}>
				{t('contribute')}
				<Icon name="plus" />
			</a>
		</section>
	);
}
