import { createUniqueId } from 'solid-js';
import { Button } from '@/components/ui/button';
import type { Store } from '../data/stores';
import { createClipboard } from '../lib/clipboard';
import { usePage } from '../lib/page';
import { Icon } from './Icon';

export function SourceCopy(props: { source: Store['sources'][number] }) {
	const { t } = usePage();
	const { status, interactive, copy } = createClipboard();
	const id = `source-${createUniqueId()}`;
	const buttonText = () => (status() === 'copied' ? t('copied') : status() === 'copying' ? t('copying') : t('copy'));
	return (
		<div class="source-copy source-box">
			<div class="source-label">
				<span>{props.source.label}</span>
				<Button
					variant="outline"
					size="sm"
					onClick={() => void copy(props.source.url)}
					disabled={!interactive() || status() === 'copying'}
					aria-label={`${buttonText()}: ${props.source.label}`}
					aria-describedby={`${id}-status`}
					title={props.source.url}>
					<Icon name={status() === 'copied' ? 'check' : 'copy'} />
					{buttonText()}
				</Button>
			</div>
			<label class="sr-only" for={id}>
				{t('sourceUrl')}: {props.source.label}
			</label>
			<input class="source-url" id={id} value={props.source.url} readonly onFocus={(event) => event.currentTarget.select()} />
			<p class="copy-status" id={`${id}-status`} role="status" aria-live="polite" aria-atomic="true">
				{status() === 'failed' ? t('copyFailed') : status() === 'copied' ? `${t('copied')} ${props.source.label}` : ''}
			</p>
		</div>
	);
}
