import { saveLocale, type Locale } from '../lib/i18n';
import { localePath } from '../lib/paths';
import { translatedPath } from '../lib/routes';
import { usePage, repository, createStoreGuideUrl } from '../lib/page';
import { Brand } from './Brand';
import { Icon } from './Icon';

export function Header() {
	const { route, locale, href, t } = usePage();
	const other: Locale = locale === 'en' ? 'zh' : 'en';
	return (
		<header class="site-header">
			<div class="container header-inner">
				<Brand />
				<nav aria-label={t('navigation')} class="main-nav">
					<a
						classList={{
							active: route.kind === 'catalog' || route.kind === 'store',
						}}
						href={href(localePath(locale))}>
						{t('directory')}
					</a>
					<a href={createStoreGuideUrl} target="_blank" rel="noopener noreferrer">
						{t('guide')}
					</a>
				</nav>
				<div class="header-actions">
					<a
						class="language-link"
						href={href(translatedPath(route, other))}
						lang={other === 'zh' ? 'zh-CN' : 'en'}
						hreflang={other === 'zh' ? 'zh-CN' : 'en'}
						aria-label={t('switchLanguage')}
						onClick={(event) => {
							saveLocale(other);
							if (route.kind === 'catalog') event.currentTarget.search = window.location.search;
						}}>
						<Icon name="globe" />
						<span>{locale === 'en' ? '中文' : 'EN'}</span>
					</a>
					<span class="header-divider" />
					<a class="github-link" href={repository} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
						<Icon name="github" />
					</a>
					<a class="platform-link" href="https://www.zimaspace.com/zimaos" target="_blank" rel="noopener noreferrer" title={t('recommendedPlatform')}>
						{t('zimaos')}
						<Icon name="external" />
					</a>
				</div>
			</div>
		</header>
	);
}

export function Footer() {
	const { t } = usePage();
	return (
		<footer class="site-footer">
			<div class="container">
				<div class="footer-top">
					<div>
						<Brand />
						<p>{t('footerDescription')}</p>
					</div>
					<div class="footer-links">
						<a href="https://www.zimaspace.com/zimaos" target="_blank" rel="noopener noreferrer" title={t('recommendedPlatform')}>
							{t('zimaos')}
							<Icon name="external" />
						</a>
						<a href="https://casaos.io/" target="_blank" rel="noopener noreferrer">
							{t('casaos')}
							<Icon name="external" />
						</a>
						<a href={repository} target="_blank" rel="noopener noreferrer">
							GitHub
							<Icon name="external" />
						</a>
					</div>
				</div>
				<div class="footer-bottom">
					<span>{t('footerNote')}</span>
					<span>
						© {new Date().getUTCFullYear()} {t('communityName')} · MIT
					</span>
				</div>
			</div>
		</footer>
	);
}
