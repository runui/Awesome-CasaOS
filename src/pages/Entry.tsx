import { onMount } from 'solid-js';
import { readPreferredLocale, saveLocale } from '../lib/i18n';
import { usePage } from '../lib/page';
import { localePath } from '../lib/paths';
import { translatedPath } from '../lib/routes';
import { Icon } from '../components/Icon';

export function LegacyRedirect() {
	const { route, href, t } = usePage();
	onMount(() => {
		const locale = readPreferredLocale();
		// Historic links still honor preferences and keep usable language links without JavaScript.
		window.location.replace(href(translatedPath(route, locale)) + window.location.search + window.location.hash);
	});
	return (
		<section class="entrance container">
			<p class="eyebrow">{t('siteName')}</p>
			<h1>{t('oldPage')}</h1>
			<p>{t('entranceDescription')}</p>
			<div class="entrance-links">
				<a class="primary-link" href={href(translatedPath(route, 'en'))} lang="en" onClick={() => saveLocale('en')}>
					Explore in English
					<Icon name="arrow" />
				</a>
				<a class="outline-link" href={href(translatedPath(route, 'zh'))} lang="zh-CN" onClick={() => saveLocale('zh')}>
					使用中文探索
					<Icon name="arrow" />
				</a>
			</div>
		</section>
	);
}

export function NotFound() {
	const { t, href, locale } = usePage();
	return (
		<section class="entrance container">
			<p class="eyebrow">404 / {t('siteName')}</p>
			<h1>{t('notFoundTitle')}</h1>
			<p>{t('notFoundDescription')}</p>
			<a class="primary-link" href={href(localePath(locale))}>
				{t('back')}
				<Icon name="arrow" />
			</a>
		</section>
	);
}
