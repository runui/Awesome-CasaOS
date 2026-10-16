import { type Accessor, type Context, createContext, createRenderEffect, createSignal, type JSX, onCleanup, onMount, useContext } from 'solid-js';

type ClassValue = string | number | boolean | null | undefined | ClassValue[] | Record<string, boolean | null | undefined>;

/**
 * 合并 CSS 类名
 * 支持条件类名和数组类名
 */
export function cn(...inputs: ClassValue[]): string {
	return inputs
		.flatMap((input) => {
			if (input === null || input === undefined || input === false) {
				return [];
			}
			if (typeof input === 'string' || typeof input === 'number') {
				return [String(input)];
			}
			if (Array.isArray(input)) {
				return input;
			}
			if (typeof input === 'object') {
				return Object.entries(input)
					.filter(([, value]) => value)
					.map(([key]) => key);
			}
			return [];
		})
		.filter(Boolean)
		.join(' ');
}

/**
 * 生成唯一的 ID
 */
export function generateId(prefix: string = 'tile'): string {
	return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 深度合并对象
 */
export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
	const result = { ...target };

	for (const key in source) {
		if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
			result[key] = deepMerge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>) as T[Extract<keyof T, string>];
		} else {
			result[key] = source[key] as T[Extract<keyof T, string>];
		}
	}

	return result;
}

/**
 * 格式化字节大小
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * 延迟执行
 */
export function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 检查是否是对象
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 从对象中提取指定键
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
	const result = {} as Pick<T, K>;

	for (const key of keys) {
		if (key in obj) {
			result[key] = obj[key];
		}
	}

	return result;
}

/**
 * 从对象中排除指定键
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
	const result = { ...obj };

	for (const key of keys) {
		delete result[key];
	}

	return result;
}

/**
 * 首字母大写
 */
export function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export interface AnchoredPositionMeasure {
	anchorRect: DOMRect;
	contentRect: DOMRect;
	containerRect: DOMRect;
	direction: 'ltr' | 'rtl';
}

export interface AnchoredPositionOptions {
	anchor: () => HTMLElement | null | undefined;
	content: () => HTMLElement | null | undefined;
	container?: () => Element | null | undefined;
	open?: () => boolean;
	onPosition: (measure: AnchoredPositionMeasure) => void;
}

export interface AnchoredPositionController {
	recompute: () => void;
	destroy: () => void;
}

function viewportRect(document: Document): DOMRect {
	const view = document.defaultView;
	const Rect = view?.DOMRect ?? DOMRect;
	return new Rect(0, 0, view?.innerWidth ?? 0, view?.innerHeight ?? 0);
}

function hasHiddenAncestor(element: HTMLElement): boolean {
	for (let current: HTMLElement | null = element; current; current = current.parentElement) {
		const style = current.ownerDocument.defaultView?.getComputedStyle(current);
		if (!style) return true;
		if (current.hidden || style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return true;
	}
	return false;
}

function measureContent(content: HTMLElement): DOMRect {
	if (!hasHiddenAncestor(content)) return content.getBoundingClientRect();
	const clone = content.cloneNode(true) as HTMLElement;
	for (const element of [clone, ...clone.querySelectorAll<HTMLElement>('*')]) {
		for (const attribute of [
			'id',
			'name',
			'for',
			'form',
			'list',
			'headers',
			'aria-labelledby',
			'aria-describedby',
			'aria-controls',
			'aria-activedescendant',
			'aria-details',
			'aria-errormessage',
			'aria-owns',
			'aria-flowto',
			'itemref',
			'usemap',
			'popovertarget',
			'commandfor',
			'anchor',
		])
			element.removeAttribute(attribute);
	}
	Object.assign(clone.style, {
		display: 'block',
		position: 'fixed',
		left: '-100000px',
		top: '0',
		visibility: 'hidden',
		pointerEvents: 'none',
	});
	const host = content.ownerDocument.body;
	try {
		host.appendChild(clone);
		return clone.getBoundingClientRect();
	} finally {
		clone.remove();
	}
}

/** 绑定可迁移的锚点定位生命周期；每次 recompute 都核对节点身份与 ownerDocument。 */
export function createAnchoredPosition(options: AnchoredPositionOptions): AnchoredPositionController {
	if (typeof document === 'undefined') return { recompute: () => undefined, destroy: () => undefined };
	let ownerDocument: Document | undefined;
	let view: Window | null | undefined;
	let frame = 0;
	let destroyed = false;
	let observer: ResizeObserver | undefined;
	let observed: Element[] = [];
	const disconnectObserver = () => {
		try {
			observer?.disconnect();
		} catch {}
		observer = undefined;
	};

	const cancelFrame = () => {
		if (frame && view?.cancelAnimationFrame) view.cancelAnimationFrame(frame);
		frame = 0;
	};
	const detach = () => {
		cancelFrame();
		disconnectObserver();
		observed = [];
		view?.removeEventListener('resize', recompute);
		ownerDocument?.removeEventListener('scroll', recompute, true);
		view = undefined;
		ownerDocument = undefined;
	};
	const reconcile = () => {
		const anchor = options.anchor();
		const content = options.content();
		const container = options.container?.();
		const nextDocument = anchor?.ownerDocument;
		const compatible = !!anchor && !!content && content.ownerDocument === nextDocument && (!container || container.ownerDocument === nextDocument);
		if (!compatible) {
			if (ownerDocument || observed.length > 0) detach();
			return;
		}
		const nextObserved = [anchor, content, container].filter((node): node is Element => !!node);
		const identityChanged = nextDocument !== ownerDocument || nextObserved.length !== observed.length || nextObserved.some((node, index) => node !== observed[index]);
		if (!identityChanged) return;
		detach();
		if (!nextDocument) return;
		ownerDocument = nextDocument;
		view = nextDocument.defaultView;
		const ResizeObserverConstructor = view ? (view as Window & typeof globalThis).ResizeObserver : undefined;
		try {
			observer = ResizeObserverConstructor ? new ResizeObserverConstructor(recompute) : undefined;
		} catch {
			observer = undefined;
		}
		observed = nextObserved;
		if (observer) {
			try {
				for (const node of observed) observer.observe(node);
			} catch {
				disconnectObserver();
			}
		}
		view?.addEventListener('resize', recompute);
		nextDocument.addEventListener('scroll', recompute, true);
	};
	const measure = () => {
		frame = 0;
		if (destroyed) return;
		reconcile();
		if (options.open?.() === false) return;
		const anchor = options.anchor();
		const content = options.content();
		if (!anchor?.isConnected || !content?.isConnected || anchor.ownerDocument !== content.ownerDocument) return;
		const container = options.container?.();
		if (container && container.ownerDocument !== anchor.ownerDocument) return;
		options.onPosition({
			anchorRect: anchor.getBoundingClientRect(),
			contentRect: measureContent(content),
			containerRect: container?.getBoundingClientRect() ?? viewportRect(anchor.ownerDocument),
			direction: anchor.ownerDocument.defaultView?.getComputedStyle(anchor).direction === 'rtl' ? 'rtl' : 'ltr',
		});
	};
	function recompute() {
		if (destroyed) return;
		reconcile();
		cancelFrame();
		if (view?.requestAnimationFrame) frame = view.requestAnimationFrame(measure);
		else measure();
	}
	queueMicrotask(recompute);
	return {
		recompute,
		destroy() {
			if (destroyed) return;
			destroyed = true;
			detach();
		},
	};
}

const FOCUSABLE_SELECTOR = ['a[href]', 'area[href]', 'button', 'input', 'select', 'textarea', 'iframe', '[contenteditable="true"]', '[tabindex]'].join(',');

function isDisabledByFieldset(element: HTMLElement): boolean {
	const fieldset = element.closest('fieldset[disabled]');
	if (!fieldset) return false;
	const firstLegend = fieldset.querySelector(':scope > legend');
	return !firstLegend?.contains(element);
}

/** 使用节点自身 realm 判断 HTMLElement，避免跨 iframe instanceof 失败。 */
export function isHTMLElementNode(value: unknown): value is HTMLElement {
	if (!value || typeof value !== 'object') return false;
	const node = value as { nodeType?: number; ownerDocument?: Document | null };
	const HTMLElementConstructor = node.ownerDocument?.defaultView?.HTMLElement;
	return node.nodeType === 1 && !!HTMLElementConstructor && value instanceof HTMLElementConstructor;
}

/** 使用节点自身 realm 判断 Node。 */
export function isNodeValue(value: unknown): value is Node {
	if (!value || typeof value !== 'object') return false;
	const node = value as { nodeType?: number; ownerDocument?: Document | null };
	const NodeConstructor = node.ownerDocument?.defaultView?.Node;
	return typeof node.nodeType === 'number' && (!NodeConstructor || value instanceof NodeConstructor);
}

/** 判断元素及其祖先是否可见且未被 inert/aria-hidden 排除。 */
export function isElementEffectivelyVisible(element: HTMLElement, boundary?: HTMLElement): boolean {
	if (!element.isConnected) return false;
	for (let current: HTMLElement | null = element; current; current = current.parentElement) {
		if (current.hidden || current.hasAttribute('inert') || current.getAttribute('aria-hidden') === 'true') return false;
		const style = current.ownerDocument.defaultView?.getComputedStyle(current);
		if (!style) return false;
		if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false;
		if (current === boundary) return true;
	}
	return boundary === undefined;
}

/** 判断元素是否是可实际聚焦的交互目标。 */
export function isEffectivelyFocusable(element: HTMLElement, boundary?: HTMLElement): boolean {
	if (!element.matches(FOCUSABLE_SELECTOR) || !isElementEffectivelyVisible(element, boundary)) return false;
	if (element.matches(':disabled') || element.getAttribute('aria-disabled') === 'true' || isDisabledByFieldset(element)) return false;
	if (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'hidden') return false;
	return element.tabIndex >= 0 || element.isContentEditable;
}

/** 按 DOM 顺序返回容器内可实际聚焦的元素。 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => isEffectivelyFocusable(element, container));
}

/** 获取事件的 composedPath，并为不支持 composedPath 的环境提供回退。 */
export function getEventPath(event: Event): EventTarget[] {
	if (typeof event.composedPath === 'function') return event.composedPath();
	const path: EventTarget[] = [];
	let current = isNodeValue(event.target) ? event.target : null;
	while (current) {
		path.push(current);
		current = current.parentNode;
	}
	return path;
}

/** 判断事件路径是否命中节点本身或其后代。 */
export function eventPathContains(path: readonly EventTarget[], node: Node | null | undefined): boolean {
	if (!node) return false;
	return path.some((entry) => entry === node || (isNodeValue(entry) && node.contains(entry)));
}

export type CollectionMoveIntent = 'first' | 'last' | 'next' | 'previous';

export interface CollectionItem<T extends HTMLElement> {
	element: T;
	disabled?: () => boolean;
	hidden?: () => boolean;
	textValue?: () => string;
}

export interface CollectionRegistryOptions {
	loop?: boolean;
	typeaheadTimeout?: number;
	setTimeout?: typeof globalThis.setTimeout;
	clearTimeout?: typeof globalThis.clearTimeout;
}

export interface CollectionRegistry<T extends HTMLElement> {
	register: (item: CollectionItem<T>) => () => void;
	items: () => CollectionItem<T>[];
	enabledItems: () => CollectionItem<T>[];
	move: (current: T | null, intent: CollectionMoveIntent) => CollectionItem<T> | undefined;
	typeahead: (key: string, current?: T | null) => CollectionItem<T> | undefined;
	resetTypeahead: () => void;
	destroy: () => void;
}

function compareDomOrder<T extends HTMLElement>(left: CollectionItem<T>, right: CollectionItem<T>): number {
	if (left.element === right.element) return 0;
	return left.element.compareDocumentPosition(right.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}

/** 创建按实时 DOM 顺序读取的集合注册表，含 roving 移动与可选 typeahead。 */
export function createCollectionRegistry<T extends HTMLElement>(options: CollectionRegistryOptions = {}): CollectionRegistry<T> {
	const entries = new Set<CollectionItem<T>>();
	const schedule = options.setTimeout ?? globalThis.setTimeout;
	const cancel = options.clearTimeout ?? globalThis.clearTimeout;
	let search = '';
	let timer: ReturnType<typeof setTimeout> | undefined;
	const items = () => [...entries].filter((item) => item.element.isConnected).sort(compareDomOrder);
	const enabledItems = () => items().filter((item) => !item.disabled?.() && !item.hidden?.() && isElementEffectivelyVisible(item.element));
	const resetTypeahead = () => {
		search = '';
		if (timer !== undefined) cancel(timer);
		timer = undefined;
	};
	return {
		register(item) {
			entries.add(item);
			return () => entries.delete(item);
		},
		items,
		enabledItems,
		move(current, intent) {
			const enabled = enabledItems();
			if (enabled.length === 0) return undefined;
			if (intent === 'first') return enabled[0];
			if (intent === 'last') return enabled.at(-1);
			const currentIndex = enabled.findIndex((item) => item.element === current);
			const step = intent === 'next' ? 1 : -1;
			const nextIndex = currentIndex === -1 ? (step === 1 ? 0 : enabled.length - 1) : currentIndex + step;
			if (options.loop === false) return enabled[nextIndex];
			return enabled[(nextIndex + enabled.length) % enabled.length];
		},
		typeahead(key, current = null) {
			if (key.length !== 1 || key.trim() === '') return undefined;
			if (timer !== undefined) cancel(timer);
			search += key.toLocaleLowerCase();
			const repeated = [...search].every((character) => character === search[0]);
			const query = repeated ? search[0] : search;
			const enabled = enabledItems();
			const currentIndex = enabled.findIndex((item) => item.element === current);
			const ordered = [...enabled.slice(currentIndex + 1), ...enabled.slice(0, currentIndex + 1)];
			const match = ordered.find((item) => (item.textValue?.() ?? item.element.textContent ?? '').trim().toLocaleLowerCase().startsWith(query));
			timer = schedule(resetTypeahead, options.typeaheadTimeout ?? 700);
			return match;
		},
		resetTypeahead,
		destroy() {
			resetTypeahead();
			entries.clear();
		},
	};
}

export type ControllableUpdater<T> = T | ((previous: T) => T);

export interface ControllableSignalOptions<T> {
	value?: Accessor<T | undefined>;
	defaultValue: Accessor<T>;
	onChange?: (value: T) => void;
}

/**
 * 创建支持受控与非受控模式的信号。defaultValue 仅在创建时读取。
 */
export function createControllableSignal<T>(options: ControllableSignalOptions<T>): [Accessor<T>, (next: ControllableUpdater<T>) => T, () => T] {
	const initialValue = options.defaultValue();
	const [uncontrolledValue, setUncontrolledValue] = createSignal(initialValue);
	const controlledValue = () => options.value?.();
	const value = () => {
		const controlled = controlledValue();
		return controlled !== undefined ? controlled : uncontrolledValue();
	};

	createRenderEffect(() => {
		const controlled = controlledValue();
		if (controlled !== undefined) {
			setUncontrolledValue(() => controlled);
		}
	});

	const setValue = (next: ControllableUpdater<T>) => {
		const previous = value();
		const resolved = typeof next === 'function' ? (next as (previous: T) => T)(previous) : next;

		if (controlledValue() === undefined) {
			setUncontrolledValue(() => resolved);
		}
		if (!Object.is(previous, resolved)) {
			options.onChange?.(resolved);
		}
		return resolved;
	};

	const reset = () => {
		const controlled = controlledValue();
		if (controlled !== undefined) {
			return controlled;
		}
		setUncontrolledValue(() => initialValue);
		return initialValue;
	};

	return [value, setValue, reset];
}

/**
 * 读取必需上下文，并在缺少 Provider 时提供明确错误。
 */
export function useRequiredContext<T>(context: Context<T | undefined>, name: string): T {
	const value = useContext(context);
	if (value === undefined) {
		throw new Error(`${name} must be used within its provider.`);
	}
	return value;
}

export interface PortalScope {
	parent?: PortalScope;
	container: Accessor<Node | undefined>;
	addBranch: (node: Node) => () => void;
	getBranches: () => Node[];
}

interface InternalPortalScope extends PortalScope {
	branchCounts: Map<Node, number>;
	changeBranchCount: (node: Node, delta: number) => void;
}

export const PortalScopeContext: Context<PortalScope | undefined> = createContext<PortalScope>();

/** 创建继承 Portal 容器、向祖先传播后代分支所有权的作用域。 */
export function createPortalScope(container: Accessor<Node | undefined> = () => undefined, parent?: PortalScope): PortalScope {
	const branchCounts = new Map<Node, number>();
	const internalParent = parent as InternalPortalScope | undefined;
	const scope: InternalPortalScope = {
		parent,
		container,
		branchCounts,
		changeBranchCount(node, delta) {
			const next = (branchCounts.get(node) ?? 0) + delta;
			if (next > 0) branchCounts.set(node, next);
			else branchCounts.delete(node);
			internalParent?.changeBranchCount(node, delta);
		},
		addBranch(node) {
			scope.changeBranchCount(node, 1);
			let active = true;
			return () => {
				if (!active) return;
				active = false;
				scope.changeBranchCount(node, -1);
			};
		},
		getBranches() {
			return [...branchCounts.keys()];
		},
	};
	return scope;
}

/** 读取最近的 Portal 作用域；缺少 Provider 时返回 undefined。 */
export function usePortalScope(): PortalScope | undefined {
	return useContext(PortalScopeContext);
}

/** 优先使用显式容器，否则沿作用域向上继承第一个可用容器。 */
export function resolvePortalContainer(scope?: PortalScope, explicit?: Node): Node | undefined {
	if (explicit) return explicit;
	for (let current = scope; current; current = current.parent) {
		const container = current.container();
		if (container) return container;
	}
	return undefined;
}

export type DismissableLayerOutsideEvent = PointerEvent | FocusEvent;

export interface DismissableLayerEvent<E extends Event> {
	originalEvent: E;
	target: EventTarget | null;
	defaultPrevented: boolean;
	preventDefault: () => void;
}

export interface DismissableLayerOptions {
	element: () => HTMLElement | null | undefined;
	branches?: () => Iterable<Node>;
	portalScope?: PortalScope;
	modal?: boolean;
	preventOutsideActivation?: boolean;
	onEscapeKeyDown?: (event: DismissableLayerEvent<KeyboardEvent>) => void;
	onPointerDownOutside?: (event: DismissableLayerEvent<PointerEvent>) => void;
	onFocusOutside?: (event: DismissableLayerEvent<FocusEvent>) => void;
	onInteractOutside?: (event: DismissableLayerEvent<DismissableLayerOutsideEvent>) => void;
	onDismiss: () => void;
}

export interface DismissableLayerController {
	update: () => void;
	destroy: () => void;
}

interface LayerEntry {
	id: symbol;
	options: DismissableLayerOptions;
	document?: Document;
	suppressFocusOutside: boolean;
}

const layerStacks = new WeakMap<Document, LayerEntry[]>();
const layerCleanups = new WeakMap<Document, () => void>();
const suppressedFocusDocuments = new WeakSet<Document>();

function createLayerEvent<E extends Event>(originalEvent: E): DismissableLayerEvent<E> {
	let defaultPrevented = false;
	return {
		originalEvent,
		target: originalEvent.target,
		get defaultPrevented() {
			return defaultPrevented;
		},
		preventDefault() {
			defaultPrevented = true;
		},
	};
}

function isInside(entry: LayerEntry, event: Event): boolean {
	const path = getEventPath(event);
	const branches = [...(entry.options.branches?.() ?? []), ...(entry.options.portalScope?.getBranches() ?? [])];
	return eventPathContains(path, entry.options.element()) || branches.some((branch) => eventPathContains(path, branch));
}

function topLayer(document: Document): LayerEntry | undefined {
	return layerStacks.get(document)?.at(-1);
}

/** The click arrives after dismissal removes the menu, so its guard must outlive the layer. */
function consumeOutsidePointerGesture(document: Document, event: PointerEvent) {
	event.preventDefault();
	event.stopImmediatePropagation();
	const cleanup = () => {
		document.removeEventListener('click', consumeClick, true);
		document.removeEventListener('auxclick', consumeClick, true);
		document.removeEventListener('pointerdown', cleanup, true);
		document.removeEventListener('pointercancel', cleanup, true);
		document.removeEventListener('keydown', cleanup, true);
		document.defaultView?.removeEventListener('blur', cleanup);
	};
	const consumeClick = (click: MouseEvent) => {
		cleanup();
		if (click.detail === 0) return;
		click.preventDefault();
		click.stopImmediatePropagation();
	};
	document.addEventListener('click', consumeClick, true);
	document.addEventListener('auxclick', consumeClick, true);
	// A cancelled gesture must never swallow a later pointer or keyboard action.
	document.addEventListener('pointerdown', cleanup, true);
	document.addEventListener('pointercancel', cleanup, true);
	document.addEventListener('keydown', cleanup, true);
	document.defaultView?.addEventListener('blur', cleanup);
}

function installDocumentListeners(document: Document): () => void {
	const onKeyDown = (originalEvent: KeyboardEvent) => {
		if (originalEvent.key !== 'Escape') return;
		const layer = topLayer(document);
		if (!layer) return;
		const event = createLayerEvent(originalEvent);
		layer.options.onEscapeKeyDown?.(event);
		if (event.defaultPrevented) return;
		originalEvent.preventDefault();
		layer.options.onDismiss();
	};
	const onPointerDown = (originalEvent: PointerEvent) => {
		const layer = topLayer(document);
		if (!layer || isInside(layer, originalEvent)) return;
		const event = createLayerEvent(originalEvent);
		layer.suppressFocusOutside = true;
		suppressedFocusDocuments.add(document);
		queueMicrotask(() => {
			layer.suppressFocusOutside = false;
			suppressedFocusDocuments.delete(document);
		});
		layer.options.onPointerDownOutside?.(event);
		layer.options.onInteractOutside?.(event);
		if (event.defaultPrevented) return;
		if (layer.options.modal) originalEvent.preventDefault();
		if (layer.options.preventOutsideActivation) consumeOutsidePointerGesture(document, originalEvent);
		layer.options.onDismiss();
	};
	const onFocusIn = (originalEvent: FocusEvent) => {
		const layer = topLayer(document);
		if (!layer || layer.suppressFocusOutside || suppressedFocusDocuments.has(document) || isInside(layer, originalEvent)) return;
		const event = createLayerEvent(originalEvent);
		layer.options.onFocusOutside?.(event);
		layer.options.onInteractOutside?.(event);
		if (!event.defaultPrevented) layer.options.onDismiss();
	};
	document.addEventListener('keydown', onKeyDown);
	document.addEventListener('pointerdown', onPointerDown, true);
	document.addEventListener('focusin', onFocusIn);
	return () => {
		document.removeEventListener('keydown', onKeyDown);
		document.removeEventListener('pointerdown', onPointerDown, true);
		document.removeEventListener('focusin', onFocusIn);
	};
}

function removeDismissableLayerEntry(entry: LayerEntry) {
	const document = entry.document;
	if (!document) return;
	const stack = layerStacks.get(document);
	const index = stack?.findIndex((layer) => layer.id === entry.id) ?? -1;
	if (index !== -1) stack!.splice(index, 1);
	if (stack?.length === 0) {
		layerCleanups.get(document)?.();
		layerCleanups.delete(document);
		layerStacks.delete(document);
	}
	entry.document = undefined;
}

/** 创建惰性可关闭层控制器；调用 update 绑定晚到或替换后的节点。 */
export function registerDismissableLayer(options: DismissableLayerOptions): DismissableLayerController {
	const entry: LayerEntry = { id: Symbol('dismissable-layer'), options, suppressFocusOutside: false };
	let destroyed = false;
	const update = () => {
		if (destroyed || typeof document === 'undefined') return;
		const nextDocument = options.element()?.ownerDocument;
		if (nextDocument === entry.document) return;
		removeDismissableLayerEntry(entry);
		if (!nextDocument) return;
		const stack = layerStacks.get(nextDocument) ?? [];
		stack.push(entry);
		entry.document = nextDocument;
		layerStacks.set(nextDocument, stack);
		if (!layerCleanups.has(nextDocument)) layerCleanups.set(nextDocument, installDocumentListeners(nextDocument));
	};
	queueMicrotask(update);
	return {
		update,
		destroy() {
			if (destroyed) return;
			destroyed = true;
			removeDismissableLayerEntry(entry);
		},
	};
}

export type SolidEventHandler<T extends Element, E extends Event> = JSX.EventHandlerUnion<T, E>;

/** Solid ref 仅支持挂载时回调，不模拟 React object/null ref。 */
export type CallbackRef<T> = (element: T) => void;

/** 合并多个 Solid callback ref。 */
export function composeRefs<T>(...refs: Array<CallbackRef<T> | undefined>): CallbackRef<T> {
	return (element) => {
		for (const ref of refs) ref?.(element);
	};
}

/**
 * 调用 Solid 原生事件处理器，兼容函数与 [handler, data] 绑定形式。
 */
export function invokeEventHandler<E extends Event>(handler: unknown, event: E) {
	if (!handler) {
		return;
	}

	if (Array.isArray(handler)) {
		handler[0](handler[1], event);
		return;
	}

	(handler as (event: E) => void)(event);
}

/**
 * 依次调用事件处理器；前一个处理器阻止默认行为后，不再调用后续处理器。
 */
export function composeEventHandlers<E extends Event>(...handlers: unknown[]) {
	return (event: E) => {
		for (const handler of handlers) {
			if (event.defaultPrevented) {
				break;
			}
			invokeEventHandler(handler, event);
		}
	};
}

export interface SnapshotStore<T> {
	getSnapshot(): T;
	subscribe(listener: () => void): () => void;
}

/** 将 FormStore 的订阅快照桥接为 Solid accessor。 */
export function createFormStoreSnapshot<T>(store: SnapshotStore<T>): Accessor<T> {
	const [snapshot, setSnapshot] = createSignal(store.getSnapshot());

	onMount(() => {
		const unsubscribe = store.subscribe(() => setSnapshot(() => store.getSnapshot()));
		setSnapshot(() => store.getSnapshot());
		onCleanup(unsubscribe);
	});

	return snapshot;
}

export interface ExternalStore<T> {
	getSnapshot(): T;
	subscribe(listener: () => void): () => void;
}

type ExternalStoreEqualityOptions<T> =
	| {
			/** 默认使用 Object.is；返回 true 时保留当前快照且不触发依赖。 */
			equals?: (previous: T, next: T) => boolean;
			getVersion?: never;
	  }
	| {
			/** 为可变快照捕获版本；版本使用 Object.is 比较，变化时即使快照引用相同也会触发依赖。 */
			getVersion: (snapshot: T) => unknown;
			equals?: never;
	  };

export type ExternalStoreAccessorOptions<T> = ExternalStoreEqualityOptions<T> & {
	/** SSR 的确定性快照；服务端不会创建或订阅外部 store。 */
	serverSnapshot: T;
};

interface ExternalStoreState<T> {
	snapshot: T;
	version?: unknown;
}

/**
 * 将仅在浏览器挂载时创建的外部 store 桥接为当前 Solid owner 的 accessor。
 * 每个 owner 独立订阅并清理；订阅后会立即重读，以关闭读取与订阅之间的竞态。
 */
export function createExternalStoreAccessor<T>(createStore: () => ExternalStore<T>, options: ExternalStoreAccessorOptions<T>): Accessor<T> {
	const getVersion = options.getVersion;
	const equals = options.equals ?? Object.is;
	let current: ExternalStoreState<T> = {
		snapshot: options.serverSnapshot,
		version: getVersion?.(options.serverSnapshot),
	};
	let store: ExternalStore<T> | undefined;
	let hasClientSnapshot = false;

	const proxy: SnapshotStore<ExternalStoreState<T>> = {
		getSnapshot: () => {
			if (!store) return current;
			const snapshot = store.getSnapshot();
			const version = getVersion?.(snapshot);
			if (!hasClientSnapshot) {
				hasClientSnapshot = true;
				current = { snapshot, version };
				return current;
			}
			const unchanged = getVersion ? Object.is(current.version, version) : equals(current.snapshot, snapshot);
			if (!unchanged) current = { snapshot, version };
			return current;
		},
		subscribe: (listener) => {
			store = createStore();
			return store.subscribe(listener);
		},
	};

	const state = createFormStoreSnapshot(proxy);
	return () => state().snapshot;
}

export interface ModalFocusScopeOptions {
	container: () => HTMLElement | null | undefined;
	branches?: () => Iterable<HTMLElement>;
	portalScope?: PortalScope;
	initialFocus?: () => HTMLElement | null | undefined;
	restoreFocus?: boolean | (() => HTMLElement | null | undefined);
	trapFocus?: boolean;
	lockScroll?: boolean;
}

export interface ModalFocusScopeController {
	update: () => void;
	destroy: () => void;
}

interface FocusScopeEntry {
	id: symbol;
	options: ModalFocusScopeOptions;
	document?: Document;
	restoreTarget: HTMLElement | null;
	locked: boolean;
}

interface ScrollLockState {
	count: number;
	overflow: string;
}

const focusStacks = new WeakMap<Document, FocusScopeEntry[]>();
const scrollLocks = new WeakMap<Document, ScrollLockState>();

function lockScroll(document: Document) {
	const state = scrollLocks.get(document) ?? { count: 0, overflow: document.body.style.overflow };
	if (state.count === 0) {
		state.overflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
	}
	state.count += 1;
	scrollLocks.set(document, state);
}

function unlockScroll(document: Document) {
	const state = scrollLocks.get(document);
	if (!state) return;
	state.count -= 1;
	if (state.count === 0) {
		document.body.style.overflow = state.overflow;
		scrollLocks.delete(document);
	}
}

function getFocusScopeRoots(entry: FocusScopeEntry): HTMLElement[] {
	const container = entry.options.container();
	const document = container?.ownerDocument ?? entry.document;
	const branches = [...(entry.options.branches?.() ?? []), ...(entry.options.portalScope?.getBranches() ?? [])].filter(
		(node): node is HTMLElement => isHTMLElementNode(node) && node.ownerDocument === document,
	);
	return [...new Set([...(container ? [container] : []), ...branches])].filter((root) => root.isConnected);
}

function focusScopeContains(entry: FocusScopeEntry, node: Node | null | undefined): boolean {
	return !!node && getFocusScopeRoots(entry).some((root) => root === node || root.contains(node));
}

function getFocusScopeFocusableElements(entry: FocusScopeEntry): HTMLElement[] {
	const values = getFocusScopeRoots(entry)
		.flatMap((root) => [root, ...getFocusableElements(root)])
		.filter((element) => isEffectivelyFocusable(element));
	return [...new Set(values)];
}

function focusFallback(entry: FocusScopeEntry) {
	const requested = entry.options.initialFocus?.();
	const target =
		requested && focusScopeContains(entry, requested) && isEffectivelyFocusable(requested)
			? requested
			: (getFocusScopeFocusableElements(entry)[0] ?? entry.options.container());
	target?.focus({ preventScroll: true });
}

function topScope(document: Document): FocusScopeEntry | undefined {
	return focusStacks.get(document)?.at(-1);
}

function removeFocusScopeEntry(entry: FocusScopeEntry, restore: boolean) {
	const document = entry.document;
	if (!document) return;
	const stack = focusStacks.get(document);
	const wasTop = stack?.at(-1)?.id === entry.id;
	const index = stack?.findIndex((scope) => scope.id === entry.id) ?? -1;
	if (index !== -1) {
		const nextScope = stack![index + 1];
		if (nextScope) nextScope.restoreTarget = entry.restoreTarget;
		stack!.splice(index, 1);
	}
	if (entry.locked) {
		unlockScroll(document);
		entry.locked = false;
	}
	if (restore && wasTop && entry.options.restoreFocus !== false) {
		const exposed = stack?.at(-1);
		if (entry.restoreTarget?.isConnected && (!exposed || focusScopeContains(exposed, entry.restoreTarget))) entry.restoreTarget.focus({ preventScroll: true });
		else if (exposed) focusFallback(exposed);
		else if (entry.restoreTarget?.isConnected) entry.restoreTarget.focus({ preventScroll: true });
	}
	if (stack?.length === 0) focusStacks.delete(document);
	entry.document = undefined;
}

/** 创建惰性模态焦点控制器；调用 update 绑定晚到或替换后的边界节点。 */
export function activateModalFocusScope(options: ModalFocusScopeOptions): ModalFocusScopeController {
	const entry: FocusScopeEntry = { id: Symbol('focus-scope'), options, restoreTarget: null, locked: false };
	let destroyed = false;
	const onKeyDown = (event: KeyboardEvent) => {
		if (entry.document && topScope(entry.document)?.id === entry.id && options.trapFocus !== false && event.key === 'Tab') {
			const values = getFocusScopeFocusableElements(entry);
			if (values.length === 0) {
				event.preventDefault();
				options.container()?.focus({ preventScroll: true });
				return;
			}
			const first = values[0];
			const last = values.at(-1)!;
			const active = entry.document.activeElement;
			if (event.shiftKey && (active === first || !focusScopeContains(entry, active))) {
				event.preventDefault();
				last.focus({ preventScroll: true });
			} else if (!event.shiftKey && (active === last || !focusScopeContains(entry, active))) {
				event.preventDefault();
				first.focus({ preventScroll: true });
			}
		}
	};
	const onFocusIn = (event: FocusEvent) => {
		if (entry.document && topScope(entry.document)?.id === entry.id && options.trapFocus !== false && isNodeValue(event.target) && !focusScopeContains(entry, event.target))
			focusFallback(entry);
	};
	const update = () => {
		if (destroyed || typeof document === 'undefined') return;
		const nextDocument = options.container()?.ownerDocument;
		if (nextDocument === entry.document) {
			if (nextDocument && topScope(nextDocument)?.id === entry.id && options.trapFocus !== false && !focusScopeContains(entry, nextDocument.activeElement))
				focusFallback(entry);
			return;
		}
		entry.document?.removeEventListener('keydown', onKeyDown);
		entry.document?.removeEventListener('focusin', onFocusIn);
		removeFocusScopeEntry(entry, false);
		if (!nextDocument) return;
		const configuredRestoreTarget = typeof options.restoreFocus === 'function' ? options.restoreFocus() : undefined;
		entry.restoreTarget =
			configuredRestoreTarget && isHTMLElementNode(configuredRestoreTarget) && configuredRestoreTarget.ownerDocument === nextDocument
				? configuredRestoreTarget
				: isHTMLElementNode(nextDocument.activeElement)
					? nextDocument.activeElement
					: null;
		entry.document = nextDocument;
		const stack = focusStacks.get(nextDocument) ?? [];
		stack.push(entry);
		focusStacks.set(nextDocument, stack);
		nextDocument.addEventListener('keydown', onKeyDown);
		nextDocument.addEventListener('focusin', onFocusIn);
		if (options.lockScroll !== false) {
			lockScroll(nextDocument);
			entry.locked = true;
		}
		queueMicrotask(() => {
			if (!destroyed && entry.document === nextDocument && topScope(nextDocument)?.id === entry.id) focusFallback(entry);
		});
	};
	queueMicrotask(update);
	return {
		update,
		destroy() {
			if (destroyed) return;
			destroyed = true;
			entry.document?.removeEventListener('keydown', onKeyDown);
			entry.document?.removeEventListener('focusin', onFocusIn);
			removeFocusScopeEntry(entry, true);
		},
	};
}

export type NativeValueControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/** 隐藏原生表单控件使用的内联样式。 */
export const HIDDEN_FORM_CONTROL_STYLE = {
	position: 'absolute',
	width: '1px',
	height: '1px',
	padding: '0',
	margin: '-1px',
	overflow: 'hidden',
	clip: 'rect(0, 0, 0, 0)',
	'white-space': 'nowrap',
	'border-width': '0',
	'pointer-events': 'none',
} as const;

/** 隐藏原生表单控件的完整非交互属性。 */
export const HIDDEN_FORM_CONTROL_PROPS = {
	tabIndex: -1,
	'aria-hidden': 'true',
	style: HIDDEN_FORM_CONTROL_STYLE,
} as const;

/** 设置原生控件首次渲染时的重置基准值。 */
export function setInitialNativeValue(control: NativeValueControl | undefined, value: string): void {
	if (!control) {
		return;
	}
	if (control instanceof HTMLSelectElement) {
		for (const option of control.options) {
			option.defaultSelected = option.value === value;
		}
		return;
	}
	control.defaultValue = value;
}

/** 设置 checkbox/radio 首次渲染时的重置基准状态。 */
export function setInitialNativeChecked(control: HTMLInputElement | undefined, checked: boolean): void {
	if (control) {
		control.defaultChecked = checked;
	}
}

/** 监听控件所属表单的原生 reset，并返回清理函数。 */
export function listenToFormReset(control: { form: HTMLFormElement | null } | undefined, reset: () => void): () => void {
	const form = control?.form;
	if (!form) {
		return () => undefined;
	}
	form.addEventListener('reset', reset);
	return () => form.removeEventListener('reset', reset);
}

export interface FormResetBinding {
	bind(control: { form: HTMLFormElement | null } | undefined): void;
	cleanup(): void;
}

/** 创建可在控件或 form 关联变化后重新绑定的 reset 监听器。 */
export function createFormResetBinding(reset: () => void): FormResetBinding {
	let cleanup: () => void = () => undefined;
	return {
		bind(control) {
			cleanup();
			cleanup = listenToFormReset(control, reset);
		},
		cleanup() {
			cleanup();
			cleanup = () => undefined;
		},
	};
}

function dispatchInputEvent(control: HTMLElement): void {
	const event = typeof InputEvent === 'function' ? new InputEvent('input', { bubbles: true }) : new Event('input', { bubbles: true });
	control.dispatchEvent(event);
}

/** 通过原生属性 setter 更新值，并按需派发可冒泡事件。 */
export function setNativeValue(control: HTMLInputElement | HTMLTextAreaElement, value: string, eventType?: 'input' | 'change'): void {
	const prototype = control instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
	Object.getOwnPropertyDescriptor(prototype, 'value')?.set?.call(control, value);
	if (eventType === 'input') {
		dispatchInputEvent(control);
	} else if (eventType === 'change') {
		control.dispatchEvent(new Event('change', { bubbles: true }));
	}
}

/** 通过原生属性 setter 更新选中状态，并按需按原生顺序派发 input/change。 */
export function setNativeChecked(control: HTMLInputElement, checked: boolean, dispatchEvents: boolean = false): void {
	Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked')?.set?.call(control, checked);
	if (dispatchEvents) {
		dispatchInputEvent(control);
		control.dispatchEvent(new Event('change', { bubbles: true }));
	}
}

export type HoverIntentOwner = 'trigger' | 'content';

export interface HoverIntentOptions {
	open: () => boolean;
	openDelay?: number;
	closeDelay?: number;
	reopenOnHoverAfterExternalClose?: boolean;
	onOpenChange: (open: boolean) => void;
	setTimeout?: typeof globalThis.setTimeout;
	clearTimeout?: typeof globalThis.clearTimeout;
}

export interface HoverIntentController {
	enter: (owner: HoverIntentOwner) => void;
	leave: (owner: HoverIntentOwner) => void;
	sync: () => void;
	cancel: () => void;
	destroy: () => void;
}

/** 管理 trigger/content 悬停意图，并与受控或外部 open 状态同步。 */
export function createHoverIntent(options: HoverIntentOptions): HoverIntentController {
	const owners = new Set<HoverIntentOwner>();
	const schedule = options.setTimeout ?? globalThis.setTimeout;
	const cancelTimer = options.clearTimeout ?? globalThis.clearTimeout;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let destroyed = false;
	let observedOpen = options.open();
	const cancel = () => {
		if (timer !== undefined) cancelTimer(timer);
		timer = undefined;
	};
	const queue = (nextOpen: boolean, delay: number) => {
		cancel();
		if (nextOpen === options.open()) return;
		timer = schedule(() => {
			timer = undefined;
			if (!destroyed && nextOpen !== options.open() && (nextOpen ? owners.size > 0 : owners.size === 0)) options.onOpenChange(nextOpen);
		}, delay);
	};
	const sync = () => {
		if (destroyed) return;
		const nextOpen = options.open();
		if (nextOpen === observedOpen) return;
		observedOpen = nextOpen;
		cancel();
		if (!nextOpen && owners.size > 0 && options.reopenOnHoverAfterExternalClose !== false) queue(true, options.openDelay ?? 0);
	};
	return {
		enter(owner) {
			if (destroyed) return;
			sync();
			const wasEmpty = owners.size === 0;
			owners.add(owner);
			if (wasEmpty) queue(true, options.openDelay ?? 0);
			else cancel();
		},
		leave(owner) {
			if (destroyed) return;
			sync();
			owners.delete(owner);
			if (owners.size === 0) queue(false, options.closeDelay ?? 0);
		},
		sync,
		cancel,
		destroy() {
			destroyed = true;
			owners.clear();
			cancel();
		},
	};
}

export type CompositePart = 'trigger' | 'content' | 'title' | 'description';

export interface CompositeIdRegistry {
	id: (part: CompositePart) => Accessor<string | undefined>;
	register: (part: CompositePart, id?: string) => () => void;
}

/** 创建稳定的 trigger/content ID，并按挂载顺序注册 title/description ID。 */
export function createCompositeIdRegistry(baseId: string): CompositeIdRegistry {
	const registrations = new Map<CompositePart, string[]>([
		['trigger', [`${baseId}-trigger`]],
		['content', [`${baseId}-content`]],
	]);
	const signals = new Map<CompositePart, ReturnType<typeof createSignal<string | undefined>>>();
	const getSignal = (part: CompositePart) => {
		let signal = signals.get(part);
		if (!signal) {
			signal = createSignal(registrations.get(part)?.at(-1));
			signals.set(part, signal);
		}
		return signal;
	};
	return {
		id(part) {
			return getSignal(part)[0];
		},
		register(part, id = `${baseId}-${part}`) {
			const values = registrations.get(part) ?? [];
			values.push(id);
			registrations.set(part, values);
			getSignal(part)[1](id);
			let active = true;
			return () => {
				if (!active) return;
				active = false;
				const index = values.lastIndexOf(id);
				if (index !== -1) values.splice(index, 1);
				getSignal(part)[1](values.at(-1));
			};
		},
	};
}

export type PointerAxis = 'horizontal' | 'vertical';

/** 将指针位置映射到 0..1；垂直轴默认从底部开始，零尺寸返回 0。 */
export function getPointerAxisRatio(
	clientX: number,
	clientY: number,
	rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
	axis: PointerAxis,
	inverted: boolean = false,
): number {
	const size = axis === 'horizontal' ? rect.width : rect.height;
	if (size <= 0) {
		return 0;
	}
	const start = axis === 'horizontal' ? rect.left : rect.top;
	const point = axis === 'horizontal' ? clientX : clientY;
	let ratio = Math.min(1, Math.max(0, (point - start) / size));
	if ((axis === 'vertical') !== inverted) {
		ratio = 1 - ratio;
	}
	return ratio;
}

export type RovingFocusIntent = 'first' | 'last' | 'next' | 'previous';

function hasExcludedAncestor(element: HTMLElement): boolean {
	for (let current: HTMLElement | null = element; current; current = current.parentElement) {
		if (current.hidden || current.hasAttribute('inert') || current.getAttribute('aria-hidden') === 'true') {
			return true;
		}
		const style = getComputedStyle(current);
		if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') {
			return true;
		}
	}
	return false;
}

/** 判断元素是否可作为 roving focus 目标。 */
export function isRovingFocusCandidate(element: HTMLElement): boolean {
	if (!element.isConnected || hasExcludedAncestor(element) || element.getAttribute('aria-disabled') === 'true') {
		return false;
	}
	if (element.matches(':disabled') || (element instanceof HTMLInputElement && element.type === 'hidden')) {
		return false;
	}
	if (element.hasAttribute('tabindex')) {
		return element.tabIndex >= -1;
	}
	if (element instanceof HTMLAnchorElement) {
		return element.hasAttribute('href');
	}
	return (
		element instanceof HTMLButtonElement ||
		element instanceof HTMLInputElement ||
		element instanceof HTMLSelectElement ||
		element instanceof HTMLTextAreaElement ||
		element.isContentEditable
	);
}

/** 查找跳过 disabled/aria-disabled 元素后的 roving focus 目标。 */
export function getRovingFocusTarget(elements: readonly HTMLElement[], current: HTMLElement | null, intent: RovingFocusIntent, loop: boolean = true): HTMLElement | undefined {
	const enabled = elements.filter(isRovingFocusCandidate);
	if (enabled.length === 0) {
		return undefined;
	}
	if (intent === 'first') {
		return enabled[0];
	}
	if (intent === 'last') {
		return enabled.at(-1);
	}

	const currentIndex = current ? enabled.indexOf(current) : -1;
	const step = intent === 'next' ? 1 : -1;
	const nextIndex = currentIndex === -1 ? (step === 1 ? 0 : enabled.length - 1) : currentIndex + step;
	if (loop) {
		return enabled[(nextIndex + enabled.length) % enabled.length];
	}
	return enabled[nextIndex];
}

/** 聚焦 roving focus 目标并返回该元素。 */
export function moveRovingFocus(elements: readonly HTMLElement[], current: HTMLElement | null, intent: RovingFocusIntent, loop: boolean = true): HTMLElement | undefined {
	const target = getRovingFocusTarget(elements, current, intent, loop);
	target?.focus();
	return target;
}
