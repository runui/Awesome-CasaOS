export type IconName =
	| 'arrow'
	| 'external'
	| 'search'
	| 'globe'
	| 'github'
	| 'copy'
	| 'check'
	| 'grid'
	| 'list'
	| 'chevron'
	| 'back'
	| 'spark'
	| 'plus'
	| 'home'
	| 'snow'
	| 'play'
	| 'layers';
const paths: Record<IconName, string> = {
	arrow: 'M5 12h14m-6-6 6 6-6 6',
	external: 'M14 3h7v7m0-7L10 14M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5',
	search: 'm21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
	globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18',
	github: 'M9 19c-4 1-4-2-6-2m12 5v-4a3.5 3.5 0 0 0-1-2.7c3.3-.4 6.8-1.6 6.8-7A5.4 5.4 0 0 0 19.4 4a5 5 0 0 0-.1-3.5S18.2.1 15 1.8a13.4 13.4 0 0 0-7 0C4.8.1 3.7.5 3.7.5A5 5 0 0 0 3.6 4a5.4 5.4 0 0 0-1.4 3.7c0 5.4 3.5 6.6 6.8 7A3.5 3.5 0 0 0 8 17v5',
	copy: 'M9 9h12v12H9zM5 15H3V3h12v2',
	check: 'm5 12 4 4L19 6',
	grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
	list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
	chevron: 'm6 9 6 6 6-6',
	back: 'M19 12H5m6-6-6 6 6 6',
	spark: 'm12 3 2.8 6.2L21 12l-6.2 2.8L12 21l-2.8-6.2L3 12l6.2-2.8L12 3Z',
	plus: 'M12 5v14M5 12h14',
	home: 'm3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9',
	snow: 'M12 2v20M3.34 7l17.32 10M3.34 17 20.66 7M9 4l3 3 3-3M9 20l3-3 3 3M3.5 10.5l4-1-1-4M17.5 18.5l-1-4 4-1M6.5 18.5l1-4-4-1M20.5 10.5l-4-1 1-4',
	play: 'm8 4 12 8-12 8V4Z',
	layers: 'm12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5',
};
export function Icon(props: { name: IconName; class?: string }) {
	return (
		<svg
			class={`icon ${props.class ?? ''}`}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.65"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true">
			<path d={paths[props.name]} />
		</svg>
	);
}
