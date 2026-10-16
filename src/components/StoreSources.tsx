import { createSignal, createUniqueId, For, Show } from 'solid-js';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Store } from '../data/stores';
import { platforms, sourceLabel } from '../data/platforms';
import { createClipboard } from '../lib/clipboard';
import { usePage } from '../lib/page';
import { Icon } from './Icon';

export function StoreSources(props: { sources: Store['sources'] }) {
	const { t } = usePage();
	const { status, interactive, copy } = createClipboard();
	const [source, setSource] = createSignal<Store['sources'][number]>();
	const id = `store-source-${createUniqueId()}`;
	const orderedSources = () => platforms.flatMap((platform) => props.sources.filter((item) => item.platform === platform));
	// A platform filter can replace the source list while a clipboard write is still pending.
	// Keep that write locked, but never apply its confirmation to a different platform's source.
	const sameSource = (item: Store['sources'][number]) => source()?.id === item.id && source()?.platform === item.platform && source()?.url === item.url;
	const currentStatus = () => (status() === 'copying' || props.sources.some(sameSource) ? status() : 'idle');
	const buttonText = () => (currentStatus() === 'copied' ? t('copied') : currentStatus() === 'copying' ? t('copying') : t('copy'));

	function copySource(next: Store['sources'][number]) {
		if (!interactive() || status() === 'copying') return;
		// Keep the copied variant outside the popup so its confirmation survives the menu closing.
		setSource(next);
		void copy(next.url);
	}

	return (
		<div class="store-card-sources" data-copy-status={currentStatus()}>
			<DropdownMenu class="source-actions">
				<Show
					when={props.sources.length > 1}
					fallback={
						<Button
							variant="link"
							class="source-actions-copy"
							onClick={() => copySource(props.sources[0])}
							disabled={!interactive() || status() === 'copying'}
							aria-label={`${buttonText()}: ${sourceLabel(props.sources[0])}`}
							aria-describedby={`${id}-status`}
							title={`${sourceLabel(props.sources[0])}\n${props.sources[0].url}`}>
							<Icon name={currentStatus() === 'copied' ? 'check' : 'copy'} />
							<span>{buttonText()}</span>
						</Button>
					}>
					<DropdownMenuTrigger
						class="source-actions-copy source-actions-trigger"
						disabled={!interactive()}
						aria-busy={status() === 'copying'}
						aria-label={t('chooseSource', { count: props.sources.length })}
						aria-describedby={`${id}-status`}
						title={t('chooseSource', { count: props.sources.length })}>
						<Icon name={currentStatus() === 'copied' ? 'check' : 'copy'} />
						<span>{buttonText()}</span>
						<Icon name="chevron" class="source-actions-chevron" />
					</DropdownMenuTrigger>
					<DropdownMenuContent class="source-menu" align="end" sideOffset={8} preventOutsideActivation>
						<DropdownMenuLabel class="source-menu-label">{t('chooseSourceHeading')}</DropdownMenuLabel>
						<For each={orderedSources()}>
							{(item) => (
								<DropdownMenuItem
									class="source-menu-item"
									disabled={status() === 'copying'}
									textValue={sourceLabel(item)}
									aria-label={`${t('copy')}: ${sourceLabel(item)}`}
									title={item.url}
									onSelect={() => copySource(item)}>
									<Icon name={currentStatus() === 'copied' && sameSource(item) ? 'check' : 'copy'} />
									<span class="source-menu-source">
										<span class="source-menu-source-label">{sourceLabel(item)}</span>
										<span class="source-menu-url">{item.url}</span>
									</span>
								</DropdownMenuItem>
							)}
						</For>
					</DropdownMenuContent>
				</Show>
			</DropdownMenu>
			<p class={currentStatus() === 'failed' ? 'copy-status' : 'sr-only'} id={`${id}-status`} role="status" aria-live="polite" aria-atomic="true">
				{currentStatus() === 'failed' ? t('copyFailed') : currentStatus() === 'copied' && source() ? `${t('copied')} ${sourceLabel(source()!)}` : ''}
			</p>
		</div>
	);
}
