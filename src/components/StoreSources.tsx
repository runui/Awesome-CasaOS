import { createSignal, createUniqueId, For, Show } from 'solid-js';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Store } from '../data/stores';
import { createClipboard } from '../lib/clipboard';
import { usePage } from '../lib/page';
import { Icon } from './Icon';

export function StoreSources(props: { sources: Store['sources'] }) {
	const { t } = usePage();
	const { status, interactive, copy } = createClipboard();
	const [source, setSource] = createSignal(props.sources[0]);
	const id = `store-source-${createUniqueId()}`;
	const buttonText = () => (status() === 'copied' ? t('copied') : status() === 'copying' ? t('copying') : t('copy'));

	function copySource(next: Store['sources'][number]) {
		if (!interactive() || status() === 'copying') return;
		// Keep the copied variant outside the popup so its confirmation survives the menu closing.
		setSource(next);
		void copy(next.url);
	}

	return (
		<div class="store-card-sources" data-copy-status={status()}>
			<DropdownMenu class="source-actions">
				<Show
					when={props.sources.length > 1}
					fallback={
						<Button
							variant="link"
							class="source-actions-copy"
							onClick={() => copySource(source())}
							disabled={!interactive() || status() === 'copying'}
							aria-label={`${buttonText()}: ${source().label}`}
							aria-describedby={`${id}-status`}
							title={`${source().label}\n${source().url}`}>
							<Icon name={status() === 'copied' ? 'check' : 'copy'} />
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
						<Icon name={status() === 'copied' ? 'check' : 'copy'} />
						<span>{buttonText()}</span>
						<Icon name="chevron" class="source-actions-chevron" />
					</DropdownMenuTrigger>
					<DropdownMenuContent class="source-menu" align="end" sideOffset={8} preventOutsideActivation>
						<DropdownMenuLabel class="source-menu-label">{t('chooseSourceHeading')}</DropdownMenuLabel>
						<For each={props.sources}>
							{(item) => (
								<DropdownMenuItem
									class="source-menu-item"
									disabled={status() === 'copying'}
									textValue={item.label}
									aria-label={`${t('copy')}: ${item.label}`}
									title={item.url}
									onSelect={() => copySource(item)}>
									<Icon name={status() === 'copied' && source().url === item.url ? 'check' : 'copy'} />
									<span class="source-menu-source">
										<span class="source-menu-source-label">{item.label}</span>
										<span class="source-menu-url">{item.url}</span>
									</span>
								</DropdownMenuItem>
							)}
						</For>
					</DropdownMenuContent>
				</Show>
			</DropdownMenu>
			<p class={status() === 'failed' ? 'copy-status' : 'sr-only'} id={`${id}-status`} role="status" aria-live="polite" aria-atomic="true">
				{status() === 'failed' ? t('copyFailed') : status() === 'copied' ? `${t('copied')} ${source().label}` : ''}
			</p>
		</div>
	);
}
