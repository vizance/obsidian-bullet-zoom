import {
	EditorSelection,
	EditorState,
	Facet,
	StateEffect,
	StateField,
	type Extension,
} from '@codemirror/state';
import { foldedRanges, unfoldEffect } from '@codemirror/language';
import { isolateHistory } from '@codemirror/commands';
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
	findSupportedBullet,
	markerDetectionFacet,
	planFocusStructureRepair,
	scanStrayRange,
	planAppendChildInsertion,
	type Breadcrumb,
	type BranchRange,
	type MarkerDetection,
} from './list-structure';
import { appendHomeIcon } from './home-icon';

export const LIVE_PREVIEW_REQUIRED_NOTICE =
	'Bullet Zoom works in Live Preview mode only.';
export const SUPPORTED_BULLET_REQUIRED_NOTICE =
	'Put the cursor on a bullet first.';
export const EDITOR_VIEW_UNAVAILABLE_NOTICE =
	'Could not reach the current editor.';
export const ADD_CHILD_UNAVAILABLE_NOTICE =
	'Could not add a child bullet. Try again.';

const MOBILE_BREADCRUMB_SCROLL_MARGIN = 164;
const MOBILE_MARKER_TARGET_SIZE = 28;

export type NoticeHandler = (message: string) => void;

export type FocusSession = Readonly<{
	filePath: string;
	anchor: number;
	branch: BranchRange;
	breadcrumbs: readonly Breadcrumb[];
	visibleTo: number;
}>;

export const focusFilePath = Facet.define<string | null, string | null>({
	combine: (values) => values[values.length - 1] ?? null,
});

export const focusNoteTitle = Facet.define<string, string>({
	combine: (values) => values[values.length - 1] ?? 'Untitled note',
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

const focusNoticeHandler = Facet.define<NoticeHandler, NoticeHandler>({
	combine: (values) => values[values.length - 1] ?? (() => undefined),
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
		visibleTo: branch.to,
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
			nextNoteTitle.length === 0 ? 'Untitled note' : nextNoteTitle;
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
		const rebuilt = createFocusSession(
			transaction.state,
			mappedAnchor,
			next.filePath,
		);
		if (rebuilt === null || !transaction.docChanged) {
			return rebuilt;
		}
		const mappedVisibleTo = Math.min(
			transaction.changes.mapPos(next.visibleTo, 1),
			transaction.state.doc.length,
		);
		if (mappedVisibleTo <= rebuilt.visibleTo) {
			return rebuilt;
		}
		return Object.freeze({ ...rebuilt, visibleTo: mappedVisibleTo });
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

		const stray = scanStrayRange(state, session.anchor);
		const visibleTo = Math.max(
			session.branch.to,
			session.visibleTo,
			stray?.to ?? 0,
		);
		const ranges = [];
		if (session.branch.from > 0) {
			ranges.push(hiddenBlock.range(0, session.branch.from - 1));
		}
		if (visibleTo < state.doc.length) {
			ranges.push(hiddenBlock.range(visibleTo + 1, state.doc.length));
		}
		return Decoration.set(ranges, true);
	},
);

const markerDecoration = Decoration.mark({ class: 'bullet-zoom-marker' });

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

function buildMarkerDecorations(view: EditorView): DecorationSet {
	if (!view.state.facet(focusLivePreview)) {
		return Decoration.none;
	}

	const ranges = [];
	const folds = getActiveFoldRanges(view.state);
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

function activateBulletMarker(view: EditorView, position: number): boolean {
	const bullet = findSupportedBullet(view.state, position);
	if (bullet === null) {
		return false;
	}

	if (getFocusSession(view.state)?.anchor === bullet.markerFrom) {
		return focusParent(view);
	}

	return enterFocusAt(view, bullet.markerFrom, true);
}

type MarkerTargetRect = Readonly<{
	left: number;
	right: number;
	top: number;
	bottom: number;
}>;

function isValidMarkerTargetRect(rect: MarkerTargetRect): boolean {
	return (
		Number.isFinite(rect.left) &&
		Number.isFinite(rect.right) &&
		Number.isFinite(rect.top) &&
		Number.isFinite(rect.bottom) &&
		rect.right > rect.left &&
		rect.bottom > rect.top
	);
}

function resolveExactBulletMarker(
	view: EditorView,
	marker: HTMLElement | null,
): number | null {
	if (marker === null || !marker.isConnected || !view.dom.contains(marker)) {
		return null;
	}
	const line = marker.closest<HTMLElement>('.cm-line');
	if (line === null || line === marker) {
		return null;
	}
	const markers = line.querySelectorAll<HTMLElement>('.bullet-zoom-marker');
	if (markers.length !== 1 || markers[0] !== marker) {
		return null;
	}

	try {
		const markerPosition = view.posAtDOM(marker);
		const bullet = findSupportedBullet(view.state, markerPosition);
		return bullet?.markerFrom === markerPosition ? markerPosition : null;
	} catch {
		return null;
	}
}

function resolveExpandedMobileMarker(
	view: EditorView,
	event: MouseEvent,
	target: HTMLElement,
): number | null {
	if (
		!view.state.facet(focusMobileMode) ||
		!Number.isFinite(event.clientX) ||
		!Number.isFinite(event.clientY)
	) {
		return null;
	}

	const line = target.closest<HTMLElement>('.cm-line');
	if (line === null || !line.isConnected || !view.dom.contains(line)) {
		return null;
	}
	const markers = line.querySelectorAll<HTMLElement>('.bullet-zoom-marker');
	if (markers.length !== 1) {
		return null;
	}
	const marker = markers[0];
	if (marker === undefined || !marker.isConnected || !line.contains(marker)) {
		return null;
	}

	try {
		const markerPosition = view.posAtDOM(marker);
		const bullet = findSupportedBullet(view.state, markerPosition);
		if (bullet === null || bullet.markerFrom !== markerPosition) {
			return null;
		}
		const lineRect = line.getBoundingClientRect();
		const markerRect = marker.getBoundingClientRect();
		const contentRect = view.coordsAtPos(bullet.contentFrom);
		if (
			!isValidMarkerTargetRect(lineRect) ||
			!isValidMarkerTargetRect(markerRect) ||
			contentRect === null ||
			!Number.isFinite(contentRect.left) ||
			!Number.isFinite(contentRect.right)
		) {
			return null;
		}

		const halfTarget = MOBILE_MARKER_TARGET_SIZE / 2;
		const markerCenterX = (markerRect.left + markerRect.right) / 2;
		const markerCenterY = (markerRect.top + markerRect.bottom) / 2;
		const contentX = (contentRect.left + contentRect.right) / 2;
		if (markerCenterX === contentX) {
			return null;
		}

		let targetLeft = Math.max(lineRect.left, markerCenterX - halfTarget);
		let targetRight = Math.min(lineRect.right, markerCenterX + halfTarget);
		const targetTop = Math.max(lineRect.top, markerCenterY - halfTarget);
		const targetBottom = Math.min(lineRect.bottom, markerCenterY + halfTarget);
		const markerPrecedesContent = markerCenterX < contentX;
		if (markerPrecedesContent) {
			targetRight = Math.min(targetRight, contentX);
		} else {
			targetLeft = Math.max(targetLeft, contentX);
		}

		const insideHorizontalTarget =
			event.clientX >= targetLeft && event.clientX <= targetRight;
		const beforeEditableContent = markerPrecedesContent
			? event.clientX < contentX
			: event.clientX > contentX;
		if (
			targetRight <= targetLeft ||
			targetBottom <= targetTop ||
			!insideHorizontalTarget ||
			!beforeEditableContent ||
			event.clientY < targetTop ||
			event.clientY > targetBottom
		) {
			return null;
		}
		return bullet.markerFrom;
	} catch {
		return null;
	}
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
		const marker = event.target.closest<HTMLElement>('.bullet-zoom-marker');
		const exactPosition = resolveExactBulletMarker(view, marker);
		if (
			exactPosition === null &&
			event.target.closest('.collapse-indicator') !== null
		) {
			return false;
		}
		const position =
			exactPosition ?? resolveExpandedMobileMarker(view, event, event.target);
		if (position === null) {
			return false;
		}

		if (!activateBulletMarker(view, position)) {
			return false;
		}

		event.preventDefault();
		event.stopImmediatePropagation();
		view.focus();
		return true;
	},
});

const FOCUSED_PANE_CLASS = 'bullet-zoom-pane-is-focused';
const PHONE_PANE_CLASS = 'bullet-zoom-phone-pane';

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
		this.pane?.classList.remove(PHONE_PANE_CLASS);
		this.pane = null;
	}

	private sync(view: EditorView): void {
		const nextPane = view.dom.closest<HTMLElement>('.markdown-source-view');
		if (nextPane !== this.pane) {
			this.pane?.classList.remove(FOCUSED_PANE_CLASS);
			this.pane?.classList.remove(PHONE_PANE_CLASS);
			this.pane = nextPane;
		}
		this.pane?.classList.toggle(
			FOCUSED_PANE_CLASS,
			getFocusSession(view.state) !== null,
		);
		this.pane?.classList.toggle(
			PHONE_PANE_CLASS,
			view.state.facet(focusPhoneMode),
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
			}
			if (isAncestor) {
				item.classList.add('is-ancestor');
			}
			if (isParent) {
				item.classList.add('is-parent');
			}

			if (isNote) {
				appendHomeIcon(item);
				item.title = 'Back to full note';
				item.setAttribute('aria-label', 'Back to full note');
			} else {
				const label = container.ownerDocument.createElement('span');
				label.className = 'bullet-zoom-breadcrumb-label';
				label.textContent = breadcrumb.label;
				item.append(label);
				item.title = breadcrumb.label;
				item.setAttribute('aria-label', breadcrumb.label);
			}
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
	container.setAttribute('aria-label', 'Bullet focus path');
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

class EmptyFocusRootWidget extends WidgetType {
	eq(other: EmptyFocusRootWidget): boolean {
		return other instanceof EmptyFocusRootWidget;
	}

	toDOM(view: EditorView): HTMLElement {
		const placeholder = view.dom.ownerDocument.createElement('span');
		placeholder.className = 'bullet-zoom-focus-root-placeholder';
		placeholder.textContent = 'Untitled bullet';
		return placeholder;
	}
}

class FocusPageFooterWidget extends WidgetType {
	constructor(
		private readonly anchor: number,
		private readonly label: string,
	) {
		super();
	}

	eq(other: FocusPageFooterWidget): boolean {
		return other.anchor === this.anchor && other.label === this.label;
	}

	toDOM(view: EditorView): HTMLElement {
		const document = view.dom.ownerDocument;
		const footer = document.createElement('section');
		footer.className = 'bullet-zoom-focus-page-footer';
		footer.dataset.focusAnchor = String(this.anchor);

		const addChild = document.createElement('button');
		addChild.className = 'bullet-zoom-add-child';
		addChild.type = 'button';
		addChild.textContent = '＋';
		addChild.title = `Add a child bullet under ${this.label}`;
		addChild.setAttribute(
			'aria-label',
			`Add a child bullet under ${this.label}`,
		);
		addChild.addEventListener('click', () => {
			if (
				!addChild.isConnected ||
				getFocusSession(view.state)?.anchor !== this.anchor
			) {
				view.state.facet(focusNoticeHandler)(ADD_CHILD_UNAVAILABLE_NOTICE);
				return;
			}
			appendDirectChild(view, view.state.facet(focusNoticeHandler));
		});

		footer.append(addChild);
		return footer;
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
				side: -2,
			}).range(session.branch.from),
		]);
	},
);

const focusRootLineDecoration = Decoration.line({
	class: 'bullet-zoom-focus-root-line',
});
const hiddenFocusRootPrefix = Decoration.replace({});
const MAX_REBASED_DEPTH = 8;
const rebasedLineDecorations = Array.from(
	{ length: MAX_REBASED_DEPTH },
	(_, index) =>
		Decoration.line({
			class: 'bullet-zoom-rebased-line',
			attributes: {
				style: `--bullet-zoom-relative-depth: ${index + 1};`,
			},
		}),
);
const hiddenRebasedIndent = Decoration.replace({});

const focusPageDecorations = EditorView.decorations.compute(
	[focusStateField],
	(state) => {
		const session = state.field(focusStateField);
		if (session === null) {
			return Decoration.none;
		}

		const bullet = findSupportedBullet(state, session.anchor);
		if (bullet === null) {
			return Decoration.none;
		}
		const label = session.breadcrumbs.at(-1)?.label ?? 'Untitled bullet';
		const ranges = [
			focusRootLineDecoration.range(bullet.lineFrom),
			hiddenFocusRootPrefix.range(bullet.lineFrom, bullet.contentFrom),
			Decoration.widget({
				widget: new FocusPageFooterWidget(session.anchor, label),
				block: true,
				side: 1,
			}).range(session.branch.to),
		];
		if (bullet.label.length === 0) {
			ranges.push(
				Decoration.widget({
					widget: new EmptyFocusRootWidget(),
					side: 1,
				}).range(bullet.lineTo),
			);
		}

		const doc = state.doc;
		const rootLineNumber = doc.lineAt(bullet.lineFrom).number;
		const lastLineNumber = doc.lineAt(session.branch.to).number;
		const childBullets: Array<{
			lineFrom: number;
			markerFrom: number;
			indent: number;
		}> = [];
		const indentColumns: number[] = [];
		for (
			let lineNumber = rootLineNumber + 1;
			lineNumber <= lastLineNumber;
			lineNumber += 1
		) {
			const line = doc.line(lineNumber);
			const child = findSupportedBullet(state, line.from);
			if (
				child === null ||
				child.lineFrom !== line.from ||
				child.indent <= bullet.indent
			) {
				continue;
			}
			childBullets.push({
				lineFrom: child.lineFrom,
				markerFrom: child.markerFrom,
				indent: child.indent,
			});
			if (!indentColumns.includes(child.indent)) {
				indentColumns.push(child.indent);
			}
		}
		indentColumns.sort((left, right) => left - right);
		for (const child of childBullets) {
			const depth = Math.min(
				indentColumns.indexOf(child.indent) + 1,
				MAX_REBASED_DEPTH,
			);
			const rebasedDecoration = rebasedLineDecorations[depth - 1];
			if (rebasedDecoration === undefined) {
				continue;
			}
			ranges.push(rebasedDecoration.range(child.lineFrom));
			if (child.markerFrom > child.lineFrom) {
				ranges.push(
					hiddenRebasedIndent.range(child.lineFrom, child.markerFrom),
				);
			}
		}
		return Decoration.set(ranges, true);
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

export function appendDirectChild(
	view: EditorView,
	notify: NoticeHandler,
): boolean {
	const session = getFocusSession(view.state);
	if (
		!view.dom.isConnected ||
		session === null ||
		view.state.facet(focusFilePath) !== session.filePath
	) {
		notify(ADD_CHILD_UNAVAILABLE_NOTICE);
		return false;
	}

	const plan = planAppendChildInsertion(view.state, session.anchor);
	if (plan.status !== 'ready') {
		notify(ADD_CHILD_UNAVAILABLE_NOTICE);
		return false;
	}

	view.dispatch({
		changes: { from: plan.insertAt, insert: plan.insertText },
		selection: EditorSelection.cursor(plan.cursorAt),
		annotations: isolateHistory.of('full'),
	});
	view.focus();
	return true;
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

const STRAY_REPAIR_DELAY_MS = 600;

const focusAutoFix = Facet.define<boolean, boolean>({
	combine: (values) => values.at(0) ?? false,
});

class StrayLineRepairPlugin implements PluginValue {
	private timer: number | null = null;
	private timerWindow: Window | null = null;

	constructor(private readonly view: EditorView) {}

	update(update: ViewUpdate): void {
		if (!update.docChanged) {
			return;
		}
		if (
			!update.state.facet(focusAutoFix) ||
			getFocusSession(update.state) === null
		) {
			this.cancel();
			return;
		}
		this.schedule();
	}

	destroy(): void {
		this.cancel();
	}

	private cancel(): void {
		if (this.timer !== null) {
			this.timerWindow?.clearTimeout(this.timer);
		}
		this.timer = null;
		this.timerWindow = null;
	}

	private schedule(): void {
		this.cancel();
		const window = this.view.dom.ownerDocument.defaultView;
		if (window === null || window === undefined) {
			return;
		}
		this.timerWindow = window;
		this.timer = window.setTimeout(() => {
			this.timer = null;
			this.timerWindow = null;
			this.repair();
		}, STRAY_REPAIR_DELAY_MS);
	}

	private repair(): void {
		const session = getFocusSession(this.view.state);
		if (session === null || !this.view.state.facet(focusAutoFix)) {
			return;
		}
		const change = planFocusStructureRepair(
			this.view.state,
			session.anchor,
			session.visibleTo,
		);
		if (change === null) {
			return;
		}
		this.view.dispatch({
			changes: change,
			annotations: isolateHistory.of('before'),
		});
	}
}

const strayLineRepairPlugin = ViewPlugin.fromClass(StrayLineRepairPlugin);

export function createFocusExtension({
	isPhone,
	isMobile,
	markerDetection,
	autoFixStrayLines = false,
	onEditorReady,
	onEditorUpdate,
	onEditorDestroy,
	notify = () => undefined,
}: Readonly<{
	isPhone: boolean;
	isMobile: boolean;
	markerDetection?: MarkerDetection;
	autoFixStrayLines?: boolean;
	onEditorReady?: (view: EditorView) => void;
	onEditorUpdate?: (update: ViewUpdate) => void;
	onEditorDestroy?: (view: EditorView) => void;
	notify?: NoticeHandler;
}>): Extension {
	const sidebarBridge = ViewPlugin.define((view) => {
		onEditorReady?.(view);
		return {
			update: (update: ViewUpdate) => onEditorUpdate?.(update),
			destroy: () => onEditorDestroy?.(view),
		};
	});
	return [
		...(markerDetection !== undefined
			? [markerDetectionFacet.of(markerDetection)]
			: []),
		focusAutoFix.of(autoFixStrayLines),
		strayLineRepairPlugin,
		focusPhoneMode.of(isPhone),
		focusMobileMode.of(isMobile),
		focusNoticeHandler.of(notify),
		focusStateField,
		...(isPhone ? [mobileFocusScrollPlugin] : []),
		focusDecorations,
		mobileBreadcrumbDecorations,
		focusPageDecorations,
		bulletMarkerPlugin,
		markerClickHandler,
		focusedPanePresentationPlugin,
		sidebarBridge,
		breadcrumbPanelExtension,
	];
}
