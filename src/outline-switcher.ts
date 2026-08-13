import type { Text } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';

import {
	buildBulletOutline,
	BulletOutlineParsePendingError,
	type BulletOutlineNode,
} from './list-structure';

export type OutlineSwitcherOptions = Readonly<{
	view: EditorView;
	trigger: HTMLButtonElement;
	currentAnchor: number;
	noteTitle: string;
	filePath: string;
	getFilePath: () => string;
	isMobile: boolean;
	isContextValid: () => boolean;
	onFocus: (anchor: number) => boolean;
	onExit: () => boolean;
}>;

const openControllers = new WeakMap<EditorView, OutlineSwitcherController>();
type DocumentControllerStack = {
	controllers: OutlineSwitcherController[];
	onKeyDown: (event: KeyboardEvent) => void;
	onPointerDown: (event: PointerEvent) => void;
};
const documentControllerStacks = new WeakMap<Document, DocumentControllerStack>();

function registerDocumentController(
	document: Document,
	controller: OutlineSwitcherController,
): void {
	let stack = documentControllerStacks.get(document);
	if (stack === undefined) {
		stack = {
			controllers: [],
			onKeyDown: (event) => {
				const currentStack = documentControllerStacks.get(document);
				currentStack?.controllers.at(-1)?.handleDocumentKeyDown(event);
			},
			onPointerDown: (event) => {
				const currentStack = documentControllerStacks.get(document);
				currentStack?.controllers.at(-1)?.handleDocumentPointerDown(event);
			},
		};
		documentControllerStacks.set(document, stack);
		document.addEventListener('keydown', stack.onKeyDown, true);
		document.addEventListener('pointerdown', stack.onPointerDown, true);
	}
	stack.controllers.push(controller);
}

function unregisterDocumentController(
	document: Document,
	controller: OutlineSwitcherController,
): void {
	const stack = documentControllerStacks.get(document);
	if (stack === undefined) {
		return;
	}
	const index = stack.controllers.lastIndexOf(controller);
	if (index >= 0) {
		stack.controllers.splice(index, 1);
	}
	if (stack.controllers.length === 0) {
		document.removeEventListener('keydown', stack.onKeyDown, true);
		document.removeEventListener('pointerdown', stack.onPointerDown, true);
		documentControllerStacks.delete(document);
	}
}

export function findOutlinePath(
	nodes: readonly BulletOutlineNode[],
	anchor: number,
): readonly BulletOutlineNode[] | null {
	for (const node of nodes) {
		if (node.anchor === anchor) {
			return Object.freeze([node]);
		}
		const childPath = findOutlinePath(node.children, anchor);
		if (childPath !== null) {
			return Object.freeze([node, ...childPath]);
		}
	}
	return null;
}

export function openOutlineSwitcher(
	options: OutlineSwitcherOptions,
): OutlineSwitcherController {
	const existing = openControllers.get(options.view);
	if (existing?.isOpen() === true) {
		existing.close(true);
		return existing;
	}
	existing?.close(false);
	const controller = new OutlineSwitcherController(options, () => {
		if (openControllers.get(options.view) === controller) {
			openControllers.delete(options.view);
		}
	});
	openControllers.set(options.view, controller);
	controller.open();
	return controller;
}

export function closeOutlineSwitcher(
	view: EditorView,
	restoreTriggerFocus = false,
): void {
	openControllers.get(view)?.close(restoreTriggerFocus);
}

export class OutlineSwitcherController {
	private readonly outline: readonly BulletOutlineNode[];
	private readonly activePath: readonly BulletOutlineNode[];
	private readonly capturedDoc: Text;
	private readonly capturedFilePath: string;
	private readonly outlinePending: boolean;
	private layer: HTMLDivElement | null = null;
	private desktopParents: readonly BulletOutlineNode[];
	private mobileParents: readonly BulletOutlineNode[];
	private closed = false;
	private resizeObserver: ResizeObserver | null = null;

	constructor(
		private readonly options: OutlineSwitcherOptions,
		private readonly onClosed: () => void = () => undefined,
	) {
		try {
			this.outline = buildBulletOutline(options.view.state);
			this.outlinePending = false;
		} catch (error) {
			if (!(error instanceof BulletOutlineParsePendingError)) {
				throw error;
			}
			this.outline = Object.freeze([]);
			this.outlinePending = true;
		}
		this.activePath =
			findOutlinePath(this.outline, options.currentAnchor) ?? Object.freeze([]);
		this.desktopParents = Object.freeze(this.activePath.slice(0, -1));
		this.mobileParents = Object.freeze(this.activePath.slice(0, -1));
		this.capturedDoc = options.view.state.doc;
		this.capturedFilePath = options.filePath;
	}

	open(): void {
		if (this.layer !== null || this.closed || !this.isValid()) {
			return;
		}

		const document = this.options.view.dom.ownerDocument;
		this.layer = document.createElement('div');
		this.layer.className = `bullet-zoom-outline-layer ${
			this.options.isMobile ? 'is-mobile-presentation' : 'is-desktop-presentation'
		}`;
		this.layer.dataset.bulletZoomOutlineOwner = this.capturedFilePath;
		document.body.append(this.layer);
		if (this.options.isMobile) {
			this.layer.addEventListener('click', this.onMobileBackdropClick);
		}
		this.render();
		registerDocumentController(document, this);
		this.registerGeometryObservers(document);
		if (this.options.isMobile) {
			this.positionMobileLayer();
		} else {
			this.focusDesktopEntry();
		}
	}

	close(restoreTriggerFocus = true): void {
		if (this.closed) {
			return;
		}
		this.closed = true;
		const document = this.options.view.dom.ownerDocument;
		unregisterDocumentController(document, this);
		this.unregisterGeometryObservers(document);
		this.layer?.remove();
		this.layer = null;
		this.onClosed();
		if (
			restoreTriggerFocus &&
			this.options.trigger.isConnected &&
			this.isValid()
		) {
			this.options.trigger.focus();
		}
	}

	isOpen(): boolean {
		return this.layer !== null && !this.closed;
	}

	handleDocumentKeyDown(event: KeyboardEvent): void {
		if (event.key === 'Tab' && this.options.isMobile) {
			this.keepMobileFocusInside(event);
			return;
		}
		if (event.key !== 'Escape') {
			return;
		}
		event.preventDefault();
		event.stopPropagation();
		this.close(true);
	}

	handleDocumentPointerDown(event: PointerEvent): void {
		if (this.options.isMobile) {
			return;
		}
		const target = event.target;
		const nodeConstructor =
			this.options.view.dom.ownerDocument.defaultView?.Node;
		if (
			nodeConstructor !== undefined &&
			target instanceof nodeConstructor &&
			(this.layer?.contains(target) === true ||
				this.options.trigger.contains(target))
		) {
			return;
		}
		this.close(true);
	}

	private readonly onMobileBackdropClick = (event: MouseEvent): void => {
		if (event.target === this.layer) {
			this.close(true);
		}
	};

	private isValid(): boolean {
		return (
			this.options.view.state.doc === this.capturedDoc &&
			this.options.getFilePath() === this.capturedFilePath &&
			this.options.isContextValid()
		);
	}

	private registerGeometryObservers(document: Document): void {
		const window = document.defaultView;
		if (this.options.isMobile) {
			window?.visualViewport?.addEventListener(
				'resize',
				this.onMobileViewportChange,
			);
			window?.visualViewport?.addEventListener(
				'scroll',
				this.onMobileViewportChange,
			);
			window?.addEventListener('resize', this.onMobileViewportChange);
			return;
		}

		window?.addEventListener('resize', this.onDesktopGeometryChange);
		const ResizeObserverConstructor = window?.ResizeObserver;
		if (ResizeObserverConstructor !== undefined) {
			this.resizeObserver = new ResizeObserverConstructor(
				this.onDesktopGeometryChange,
			);
			this.resizeObserver.observe(this.options.view.dom);
			this.resizeObserver.observe(this.options.trigger);
		}
	}

	private unregisterGeometryObservers(document: Document): void {
		const window = document.defaultView;
		window?.removeEventListener('resize', this.onDesktopGeometryChange);
		window?.removeEventListener('resize', this.onMobileViewportChange);
		window?.visualViewport?.removeEventListener(
			'resize',
			this.onMobileViewportChange,
		);
		window?.visualViewport?.removeEventListener(
			'scroll',
			this.onMobileViewportChange,
		);
		this.resizeObserver?.disconnect();
		this.resizeObserver = null;
	}

	private readonly onDesktopGeometryChange = (): void => {
		if (!this.isValid()) {
			this.close(false);
			return;
		}
		const dialog = this.layer?.querySelector<HTMLElement>(
			'.bullet-zoom-outline-desktop',
		);
		if (dialog !== null && dialog !== undefined) {
			this.positionDesktopDialog(dialog);
		}
	};

	private readonly onMobileViewportChange = (): void => {
		if (!this.isValid()) {
			this.close(false);
			return;
		}
		this.positionMobileLayer();
	};

	private positionMobileLayer(): void {
		if (this.layer === null) {
			return;
		}
		const viewport = this.options.view.dom.ownerDocument.defaultView?.visualViewport;
		if (viewport === undefined || viewport === null) {
			this.layer.classList.remove('has-visual-viewport');
			this.layer.style.removeProperty('top');
			this.layer.style.removeProperty('height');
			return;
		}
		this.layer.classList.add('has-visual-viewport');
		this.layer.style.top = `${Math.max(0, Math.round(viewport.offsetTop))}px`;
		this.layer.style.height = `${Math.max(0, Math.round(viewport.height))}px`;
	}

	private render(): void {
		if (this.layer === null) {
			return;
		}
		this.layer.replaceChildren();
		if (this.options.isMobile) {
			this.renderMobile(this.layer);
		} else {
			this.renderDesktop(this.layer);
		}
	}

	private createDialog(
		className: string,
		modal: boolean,
	): HTMLDivElement {
		const dialog = this.options.view.dom.ownerDocument.createElement('div');
		dialog.className = `bullet-zoom-outline-dialog ${className}`;
		dialog.setAttribute('role', 'dialog');
		dialog.setAttribute('aria-label', '切換 bullet');
		dialog.setAttribute('aria-modal', String(modal));
		return dialog;
	}

	private renderHeader(
		dialog: HTMLElement,
		title: string,
		showBack: boolean,
	): void {
		const document = dialog.ownerDocument;
		const header = document.createElement('header');
		header.className = 'bullet-zoom-outline-header';
		if (showBack) {
			const returnTarget = this.mobileParents.at(-1);
			const back = document.createElement('button');
			back.type = 'button';
			back.className = 'bullet-zoom-outline-back';
			back.setAttribute('aria-label', '回到上一層');
			back.textContent = '‹';
			back.addEventListener('click', () => {
				this.mobileParents = Object.freeze(this.mobileParents.slice(0, -1));
				this.render();
				if (returnTarget !== undefined) {
					this.layer
						?.querySelector<HTMLButtonElement>(
							`[data-anchor="${returnTarget.anchor}"] .bullet-zoom-outline-label`,
						)
						?.focus();
				}
			});
			header.append(back);
		}

		const heading = document.createElement('div');
		heading.className = 'bullet-zoom-outline-title';
		heading.textContent = title;
		header.append(heading);

		if (this.outline.length > 0) {
			const root = document.createElement('button');
			root.type = 'button';
			root.className = 'bullet-zoom-outline-root';
			root.setAttribute('aria-label', '回到全文');
			root.textContent = '全文';
			root.addEventListener('click', () => this.selectRoot());
			header.append(root);
		}

		const close = document.createElement('button');
		close.type = 'button';
		close.className = 'bullet-zoom-outline-close';
		close.setAttribute('aria-label', '關閉 bullet 切換選單');
		close.textContent = '×';
		close.addEventListener('click', () => this.close(true));
		header.append(close);
		dialog.append(header);
	}

	private renderDesktop(layer: HTMLElement): void {
		const dialog = this.createDialog('bullet-zoom-outline-desktop', false);
		this.positionDesktopDialog(dialog);
		this.renderHeader(dialog, this.options.noteTitle, false);
		if (this.outline.length === 0) {
			dialog.append(this.createEmptyState());
			layer.append(dialog);
			return;
		}

		const columns = dialog.ownerDocument.createElement('div');
		columns.className = 'bullet-zoom-outline-columns';
		const levels: Array<readonly BulletOutlineNode[]> = [this.outline];
		for (const parent of this.desktopParents) {
			levels.push(parent.children);
		}
		for (const [depth, nodes] of levels.entries()) {
			columns.append(this.createColumn(nodes, depth, false));
		}
		dialog.append(columns);
		layer.append(dialog);
		columns.scrollLeft = columns.scrollWidth;
	}

	private focusDesktopEntry(): void {
		const preferred =
			this.layer?.querySelector<HTMLButtonElement>(
				'.bullet-zoom-outline-label[aria-current="location"]',
			) ??
			this.layer?.querySelector<HTMLButtonElement>(
				'.bullet-zoom-outline-label',
			) ??
			this.layer?.querySelector<HTMLButtonElement>(
				'.bullet-zoom-outline-close',
			);
		preferred?.focus();
	}

	private renderMobile(layer: HTMLElement): void {
		const dialog = this.createDialog('bullet-zoom-outline-mobile', true);
		const parent = this.mobileParents.at(-1);
		this.renderHeader(
			dialog,
			parent?.label ?? this.options.noteTitle,
			this.mobileParents.length > 0,
		);
		const nodes = parent?.children ?? this.outline;
		if (this.outline.length === 0) {
			dialog.append(this.createEmptyState());
		} else {
			const list = dialog.ownerDocument.createElement('div');
			list.className = 'bullet-zoom-outline-mobile-list';
			list.append(...nodes.map((node) => this.createRow(node, 0, true)));
			dialog.append(list);
		}
		layer.append(dialog);
		this.focusMobileEntry();
	}

	private focusMobileEntry(): void {
		const preferred =
			this.layer?.querySelector<HTMLButtonElement>(
				'.bullet-zoom-outline-label[aria-current="location"]',
			) ??
			this.layer?.querySelector<HTMLButtonElement>(
				'.bullet-zoom-outline-label',
			) ??
			this.layer?.querySelector<HTMLButtonElement>(
				'.bullet-zoom-outline-close',
			);
		preferred?.focus();
	}

	private keepMobileFocusInside(event: KeyboardEvent): void {
		const controls = Array.from(
			this.layer?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ??
				[],
		);
		const first = controls[0];
		const last = controls.at(-1);
		if (first === undefined || last === undefined) {
			return;
		}
		const active = this.options.view.dom.ownerDocument.activeElement;
		if (event.shiftKey && (active === first || !this.layer?.contains(active))) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && (active === last || !this.layer?.contains(active))) {
			event.preventDefault();
			first.focus();
		}
	}

	private createColumn(
		nodes: readonly BulletOutlineNode[],
		depth: number,
		mobile: boolean,
	): HTMLDivElement {
		const column = this.options.view.dom.ownerDocument.createElement('div');
		column.className = 'bullet-zoom-outline-column';
		column.setAttribute('role', 'group');
		column.setAttribute('aria-label', `第 ${depth + 1} 層 Bullet`);
		column.append(...nodes.map((node) => this.createRow(node, depth, mobile)));
		return column;
	}

	private createRow(
		node: BulletOutlineNode,
		depth: number,
		mobile: boolean,
	): HTMLDivElement {
		const document = this.options.view.dom.ownerDocument;
		const row = document.createElement('div');
		row.className = 'bullet-zoom-outline-row';
		row.dataset.anchor = String(node.anchor);
		const pathNode = this.activePath[depth];
		if (pathNode?.anchor === node.anchor) {
			row.classList.add('is-on-path');
		}
		if (!mobile && this.desktopParents[depth]?.anchor === node.anchor) {
			row.classList.add('is-browse-parent');
		}
		if (node.anchor === this.options.currentAnchor) {
			row.classList.add('is-current');
		}

		const label = document.createElement('button');
		label.type = 'button';
		label.className = 'bullet-zoom-outline-label';
		label.textContent = node.label;
		label.title = node.label;
		label.setAttribute('aria-label', `聚焦「${node.label}」`);
		if (node.anchor === this.options.currentAnchor) {
			label.setAttribute('aria-current', 'location');
		}
		label.addEventListener('click', () => this.selectNode(node));
		row.append(label);

		if (node.children.length > 0) {
			const children = document.createElement('button');
			children.type = 'button';
			children.className = 'bullet-zoom-outline-children';
			children.setAttribute('aria-label', `查看「${node.label}」的下一層`);
			children.textContent = '›';
			children.addEventListener('click', () => this.browseChildren(node, depth, mobile));
			row.append(children);
			if (!mobile) {
				row.addEventListener('pointerenter', () =>
					this.browseChildren(node, depth, false),
				);
			}
		}
		return row;
	}

	private browseChildren(
		node: BulletOutlineNode,
		depth: number,
		mobile: boolean,
	): void {
		if (!this.isValid() || node.children.length === 0) {
			this.close(false);
			return;
		}
		if (mobile) {
			this.mobileParents = Object.freeze([...this.mobileParents, node]);
		} else {
			if (this.desktopParents[depth]?.anchor === node.anchor) {
				return;
			}
			const focusedChevron =
				this.options.view.dom.ownerDocument.activeElement?.classList.contains(
					'bullet-zoom-outline-children',
				) === true;
			this.desktopParents = Object.freeze([
				...this.desktopParents.slice(0, depth),
				node,
			]);
			this.render();
			if (focusedChevron) {
				this.layer
					?.querySelector<HTMLButtonElement>(
						`[data-anchor="${node.anchor}"] .bullet-zoom-outline-children`,
					)
					?.focus();
			}
			return;
		}
		this.render();
	}

	private selectNode(node: BulletOutlineNode): void {
		if (!this.isValid()) {
			this.close(false);
			return;
		}
		const succeeded = this.options.onFocus(node.anchor);
		this.close(false);
		if (succeeded) {
			this.options.view.focus();
		}
	}

	private selectRoot(): void {
		if (!this.isValid()) {
			this.close(false);
			return;
		}
		const succeeded = this.options.onExit();
		this.close(false);
		if (succeeded) {
			this.options.view.focus();
		}
	}

	private createEmptyState(): HTMLDivElement {
		const empty = this.options.view.dom.ownerDocument.createElement('div');
		empty.className = 'bullet-zoom-outline-empty';
		if (this.outlinePending) {
			empty.textContent = '筆記結構仍在解析，請稍後再開啟';
		} else {
			empty.textContent = '目前沒有可切換的 bullet';
		}
		return empty;
	}

	private positionDesktopDialog(dialog: HTMLElement): void {
		const triggerRect = this.options.trigger.getBoundingClientRect();
		const editorRect = this.options.view.dom.getBoundingClientRect();
		const viewportWidth = editorRect.width > 0 ? editorRect.width : 240;
		const left = Math.max(
			editorRect.left,
			Math.min(triggerRect.left, editorRect.right - Math.min(720, viewportWidth)),
		);
		const spaceBelow = editorRect.bottom - triggerRect.bottom - 4;
		const spaceAbove = triggerRect.top - editorRect.top - 4;
		const openAbove = spaceBelow < 160 && spaceAbove > spaceBelow;
		const desiredHeight = Math.min(480, editorRect.height > 0 ? editorRect.height : 480);
		const top = openAbove
			? Math.max(editorRect.top, triggerRect.top - 4 - desiredHeight)
			: Math.max(editorRect.top, triggerRect.bottom + 4);
		const availableHeight = openAbove
			? triggerRect.top - 4 - top
			: editorRect.bottom - top - 8;
		dialog.style.left = `${Math.round(left)}px`;
		dialog.style.top = `${Math.round(top)}px`;
		dialog.style.minWidth = `${Math.round(Math.min(352, viewportWidth))}px`;
		dialog.style.maxWidth = `${Math.round(viewportWidth)}px`;
		dialog.style.maxHeight = `${Math.max(44, Math.round(availableHeight))}px`;
	}
}
