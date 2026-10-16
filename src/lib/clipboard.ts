import { createSignal, onCleanup, onMount } from 'solid-js';

async function writeClipboardText(value: string) {
	try {
		if (navigator.clipboard?.writeText) {
			await navigator.clipboard.writeText(value);
			return;
		}
	} catch {
		/* Older browsers and non-secure static hosts may still support a direct copy command. */
	}

	// The compatibility control stays off screen, is removed immediately, and never becomes an editing UI.
	const focused = document.activeElement;
	const selection = window.getSelection();
	const ranges = Array.from({ length: selection?.rangeCount ?? 0 }, (_, index) => selection!.getRangeAt(index).cloneRange());
	const control = document.createElement('textarea');
	control.value = value;
	control.readOnly = true;
	control.tabIndex = -1;
	control.setAttribute('aria-hidden', 'true');
	control.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none';
	document.body.append(control);
	try {
		control.focus({ preventScroll: true });
		control.select();
		if (!document.execCommand('copy')) throw new Error('Clipboard write failed');
	} finally {
		control.remove();
		if (focused instanceof HTMLElement && focused.isConnected) focused.focus({ preventScroll: true });
		selection?.removeAllRanges();
		for (const range of ranges) selection?.addRange(range);
	}
}

export function createClipboard() {
	const [status, setStatus] = createSignal<'idle' | 'copying' | 'copied' | 'failed'>('idle');
	const [interactive, setInteractive] = createSignal(false);
	let timer: ReturnType<typeof setTimeout> | undefined;
	let request = 0;

	onMount(() => setInteractive(true));
	onCleanup(() => {
		// Filtering or navigating can dispose the control before the clipboard promise settles.
		request++;
		clearTimeout(timer);
	});

	async function copy(value: string) {
		if (!interactive() || status() === 'copying') return;
		clearTimeout(timer);
		const current = ++request;
		setStatus('copying');
		let result: 'copied' | 'failed';
		try {
			await writeClipboardText(value);
			result = 'copied';
		} catch {
			result = 'failed';
		}
		if (current !== request) return;
		setStatus(result);
		// Keep failures visible until retry; success returns to the copy action after confirmation.
		if (result === 'copied') timer = setTimeout(() => setStatus('idle'), 5000);
	}

	return { status, interactive, copy };
}
