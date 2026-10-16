import { For } from 'solid-js';
import { Badge } from '@/components/ui/badge';
import { platforms, platformNames, type Platform } from '../data/platforms';
import { usePage } from '../lib/page';

export function PlatformBadges(props: { supported: Platform[] }) {
	const { t } = usePage();
	return (
		<For each={platforms.filter((platform) => props.supported.includes(platform))}>
			{(platform) => (
				<Badge variant="secondary" class={`platform-badge platform-badge--${platform}`} data-platform={platform}>
					{platform === 'zimaos' ? t('supportsZimaos') : platformNames[platform]}
				</Badge>
			)}
		</For>
	);
}
