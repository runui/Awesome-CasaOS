import { saveLocale, type Locale } from '../lib/i18n';
import { localePath } from '../lib/paths';
import { translatedPath } from '../lib/routes';
import { usePage, repository } from '../lib/page';
import { Icon } from './Icon';

export function Header() {
	const { route, locale, href, t } = usePage();
	const other: Locale = locale === 'en' ? 'zh' : 'en';
	return (
		<header class="site-header">
			<div class="container header-inner">
				<a class="brand" href={href(localePath(locale))}>
					<img src={href('/logo.png')} width="34" height="34" alt="" />
					<span>
						Awesome <span class="brand-light">CasaOS</span>
					</span>
				</a>
				<nav aria-label={t('navigation')} class="main-nav">
					<a
						classList={{
							active: route.kind === 'catalog' || route.kind === 'store',
						}}
						href={href(localePath(locale))}>
						{t('directory')}
					</a>
					<a classList={{ active: route.kind === 'guide' }} href={href(localePath(locale, 'guides/create-app-store/'))}>
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
					<a class="github-link" href={repository} aria-label="GitHub">
						<Icon name="github" />
					</a>
					<a class="casaos-link" href="https://casaos.io/">
						{t('casaos')}
						<Icon name="external" />
					</a>
				</div>
			</div>
		</header>
	);
}

export function Footer() {
	const { locale, href, t } = usePage();
	return (
		<footer class="site-footer">
			<div class="container">
				<div class="footer-top">
					<div>
						<a class="brand" href={href(localePath(locale))}>
							<img src={href('/logo.png')} width="30" height="30" alt="" />
							<span>
								Awesome <span class="brand-light">CasaOS</span>
							</span>
						</a>
						<p>{t('footerDescription')}</p>
					</div>
					<div class="footer-links">
						<a href="https://casaos.io/">
							CasaOS
							<Icon name="external" />
						</a>
						<a href={href(localePath(locale, 'guides/create-app-store/'))}>{t('guide')}</a>
						<a href={repository}>
							GitHub
							<Icon name="external" />
						</a>
					</div>
				</div>
				<div class="footer-bottom">
					<span>{t('footerNote')}</span>
					<span>© {new Date().getUTCFullYear()} CasaOS Community · MIT</span>
				</div>
			</div>
		</footer>
	);
}
