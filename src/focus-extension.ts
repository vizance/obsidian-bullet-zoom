import {
	EditorSelection,
	EditorState,
	Facet,
	StateEffect,
	StateField,
	type Extension,
} from '@codemirror/state';
import { foldedRanges, unfoldEffect } from '@codemirror/language';
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
	computeBranchRange,
	displayBulletLabel,
	findSupportedBullet,
	type Breadcrumb,
	type BranchRange,
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

const rowControlsAlwaysVisible = Facet.define<boolean, boolean>({
	combine: (values) => values[values.length - 1] ?? true,
});

const setRowControlsAlwaysVisibleEffect = StateEffect.define<boolean>();

const rowControlsAlwaysVisibleField = StateField.define<boolean>({
	create: (state) => state.facet(rowControlsAlwaysVisible),
	update: (current, transaction) => {
		for (const effect of transaction.effects) {
			if (effect.is(setRowControlsAlwaysVisibleEffect)) {
				return effect.value;
			}
		}
		return current;
	},
});

const activeRowControlViews = new WeakSet<EditorView>();
const ROW_CONTROLS_ALWAYS_CLASS =
	'bullet-zoom-row-controls-always-visible';
const ROW_CONTROLS_HOVER_CLASS = 'bullet-zoom-row-controls-hover-only';
const ROW_CONTROL_TOUCH_ACTIVE_CLASS =
	'bullet-zoom-row-control-touch-active';

const setTouchActiveRowEffect = StateEffect.define<number | null>();

const touchActiveRowField = StateField.define<number | null>({
	create: () => null,
	update: (current, transaction) => {
		let next = current;
		for (const effect of transaction.effects) {
			if (effect.is(setTouchActiveRowEffect)) {
				next = effect.value;
			} else if (
				effect.is(setRowControlsAlwaysVisibleEffect) &&
				effect.value
			) {
				next = null;
			}
		}

		if (next === null) {
			return null;
		}
		const mapped = transaction.docChanged
			? transaction.changes.mapPos(next, 1)
			: next;
		const bullet = findSupportedBullet(transaction.state, mapped);
		return bullet?.markerFrom === mapped ? mapped : null;
	},
});

class RowControlVisibilityPlugin implements PluginValue {
	constructor(private readonly view: EditorView) {
		activeRowControlViews.add(view);
	}

	destroy(): void {
		activeRowControlViews.delete(this.view);
	}
}

const rowControlVisibilityPlugin = ViewPlugin.fromClass(
	RowControlVisibilityPlugin,
);

const rowControlVisibilityAttributes = EditorView.editorAttributes.compute(
	[rowControlsAlwaysVisibleField],
	(state) => ({
		class: state.field(rowControlsAlwaysVisibleField)
			? ROW_CONTROLS_ALWAYS_CLASS
			: ROW_CONTROLS_HOVER_CLASS,
	}),
);

const touchActiveRowDecoration = Decoration.line({
	class: ROW_CONTROL_TOUCH_ACTIVE_CLASS,
});

const touchActiveRowDecorations = EditorView.decorations.compute(
	[touchActiveRowField, rowControlsAlwaysVisibleField, focusMobileMode],
	(state) => {
		const anchor = state.field(touchActiveRowField);
		if (
			anchor === null ||
			!state.facet(focusMobileMode) ||
			state.field(rowControlsAlwaysVisibleField)
		) {
			return Decoration.none;
		}
		const bullet = findSupportedBullet(state, anchor);
		return bullet?.markerFrom === anchor
			? Decoration.set([
					touchActiveRowDecoration.range(bullet.lineFrom),
				])
			: Decoration.none;
	},
);

const touchRowPointerHandler = EditorView.domEventHandlers({
	pointerdown: (event, view) => {
		if (
			event.pointerType !== 'touch' ||
			!view.state.facet(focusMobileMode) ||
			view.state.field(rowControlsAlwaysVisibleField)
		) {
			return false;
		}
		const HTMLElementConstructor =
			view.dom.ownerDocument.defaultView?.HTMLElement;
		if (
			HTMLElementConstructor === undefined ||
			!(event.target instanceof HTMLElementConstructor) ||
			event.target.closest('.bullet-zoom-row-control') !== null ||
			event.target.closest('.collapse-indicator') !== null
		) {
			return false;
		}

		const line = event.target.closest<HTMLElement>('.cm-line');
		let nextAnchor: number | null = null;
		if (line !== null && view.dom.contains(line)) {
			const bullet = findSupportedBullet(view.state, view.posAtDOM(line));
			nextAnchor = bullet?.markerFrom ?? null;
		}
		if (view.state.field(touchActiveRowField) !== nextAnchor) {
			view.dispatch({ effects: setTouchActiveRowEffect.of(nextAnchor) });
		}
		return false;
	},
});

export function setRowControlsAlwaysVisible(
	view: EditorView,
	value: boolean,
): boolean {
	if (!activeRowControlViews.has(view)) {
		return false;
	}
	view.dispatch({ effects: setRowControlsAlwaysVisibleEffect.of(value) });
	return true;
}

export function setRowControlsAlwaysVisibleForViews(
	views: Iterable<EditorView | null>,
	value: boolean,
): number {
	let updated = 0;
	for (const view of views) {
		if (view !== null && setRowControlsAlwaysVisible(view, value)) {
			updated += 1;
		}
	}
	return updated;
}

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
type BulletRowControlMode = 'enter' | 'parent';
type BulletRowControlOwner = Readonly<{
	view: EditorView;
	mode: BulletRowControlMode;
}>;
const rowControlOwners = new WeakMap<HTMLElement, BulletRowControlOwner>();

type ActiveFoldRange = Readonly<{ from: number; to: number }>;

function getActiveFoldRanges(state: EditorState): readonly ActiveFoldRange[] {
	const ranges: ActiveFoldRange[] = [];
	foldedRanges(state).between(0, state.doc.length, (from, to) => {
		ranges.push(Object.freeze({ from, to }));
	});
	return ranges;
}

function isPositionReplacedByFold(
	position: number,
	folds: readonly ActiveFoldRange[],
): boolean {
	return folds.some(({ from, to }) => from <= position && position < to);
}

class BulletRowControlWidget extends WidgetType {
	constructor(
		private readonly label: string,
		private readonly mode: BulletRowControlMode,
		private readonly previousLevelLabel: string | null,
	) {
		super();
	}

	eq(other: BulletRowControlWidget): boolean {
		return (
			this.label === other.label &&
			this.mode === other.mode &&
			this.previousLevelLabel === other.previousLevelLabel
		);
	}

	ignoreEvent(): boolean {
		return true;
	}

	toDOM(view: EditorView): HTMLElement {
		const button = view.dom.ownerDocument.createElement('button');
		const label = displayBulletLabel(this.label);
		button.type = 'button';
		button.className = `bullet-zoom-row-control bullet-zoom-${this.mode}-control`;
		rowControlOwners.set(button, { view, mode: this.mode });
		const accessibleLabel =
			this.mode === 'parent'
				? `回到上一層「${this.previousLevelLabel ?? '全文'}」`
				: `聚焦「${label}」`;
		button.title = accessibleLabel;
		button.setAttribute('aria-label', accessibleLabel);
		button.addEventListener('click', (event) => {
			if (!activateBulletRowControl(view, button, this.mode)) {
				return;
			}
			event.preventDefault();
			event.stopImmediatePropagation();
			view.focus();
		});

		const icon = button.ownerDocument.createElement('span');
		icon.className = 'bullet-zoom-row-icon';
		icon.setAttribute('aria-hidden', 'true');
		icon.textContent = this.mode === 'parent' ? '↖' : '↘';
		button.append(icon);
		return button;
	}
}

function buildMarkerDecorations(view: EditorView): DecorationSet {
	if (!view.state.facet(focusLivePreview)) {
		return Decoration.none;
	}

	const ranges = [];
	const folds = getActiveFoldRanges(view.state);
	const focusSession = getFocusSession(view.state);
	const focusAnchor = focusSession?.anchor ?? null;
	const previousLevelLabel =
		focusSession?.breadcrumbs.at(-2)?.label ?? null;
	const visitedLines = new Set<number>();
	for (const visibleRange of view.visibleRanges) {
		let line = view.state.doc.lineAt(visibleRange.from);
		while (line.from <= visibleRange.to) {
			if (!visitedLines.has(line.number)) {
				visitedLines.add(line.number);
				const bullet = findSupportedBullet(view.state, line.from);
					if (
						bullet !== null &&
						!isPositionReplacedByFold(bullet.markerFrom, folds)
					) {
					ranges.push(
						markerDecoration.range(bullet.markerFrom, bullet.markerTo),
					);
					ranges.push(
						Decoration.widget({
							widget: new BulletRowControlWidget(
								bullet.label,
								bullet.markerFrom === focusAnchor ? 'parent' : 'enter',
								bullet.markerFrom === focusAnchor
									? previousLevelLabel
									: null,
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
				update.viewportChanged ||
				foldedRanges(update.startState) !== foldedRanges(update.state) ||
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

function targetFoldEffects(
	state: EditorState,
	position: number,
): Array<StateEffect<unknown>> {
	const bullet = findSupportedBullet(state, position);
	const branch = computeBranchRange(state, position);
	if (bullet === null || branch === null) {
		return [];
	}

	const effects: Array<StateEffect<unknown>> = [];
	foldedRanges(state).between(
		0,
		branch.to,
		(from, to) => {
			if (
				(from < bullet.markerFrom && to > bullet.markerFrom) ||
				(from >= bullet.lineFrom &&
					from <= bullet.lineTo &&
					to <= branch.to)
			) {
				effects.push(unfoldEffect.of({ from, to }));
			}
		},
	);
	return effects;
}

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
		...(moveSelectionToLineEnd
			? { selection: EditorSelection.cursor(bullet.lineTo) }
			: {}),
		effects: [
			...targetFoldEffects(view.state, bullet.markerFrom),
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

function activateBulletRowControl(
	view: EditorView,
	control: HTMLElement,
	mode: BulletRowControlMode,
): boolean {
	const owner = rowControlOwners.get(control);
	if (
		owner?.view !== view ||
		owner.mode !== mode ||
		!control.isConnected ||
		!view.dom.contains(control)
	) {
		return false;
	}

	const position = view.posAtDOM(control);
	if (mode === 'parent') {
		const session = getFocusSession(view.state);
		const bullet = findSupportedBullet(view.state, position);
		return (
			session !== null &&
			bullet !== null &&
			bullet.markerFrom === session.anchor &&
			focusParent(view)
		);
	}

	return enterFocusAt(view, position, true);
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

		if (event.target.closest('.bullet-zoom-row-control') !== null) {
			return false;
		}
		if (
			view.state.facet(focusMobileMode) &&
			!view.state.field(rowControlsAlwaysVisibleField)
		) {
			return false;
		}
		const marker = event.target.closest<HTMLElement>('.bullet-zoom-marker');
		if (marker === null || !view.dom.contains(marker)) {
			return false;
		}

		if (!enterFocusAt(view, view.posAtDOM(marker), true)) {
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

function renderBreadcrumbs(view: EditorView, container: HTMLElement): void {
	container.replaceChildren();
	const session = getFocusSession(view.state);
	if (session === null) {
		return;
	}

	for (const [index, breadcrumb] of session.breadcrumbs.entries()) {
		const isNote = index === 0;
		const isCurrent = index === session.breadcrumbs.length - 1;
		const isAncestor = !isNote && !isCurrent;
		const isParent =
			isAncestor && index === session.breadcrumbs.length - 2;

		if (index > 0) {
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
		if (isCurrent) {
			const current = container.ownerDocument.createElement('span');
			configureItem(current);
			current.classList.add('is-current');
			current.setAttribute('aria-current', 'location');
			container.append(current);
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
	isMobile,
	alwaysShowRowControls = true,
	onEditorReady,
	onEditorUpdate,
	onEditorDestroy,
}: Readonly<{
	isPhone: boolean;
	isMobile: boolean;
	alwaysShowRowControls?: boolean;
	onEditorReady?: (view: EditorView) => void;
	onEditorUpdate?: (update: ViewUpdate) => void;
	onEditorDestroy?: (view: EditorView) => void;
}>): Extension {
	const sidebarBridge = ViewPlugin.define((view) => {
		onEditorReady?.(view);
		return {
			update: (update: ViewUpdate) => onEditorUpdate?.(update),
			destroy: () => onEditorDestroy?.(view),
		};
	});
	return [
		focusPhoneMode.of(isPhone),
		focusMobileMode.of(isMobile),
		rowControlsAlwaysVisible.of(alwaysShowRowControls),
		rowControlsAlwaysVisibleField,
		touchActiveRowField,
		rowControlVisibilityAttributes,
		touchActiveRowDecorations,
		rowControlVisibilityPlugin,
		focusStateField,
		...(isPhone ? [mobileFocusScrollPlugin] : []),
		focusDecorations,
		mobileBreadcrumbDecorations,
		bulletMarkerPlugin,
		touchRowPointerHandler,
		markerClickHandler,
		focusedPanePresentationPlugin,
		sidebarBridge,
		breadcrumbPanelExtension,
	];
}
