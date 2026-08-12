import {
	EditorSelection,
	EditorState,
	Facet,
	StateEffect,
	StateField,
	type Extension,
} from '@codemirror/state';
import {
	Decoration,
	type DecorationSet,
	EditorView,
	type Panel,
	type PluginValue,
	showPanel,
	ViewPlugin,
	type ViewUpdate,
	WidgetType,
} from '@codemirror/view';

import {
	buildBreadcrumbs,
	buildBulletNavigationTree,
	computeBranchRange,
	displayBulletLabel,
	findSupportedBullet,
	type Breadcrumb,
	type BranchRange,
	type BulletNavigationNode,
} from './list-structure';

export const LIVE_PREVIEW_REQUIRED_NOTICE =
	'Bullet Zoom 第一版只支援即時預覽模式。';
export const SUPPORTED_BULLET_REQUIRED_NOTICE =
	'請先把游標放在一般 Bullet Point 裡。';
export const EDITOR_VIEW_UNAVAILABLE_NOTICE =
	'無法取得目前的 Obsidian 編輯畫面。';

const MOBILE_BREADCRUMB_SCROLL_MARGIN = 52;

export type NoticeHandler = (message: string) => void;

export type FocusSession = Readonly<{
	filePath: string;
	anchor: number;
	branch: BranchRange;
	breadcrumbs: readonly Breadcrumb[];
}>;

export const focusFilePath = Facet.define<string | null, string | null>({
	combine: (values) => values[values.length - 1] ?? null,
});

export const focusNoteTitle = Facet.define<string, string>({
	combine: (values) => values[values.length - 1] ?? '未命名筆記',
});

export const focusLivePreview = Facet.define<boolean, boolean>({
	combine: (values) => values[values.length - 1] ?? false,
});

const focusPhoneMode = Facet.define<boolean, boolean>({
	combine: (values) => values[values.length - 1] ?? false,
});

const focusMobileMode = Facet.define<boolean, boolean>({
	combine: (values) => values[values.length - 1] ?? false,
});

export const focusAtEffect = StateEffect.define<number>();
export const clearFocusEffect = StateEffect.define<void>();
type MobileEditorScrollRequest = Readonly<{
	from: number;
	to: number;
	expectedFocusAnchor: number | null;
	expectedSelection: Readonly<{ anchor: number; head: number }> | null;
	placement: 'start' | 'center';
}>;
const mobileEditorScrollEffect = StateEffect.define<MobileEditorScrollRequest>();

function matchesMobileEditorScrollRequest(
	state: EditorState,
	request: MobileEditorScrollRequest,
): boolean {
	if (
		request.from < 0 ||
		request.to < request.from ||
		request.to > state.doc.length ||
		(getFocusSession(state)?.anchor ?? null) !== request.expectedFocusAnchor
	) {
		return false;
	}

	if (request.expectedSelection === null) {
		return true;
	}

	const selection = state.selection.main;
	return (
		selection.anchor === request.expectedSelection.anchor &&
		selection.head === request.expectedSelection.head
	);
}

function createFocusSession(
	state: EditorState,
	position: number,
	expectedFilePath?: string,
): FocusSession | null {
	if (!state.facet(focusLivePreview)) {
		return null;
	}

	const filePath = state.facet(focusFilePath);
	if (
		filePath === null ||
		(expectedFilePath !== undefined && filePath !== expectedFilePath)
	) {
		return null;
	}

	const bullet = findSupportedBullet(state, position);
	const branch = computeBranchRange(state, position);
	const breadcrumbs = buildBreadcrumbs(
		state,
		position,
		state.facet(focusNoteTitle),
	);
	if (bullet === null || branch === null || breadcrumbs === null) {
		return null;
	}

	return Object.freeze({
		filePath,
		anchor: bullet.markerFrom,
		branch,
		breadcrumbs,
	});
}

export const focusStateField = StateField.define<FocusSession | null>({
	create: () => null,
	update: (current, transaction) => {
		let next = current;
		let handledEffect = false;

		for (const effect of transaction.effects) {
			if (effect.is(clearFocusEffect)) {
				next = null;
				handledEffect = true;
			} else if (effect.is(focusAtEffect)) {
				next = createFocusSession(transaction.state, effect.value);
				handledEffect = true;
			}
		}

		if (handledEffect || next === null) {
			return next;
		}

		const nextNoteTitle = transaction.state.facet(focusNoteTitle);
		const nextDisplayTitle =
			nextNoteTitle.length === 0 ? '未命名筆記' : nextNoteTitle;
		if (
			!transaction.docChanged &&
			transaction.state.facet(focusLivePreview) &&
			transaction.state.facet(focusFilePath) === next.filePath &&
			next.breadcrumbs[0]?.label === nextDisplayTitle
		) {
			return next;
		}

		const mappedAnchor = transaction.docChanged
			? transaction.changes.mapPos(next.anchor, 1)
			: next.anchor;
		return createFocusSession(
			transaction.state,
			mappedAnchor,
			next.filePath,
		);
	},
});

const hiddenBlock = Decoration.replace({ block: true });

const focusDecorations = EditorView.decorations.compute(
	[focusStateField],
	(state) => {
		const session = state.field(focusStateField);
		if (session === null) {
			return Decoration.none;
		}

		const ranges = [];
		if (session.branch.from > 0) {
			ranges.push(hiddenBlock.range(0, session.branch.from - 1));
		}
		if (session.branch.to < state.doc.length) {
			ranges.push(
				hiddenBlock.range(session.branch.to + 1, state.doc.length),
			);
		}
		return Decoration.set(ranges, true);
	},
);

const markerDecoration = Decoration.mark({ class: 'bullet-zoom-marker' });
const rowControlOwners = new WeakMap<HTMLElement, EditorView>();
type BulletRowControlMode = 'enter' | 'exit';

class BulletRowControlWidget extends WidgetType {
	constructor(
		private readonly label: string,
		private readonly isMobileActive: boolean,
		private readonly mode: BulletRowControlMode,
	) {
		super();
	}

	eq(other: BulletRowControlWidget): boolean {
		return (
			this.label === other.label &&
			this.isMobileActive === other.isMobileActive &&
			this.mode === other.mode
		);
	}

	ignoreEvent(event: Event): boolean {
		return event.type !== 'click';
	}

	toDOM(view: EditorView): HTMLElement {
		const button = view.dom.ownerDocument.createElement('button');
		const label = displayBulletLabel(this.label);
		button.type = 'button';
		button.className = `bullet-zoom-row-control bullet-zoom-${this.mode}-control`;
		rowControlOwners.set(button, view);
		button.classList.toggle('is-mobile-active', this.isMobileActive);
		const accessibleLabel =
			this.mode === 'exit'
				? `退出聚焦「${label}」，回到全文`
				: `聚焦「${label}」`;
		button.title = accessibleLabel;
		button.setAttribute('aria-label', accessibleLabel);

		const icon = button.ownerDocument.createElement('span');
		icon.className = 'bullet-zoom-row-icon';
		icon.setAttribute('aria-hidden', 'true');
		icon.textContent = this.mode === 'exit' ? '↖' : '↳';
		button.append(icon);
		return button;
	}
}

function buildMarkerDecorations(view: EditorView): DecorationSet {
	if (!view.state.facet(focusLivePreview)) {
		return Decoration.none;
	}

	const ranges = [];
	const focusAnchor = getFocusSession(view.state)?.anchor ?? null;
	const isMobile = view.state.facet(focusMobileMode);
	const activeLineNumber = view.state.doc.lineAt(
		view.state.selection.main.head,
	).number;
	const visitedLines = new Set<number>();
	for (const visibleRange of view.visibleRanges) {
		let line = view.state.doc.lineAt(visibleRange.from);
		while (line.from <= visibleRange.to) {
			if (!visitedLines.has(line.number)) {
				visitedLines.add(line.number);
				const bullet = findSupportedBullet(view.state, line.from);
				if (bullet !== null) {
					ranges.push(
						markerDecoration.range(bullet.markerFrom, bullet.markerTo),
					);
					ranges.push(
						Decoration.widget({
							widget: new BulletRowControlWidget(
								bullet.label,
								isMobile && bullet.lineNumber === activeLineNumber,
								bullet.markerFrom === focusAnchor ? 'exit' : 'enter',
							),
							side: 1,
						}).range(bullet.lineTo),
					);
				}
			}
			if (line.number >= view.state.doc.lines) {
				break;
			}
			line = view.state.doc.line(line.number + 1);
		}
	}
	return Decoration.set(ranges, true);
}

class BulletMarkerPlugin implements PluginValue {
	decorations: DecorationSet;

	constructor(view: EditorView) {
		this.decorations = buildMarkerDecorations(view);
	}

	update(update: ViewUpdate): void {
		if (
			update.docChanged ||
			(update.selectionSet && update.state.facet(focusMobileMode)) ||
			update.viewportChanged ||
			getFocusSession(update.startState) !== getFocusSession(update.state) ||
			update.startState.facet(focusLivePreview) !==
				update.state.facet(focusLivePreview)
		) {
			this.decorations = buildMarkerDecorations(update.view);
		}
	}
}

const bulletMarkerPlugin = ViewPlugin.fromClass(BulletMarkerPlugin, {
	decorations: (plugin) => plugin.decorations,
});

export function enterFocusAt(
	view: EditorView,
	position: number,
	moveSelectionToLineEnd = false,
): boolean {
	if (!view.state.facet(focusLivePreview)) {
		return false;
	}

	const bullet = findSupportedBullet(view.state, position);
	if (bullet === null) {
		return false;
	}

	view.dispatch({
		selection: moveSelectionToLineEnd
			? EditorSelection.cursor(bullet.lineTo)
			: view.state.selection,
		effects: [
			focusAtEffect.of(bullet.markerFrom),
			...(view.state.facet(focusPhoneMode)
				? [
						mobileEditorScrollEffect.of({
							from: bullet.markerFrom,
							to: bullet.markerFrom,
							expectedFocusAnchor: bullet.markerFrom,
							expectedSelection: null,
							placement: 'start',
						}),
					]
				: []),
		],
	});
	return true;
}

const markerClickHandler = EditorView.domEventHandlers({
	click: (event, view) => {
		const elementConstructor = view.dom.ownerDocument.defaultView?.HTMLElement;
		if (
			elementConstructor === undefined ||
			!(event.target instanceof elementConstructor)
		) {
			return false;
		}
		if (event.target.closest('.collapse-indicator') !== null) {
			return false;
		}

		const rowControl = event.target.closest<HTMLElement>(
			'.bullet-zoom-row-control',
		);
		if (
			rowControl !== null &&
			rowControlOwners.get(rowControl) !== view
		) {
			return false;
		}
		const marker = event.target.closest<HTMLElement>('.bullet-zoom-marker');
		const activationTarget = rowControl ?? marker;
		if (activationTarget === null || !view.dom.contains(activationTarget)) {
			return false;
		}

		const position = view.posAtDOM(activationTarget);
		if (rowControl?.classList.contains('bullet-zoom-exit-control')) {
			const session = getFocusSession(view.state);
			const bullet = findSupportedBullet(view.state, position);
			if (
				session === null ||
				bullet === null ||
				bullet.markerFrom !== session.anchor ||
				!exitFocus(view)
			) {
				return false;
			}
		} else if (!enterFocusAt(view, position, true)) {
			return false;
		}

		event.preventDefault();
		event.stopImmediatePropagation();
		view.focus();
		return true;
	},
});

const FOCUSED_PANE_CLASS = 'bullet-zoom-pane-is-focused';

class FocusedPanePresentationPlugin implements PluginValue {
	private pane: HTMLElement | null = null;

	constructor(view: EditorView) {
		this.sync(view);
	}

	update(update: ViewUpdate): void {
		this.sync(update.view);
	}

	destroy(): void {
		this.pane?.classList.remove(FOCUSED_PANE_CLASS);
		this.pane = null;
	}

	private sync(view: EditorView): void {
		const nextPane = view.dom.closest<HTMLElement>('.markdown-source-view');
		if (nextPane !== this.pane) {
			this.pane?.classList.remove(FOCUSED_PANE_CLASS);
			this.pane = nextPane;
		}
		this.pane?.classList.toggle(
			FOCUSED_PANE_CLASS,
			getFocusSession(view.state) !== null,
		);
	}
}

const focusedPanePresentationPlugin = ViewPlugin.fromClass(
	FocusedPanePresentationPlugin,
);

const hierarchyMenuControllers = new WeakMap<
	EditorView,
	HierarchyMenuController
>();
const hierarchyMenuTriggerOwners = new WeakMap<HTMLElement, EditorView>();

function findNavigationNode(
	root: BulletNavigationNode,
	anchor: number | null,
): BulletNavigationNode | null {
	if (root.anchor === anchor) {
		return root;
	}
	for (const child of root.children) {
		const match = findNavigationNode(child, anchor);
		if (match !== null) {
			return match;
		}
	}
	return null;
}

function focusNavigationChanged(
	startState: EditorState,
	state: EditorState,
): boolean {
	const start = getFocusSession(startState);
	const next = getFocusSession(state);
	if (start === null || next === null) {
		return start !== next;
	}
	if (
		start.anchor !== next.anchor ||
		start.filePath !== next.filePath ||
		start.breadcrumbs.length !== next.breadcrumbs.length
	) {
		return true;
	}
	return start.breadcrumbs.some((breadcrumb, index) => {
		const other = next.breadcrumbs[index];
		return (
			other === undefined ||
			breadcrumb.anchor !== other.anchor ||
			breadcrumb.label !== other.label
		);
	});
}

class HierarchyMenuController {
	private menu: HTMLElement | null = null;
	private origin: HTMLButtonElement | null = null;
	private path: BulletNavigationNode[] = [];
	private readonly onOutsideMouseDown = (event: MouseEvent): void => {
		this.closeFromOutside(event.target);
	};
	private readonly onOutsideTouchStart = (event: TouchEvent): void => {
		this.closeFromOutside(event.target);
	};
	private readonly onViewportChange = (): void => {
		this.positionMenu();
	};

	constructor(private readonly view: EditorView) {
		hierarchyMenuControllers.set(view, this);
	}

	open(trigger: HTMLButtonElement, anchor: number | null): void {
		if (
			hierarchyMenuTriggerOwners.get(trigger) !== this.view ||
			!this.view.dom.ownerDocument.contains(trigger)
		) {
			return;
		}

		const tree = buildBulletNavigationTree(
			this.view.state,
			this.view.state.facet(focusNoteTitle),
		);
		const node = findNavigationNode(tree, anchor);
		if (node === null || node.children.length === 0) {
			this.close(false);
			return;
		}

		this.close(false);
		this.origin = trigger;
		this.path = [node];
		trigger.setAttribute('aria-expanded', 'true');

		const menu = this.view.dom.ownerDocument.createElement('div');
		menu.className = 'bullet-zoom-hierarchy-menu';
		menu.classList.toggle(
			'is-mobile',
			this.view.state.facet(focusMobileMode),
		);
		menu.setAttribute('aria-label', `${node.label} 的下層`);
		menu.addEventListener('keydown', (event) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				event.stopPropagation();
				this.close(true);
			}
		});
		this.menu = menu;
		this.view.dom.ownerDocument.body.append(menu);
		this.addGlobalListeners();
		this.render();
		this.positionMenu();
		menu
			.querySelector<HTMLButtonElement>('.bullet-zoom-hierarchy-label')
			?.focus();
	}

	update(update: ViewUpdate): void {
		if (
			this.menu !== null &&
			(update.docChanged ||
				focusNavigationChanged(update.startState, update.state))
		) {
			this.close(false);
		}
	}

	destroy(): void {
		this.close(false);
		hierarchyMenuControllers.delete(this.view);
	}

	private render(): void {
		const menu = this.menu;
		if (menu === null) {
			return;
		}

		menu.replaceChildren();
		const isMobile = this.view.state.facet(focusMobileMode);
		const visiblePath = isMobile ? this.path.slice(-1) : this.path;
		const firstPathIndex = isMobile ? this.path.length - 1 : 0;
		visiblePath.forEach((parent, visibleIndex) => {
			const pathIndex = firstPathIndex + visibleIndex;
			menu.append(this.createColumn(parent, pathIndex, isMobile));
		});
	}

	private createColumn(
		parent: BulletNavigationNode,
		pathIndex: number,
		isMobile: boolean,
	): HTMLElement {
		const column = this.view.dom.ownerDocument.createElement('div');
		column.className = 'bullet-zoom-hierarchy-column';
		column.setAttribute('role', 'menu');
		column.setAttribute('aria-label', `${parent.label} 的下層`);
		column.dataset.level = String(pathIndex);

		if (isMobile && pathIndex > 0) {
			const previous = this.path[pathIndex - 1];
			const back = column.ownerDocument.createElement('button');
			back.type = 'button';
			back.className = 'bullet-zoom-hierarchy-back';
			back.setAttribute('role', 'menuitem');
			back.setAttribute('aria-label', `回到 ${previous?.label ?? '上一層'} 的下層`);
			back.textContent = `‹ ${previous?.label ?? '上一層'}`;
			back.addEventListener('click', () => {
				this.goBack();
			});
			column.append(back);
		}

		parent.children.forEach((node, rowIndex) => {
			const row = column.ownerDocument.createElement('div');
			row.className = 'bullet-zoom-hierarchy-row';
			row.setAttribute('role', 'none');

			const label = column.ownerDocument.createElement('button');
			label.type = 'button';
			label.className = 'bullet-zoom-hierarchy-label';
			label.setAttribute('role', 'menuitem');
			label.tabIndex = rowIndex === 0 ? 0 : -1;
			label.textContent = node.label;
			label.title = node.label;
			label.dataset.nodeAnchor = String(node.anchor);
			if (this.nodeIsCurrentFocus(node)) {
				label.setAttribute('aria-current', 'page');
			}
			label.addEventListener('click', () => {
				this.activateNode(node);
			});
			label.addEventListener('keydown', (event) => {
				this.handleLabelKeyDown(event, node, pathIndex, column);
			});
			row.append(label);

			if (node.children.length > 0) {
				const childTrigger = column.ownerDocument.createElement('button');
				childTrigger.type = 'button';
				childTrigger.className = 'bullet-zoom-hierarchy-child-trigger';
				childTrigger.setAttribute('role', 'menuitem');
				childTrigger.setAttribute('aria-haspopup', 'menu');
				childTrigger.setAttribute(
					'aria-expanded',
					String(this.path[pathIndex + 1]?.anchor === node.anchor),
				);
				childTrigger.setAttribute(
					'aria-label',
					`展開「${node.label}」的下層`,
				);
				childTrigger.textContent = '›';
				childTrigger.addEventListener('click', () => {
					this.openChild(pathIndex, node, true);
				});
				row.addEventListener('mouseenter', () => {
					if (!this.view.state.facet(focusMobileMode)) {
						this.openChild(pathIndex, node, false);
					}
				});
				row.append(childTrigger);
			}
			column.append(row);
		});

		return column;
	}

	private nodeIsCurrentFocus(node: BulletNavigationNode): boolean {
		if (node.anchor === null) {
			return false;
		}
		const bullet = findSupportedBullet(this.view.state, node.anchor);
		return bullet?.markerFrom === getFocusSession(this.view.state)?.anchor;
	}

	private activateNode(node: BulletNavigationNode): void {
		if (node.anchor === null) {
			this.close(false);
			return;
		}
		const currentTree = buildBulletNavigationTree(
			this.view.state,
			this.view.state.facet(focusNoteTitle),
		);
		const currentNode = findNavigationNode(currentTree, node.anchor);
		const bullet = findSupportedBullet(this.view.state, node.anchor);
		if (currentNode === null || bullet === null) {
			this.close(false);
			return;
		}

		this.close(false);
		if (enterFocusAt(this.view, bullet.markerFrom)) {
			this.view.focus();
		}
	}

	private openChild(
		pathIndex: number,
		node: BulletNavigationNode,
		focusFirst: boolean,
	): void {
		if (this.menu === null || node.children.length === 0) {
			return;
		}
		this.path = [...this.path.slice(0, pathIndex + 1), node];
		this.render();
		this.positionMenu();
		const latestColumn = this.menu.querySelector<HTMLElement>(
			'.bullet-zoom-hierarchy-column:last-child',
		);
		if (typeof latestColumn?.scrollIntoView === 'function') {
			latestColumn.scrollIntoView({ block: 'nearest', inline: 'nearest' });
		}
		if (focusFirst) {
			this.menu
				.querySelector<HTMLButtonElement>(
					'.bullet-zoom-hierarchy-column:last-child .bullet-zoom-hierarchy-label',
				)
				?.focus();
		}
	}

	private goBack(): void {
		if (this.menu === null || this.path.length <= 1) {
			return;
		}
		const removed = this.path.at(-1);
		this.path = this.path.slice(0, -1);
		this.render();
		this.positionMenu();
		const selector = `.bullet-zoom-hierarchy-column:last-child .bullet-zoom-hierarchy-label[data-node-anchor="${String(removed?.anchor)}"]`;
		this.menu.querySelector<HTMLButtonElement>(selector)?.focus();
	}

	private handleLabelKeyDown(
		event: KeyboardEvent,
		node: BulletNavigationNode,
		pathIndex: number,
		column: HTMLElement,
	): void {
		if (event.key === 'ArrowRight' && node.children.length > 0) {
			event.preventDefault();
			this.openChild(pathIndex, node, true);
			return;
		}
		if (event.key === 'ArrowLeft' && this.path.length > 1) {
			event.preventDefault();
			this.goBack();
			return;
		}
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			this.activateNode(node);
			return;
		}
		if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
			return;
		}

		event.preventDefault();
		const labels = Array.from(
			column.querySelectorAll<HTMLButtonElement>(
				'.bullet-zoom-hierarchy-label',
			),
		);
		const currentIndex = labels.indexOf(event.currentTarget as HTMLButtonElement);
		const offset = event.key === 'ArrowDown' ? 1 : -1;
		const nextIndex = (currentIndex + offset + labels.length) % labels.length;
		labels[nextIndex]?.focus();
	}

	private closeFromOutside(target: EventTarget | null): void {
		const elementConstructor =
			this.view.dom.ownerDocument.defaultView?.Node;
		if (
			this.menu === null ||
			elementConstructor === undefined ||
			!(target instanceof elementConstructor) ||
			this.menu.contains(target) ||
			this.origin?.contains(target)
		) {
			return;
		}
		this.close(false);
	}

	private close(restoreFocus: boolean): void {
		const origin = this.origin;
		origin?.setAttribute('aria-expanded', 'false');
		this.removeGlobalListeners();
		this.menu?.remove();
		this.menu = null;
		this.origin = null;
		this.path = [];
		if (
			restoreFocus &&
			origin !== null &&
			hierarchyMenuTriggerOwners.get(origin) === this.view &&
			origin.ownerDocument.contains(origin)
		) {
			origin.focus();
		}
	}

	private addGlobalListeners(): void {
		const document = this.view.dom.ownerDocument;
		const window = document.defaultView;
		document.addEventListener('mousedown', this.onOutsideMouseDown, true);
		document.addEventListener('touchstart', this.onOutsideTouchStart, true);
		window?.addEventListener('resize', this.onViewportChange);
		window?.visualViewport?.addEventListener('resize', this.onViewportChange);
		window?.visualViewport?.addEventListener('scroll', this.onViewportChange);
	}

	private removeGlobalListeners(): void {
		const document = this.view.dom.ownerDocument;
		const window = document.defaultView;
		document.removeEventListener('mousedown', this.onOutsideMouseDown, true);
		document.removeEventListener('touchstart', this.onOutsideTouchStart, true);
		window?.removeEventListener('resize', this.onViewportChange);
		window?.visualViewport?.removeEventListener('resize', this.onViewportChange);
		window?.visualViewport?.removeEventListener('scroll', this.onViewportChange);
	}

	private positionMenu(): void {
		const menu = this.menu;
		const origin = this.origin;
		const window = this.view.dom.ownerDocument.defaultView;
		if (menu === null || origin === null || window === null) {
			return;
		}

		const viewport = window.visualViewport;
		const viewportLeft = viewport?.offsetLeft ?? 0;
		const viewportTop = viewport?.offsetTop ?? 0;
		const viewportWidth = viewport?.width ?? window.innerWidth;
		const viewportHeight = viewport?.height ?? window.innerHeight;
		const viewportRight = viewportLeft + viewportWidth;
		const viewportBottom = viewportTop + viewportHeight;
		const originRect = origin.getBoundingClientRect();
		const viewRect = this.view.dom.getBoundingClientRect();
		const top = Math.min(
			Math.max(viewportTop, originRect.bottom),
			Math.max(viewportTop, viewportBottom - 44),
		);
		menu.style.top = `${top}px`;
		menu.style.maxHeight = `${Math.max(44, viewportBottom - top - 8)}px`;

		if (this.view.state.facet(focusMobileMode)) {
			const left = Math.max(viewportLeft, viewRect.left);
			const right = Math.min(viewportRight, viewRect.right);
			menu.style.left = `${left}px`;
			menu.style.width = right > left ? `${right - left}px` : '100%';
			return;
		}

		menu.style.left = `${Math.max(viewportLeft, originRect.left)}px`;
		const menuRect = menu.getBoundingClientRect();
		if (menuRect.right > viewportRight) {
			menu.style.left = `${Math.max(
				viewportLeft,
				viewportRight - menuRect.width,
			)}px`;
		}
	}
}

class HierarchyMenuPlugin implements PluginValue {
	private readonly controller: HierarchyMenuController;

	constructor(view: EditorView) {
		this.controller = new HierarchyMenuController(view);
	}

	update(update: ViewUpdate): void {
		this.controller.update(update);
	}

	destroy(): void {
		this.controller.destroy();
	}
}

const hierarchyMenuPlugin = ViewPlugin.fromClass(HierarchyMenuPlugin);

function renderBreadcrumbs(view: EditorView, container: HTMLElement): void {
	container.replaceChildren();
	const session = getFocusSession(view.state);
	if (session === null) {
		return;
	}
	const navigationTree = buildBulletNavigationTree(
		view.state,
		view.state.facet(focusNoteTitle),
	);

	for (const [index, breadcrumb] of session.breadcrumbs.entries()) {
		const isNote = index === 0;
		const isCurrent = index === session.breadcrumbs.length - 1;
		const isAncestor = !isNote && !isCurrent;
		const isParent =
			isAncestor && index === session.breadcrumbs.length - 2;

		const previousBreadcrumb = session.breadcrumbs[index - 1];
		const previousNode =
			previousBreadcrumb === undefined
				? null
				: findNavigationNode(navigationTree, previousBreadcrumb.anchor);
		if (index > 0 && (previousNode?.children.length ?? 0) === 0) {
			const separator = container.ownerDocument.createElement('span');
			separator.className = 'bullet-zoom-breadcrumb-separator';
			separator.setAttribute('aria-hidden', 'true');
			separator.textContent = '›';
			container.append(separator);
		}

		const configureItem = (item: HTMLElement): void => {
			item.className = 'bullet-zoom-breadcrumb';
			if (isNote) {
				item.classList.add('is-note');
				item.dataset.mobileLabel = '全文';
			}
			if (isAncestor) {
				item.classList.add('is-ancestor');
			}
			if (isParent) {
				item.classList.add('is-parent');
			}

			const label = container.ownerDocument.createElement('span');
			label.className = 'bullet-zoom-breadcrumb-label';
			label.textContent = breadcrumb.label;
			item.append(label);
			item.title = breadcrumb.label;
			item.setAttribute('aria-label', breadcrumb.label);
			item.dataset.breadcrumbIndex = String(index);
		};
		const appendMenuTrigger = (): void => {
			const node = findNavigationNode(navigationTree, breadcrumb.anchor);
			if (node === null || node.children.length === 0) {
				return;
			}
			const trigger = container.ownerDocument.createElement('button');
			trigger.type = 'button';
			trigger.className = 'bullet-zoom-menu-trigger';
			trigger.classList.toggle('is-note', isNote);
			trigger.classList.toggle('is-ancestor', isAncestor);
			trigger.classList.toggle('is-parent', isParent);
			trigger.classList.toggle('is-current', isCurrent);
			trigger.dataset.breadcrumbIndex = String(index);
			trigger.setAttribute('aria-haspopup', 'menu');
			trigger.setAttribute('aria-expanded', 'false');
			trigger.setAttribute(
				'aria-label',
				`展開「${breadcrumb.label}」的下層`,
			);
			trigger.title = `展開「${breadcrumb.label}」的下層`;
			trigger.textContent = '›';
			hierarchyMenuTriggerOwners.set(trigger, view);
			trigger.addEventListener('click', () => {
				if (hierarchyMenuTriggerOwners.get(trigger) !== view) {
					return;
				}
				hierarchyMenuControllers
					.get(view)
					?.open(trigger, breadcrumb.anchor);
			});
			container.append(trigger);
		};

		if (isCurrent) {
			const current = container.ownerDocument.createElement('span');
			configureItem(current);
			current.classList.add('is-current');
			current.setAttribute('aria-current', 'location');
			container.append(current);
			appendMenuTrigger();
			continue;
		}

		const button = container.ownerDocument.createElement('button');
		configureItem(button);
		button.type = 'button';
		button.addEventListener('click', () => {
			if (breadcrumb.anchor === null) {
				exitFocus(view);
			} else {
				enterFocusAt(view, breadcrumb.anchor);
			}
			view.focus();
		});
		container.append(button);
		appendMenuTrigger();
	}
}

function createBreadcrumbContainer(
	view: EditorView,
	additionalClass?: string,
): HTMLElement {
	const container = view.dom.ownerDocument.createElement('nav');
	container.className = 'bullet-zoom-breadcrumbs';
	if (additionalClass !== undefined) {
		container.classList.add(additionalClass);
	}
	container.setAttribute('aria-label', 'Bullet 聚焦路徑');
	renderBreadcrumbs(view, container);
	return container;
}

class MobileBreadcrumbWidget extends WidgetType {
	toDOM(view: EditorView): HTMLElement {
		return createBreadcrumbContainer(
			view,
			'bullet-zoom-breadcrumbs-mobile-block',
		);
	}
}

const mobileBreadcrumbDecorations = EditorView.decorations.compute(
	[focusStateField, focusPhoneMode],
	(state) => {
		const session = state.field(focusStateField);
		if (session === null || !state.facet(focusPhoneMode)) {
			return Decoration.none;
		}

		return Decoration.set([
			Decoration.widget({
				widget: new MobileBreadcrumbWidget(),
				block: true,
				side: -1,
			}).range(session.branch.from),
		]);
	},
);

class BulletZoomBreadcrumbPanel implements Panel {
	readonly dom: HTMLElement;
	readonly top = true;

	constructor(view: EditorView) {
		this.dom = createBreadcrumbContainer(view);
	}

	update(update: ViewUpdate): void {
		if (
			update.docChanged ||
			getFocusSession(update.startState) !== getFocusSession(update.state)
		) {
			renderBreadcrumbs(update.view, this.dom);
		}
	}

	destroy(): void {
		this.dom.remove();
	}
}

const breadcrumbPanel = (view: EditorView): Panel =>
	new BulletZoomBreadcrumbPanel(view);

const breadcrumbPanelExtension = showPanel.compute(
	[focusStateField, focusPhoneMode],
	(state) =>
		state.field(focusStateField) === null || state.facet(focusPhoneMode)
			? null
			: breadcrumbPanel,
);

export function getFocusSession(state: EditorState): FocusSession | null {
	return state.field(focusStateField, false) ?? null;
}

class MobileFocusScrollPlugin implements PluginValue {
	private readonly measureKey = {};

	update(update: ViewUpdate): void {
		let request: MobileEditorScrollRequest | null = null;
		for (const transaction of update.transactions) {
			for (const effect of transaction.effects) {
				if (effect.is(mobileEditorScrollEffect)) {
					request = effect.value;
				}
			}
		}

		if (
			request === null ||
			!update.state.facet(focusPhoneMode) ||
			!matchesMobileEditorScrollRequest(update.state, request)
		) {
			return;
		}

		const requestedScroll = request;
		const requestedDoc = update.state.doc;
		const requestedFilePath = update.state.facet(focusFilePath);
		update.view.requestMeasure({
			key: this.measureKey,
			read: (view) => {
				if (
					view.state.doc !== requestedDoc ||
					view.state.facet(focusFilePath) !== requestedFilePath ||
					!view.state.facet(focusPhoneMode) ||
					!matchesMobileEditorScrollRequest(view.state, requestedScroll)
				) {
					return null;
				}

				const firstLine = view.lineBlockAt(requestedScroll.from);
				const lastLine = view.lineBlockAt(requestedScroll.to);
				const rangeHeight = lastLine.bottom - firstLine.top;
				if (requestedScroll.placement === 'start') {
					return Math.max(
						0,
						firstLine.top - MOBILE_BREADCRUMB_SCROLL_MARGIN,
					);
				}

				if (rangeHeight <= view.scrollDOM.clientHeight) {
					return Math.max(
						0,
						firstLine.top -
							(view.scrollDOM.clientHeight - rangeHeight) / 2,
					);
				}

				return requestedScroll.expectedSelection?.head === requestedScroll.to
					? Math.max(0, lastLine.bottom - view.scrollDOM.clientHeight)
					: Math.max(0, firstLine.top);
			},
			write: (scrollTop, view) => {
				if (
					scrollTop !== null &&
					view.state.doc === requestedDoc &&
					view.state.facet(focusFilePath) === requestedFilePath &&
					view.state.facet(focusPhoneMode) &&
					matchesMobileEditorScrollRequest(view.state, requestedScroll)
				) {
					view.scrollDOM.scrollTop = scrollTop;
				}
			},
		});
	}
}

const mobileFocusScrollPlugin = ViewPlugin.fromClass(MobileFocusScrollPlugin);

export function exitFocus(view: EditorView): boolean {
	if (getFocusSession(view.state) === null) {
		return false;
	}

	const selection = view.state.selection.main;
	const isPhone = view.state.facet(focusPhoneMode);
	view.dispatch({
		effects: [
			clearFocusEffect.of(),
			...(isPhone
				? [
						mobileEditorScrollEffect.of({
							from: selection.from,
							to: selection.to,
							expectedFocusAnchor: null,
							expectedSelection: {
								anchor: selection.anchor,
								head: selection.head,
							},
							placement: 'center',
						}),
					]
				: [
						EditorView.scrollIntoView(view.state.selection.main, {
							y: 'center',
						}),
					]),
		],
	});
	return true;
}

export function focusParent(view: EditorView): boolean {
	const session = getFocusSession(view.state);
	if (session === null) {
		return false;
	}

	const parent = session.breadcrumbs.at(-2);
	if (parent === undefined) {
		return false;
	}

	return parent.anchor === null
		? exitFocus(view)
		: enterFocusAt(view, parent.anchor);
}

export function resolveCodeMirrorView(candidate: unknown): EditorView | null {
	return candidate instanceof EditorView ? candidate : null;
}

export function runFocusCommand(
	view: EditorView | null,
	notify: NoticeHandler,
): boolean {
	if (view === null) {
		notify(EDITOR_VIEW_UNAVAILABLE_NOTICE);
		return false;
	}

	if (!view.state.facet(focusLivePreview)) {
		notify(LIVE_PREVIEW_REQUIRED_NOTICE);
		return false;
	}

	if (!enterFocusAt(view, view.state.selection.main.head)) {
		notify(SUPPORTED_BULLET_REQUIRED_NOTICE);
		return false;
	}

	return true;
}

export function runExitCommand(
	view: EditorView | null,
	notify: NoticeHandler,
): boolean {
	if (view === null) {
		notify(EDITOR_VIEW_UNAVAILABLE_NOTICE);
		return false;
	}

	return exitFocus(view);
}

export function runParentCommand(
	view: EditorView | null,
	notify: NoticeHandler,
): boolean {
	if (view === null) {
		notify(EDITOR_VIEW_UNAVAILABLE_NOTICE);
		return false;
	}

	return focusParent(view);
}

export function createFocusExtension({
	isPhone,
	isMobile = isPhone,
}: Readonly<{ isPhone: boolean; isMobile?: boolean }>): Extension {
	return [
		focusPhoneMode.of(isPhone),
		focusMobileMode.of(isMobile),
		focusStateField,
		hierarchyMenuPlugin,
		...(isPhone ? [mobileFocusScrollPlugin] : []),
		focusDecorations,
		mobileBreadcrumbDecorations,
		bulletMarkerPlugin,
		markerClickHandler,
		focusedPanePresentationPlugin,
		breadcrumbPanelExtension,
	];
}
