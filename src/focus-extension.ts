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
} from '@codemirror/view';

import {
	buildBreadcrumbs,
	computeBranchRange,
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

export const focusAtEffect = StateEffect.define<number>();
export const clearFocusEffect = StateEffect.define<void>();

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

function buildMarkerDecorations(view: EditorView): DecorationSet {
	if (!view.state.facet(focusLivePreview)) {
		return Decoration.none;
	}

	const ranges = [];
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
		effects: focusAtEffect.of(bullet.markerFrom),
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

		const marker = event.target.closest('.bullet-zoom-marker');
		if (marker === null || !view.dom.contains(marker)) {
			return false;
		}

		const position = view.posAtDOM(marker);
		if (!enterFocusAt(view, position, true)) {
			return false;
		}

		event.preventDefault();
		event.stopImmediatePropagation();
		view.focus();
		return true;
	},
});

class FoldIndicatorClickPlugin implements PluginValue {
	private readonly view: EditorView;
	private readonly clickHandler: (event: MouseEvent) => void;

	constructor(view: EditorView) {
		this.view = view;
		this.clickHandler = (event) => this.handleClick(event);
		view.dom.addEventListener('click', this.clickHandler, true);
	}

	destroy(): void {
		this.view.dom.removeEventListener('click', this.clickHandler, true);
	}

	private handleClick(event: MouseEvent): void {
		const elementConstructor =
			this.view.dom.ownerDocument.defaultView?.Element;
		if (
			elementConstructor === undefined ||
			!(event.target instanceof elementConstructor)
		) {
			return;
		}

		const collapseIndicator = event.target.closest('.collapse-indicator');
		const line = collapseIndicator?.closest('.cm-line');
		if (
			line === null ||
			line === undefined ||
			!this.view.contentDOM.contains(line)
		) {
			return;
		}

		const position = this.view.posAtDOM(line);
		if (!enterFocusAt(this.view, position, true)) {
			return;
		}

		event.preventDefault();
		event.stopImmediatePropagation();
		this.view.focus();
	}
}

const foldIndicatorClickPlugin = ViewPlugin.fromClass(FoldIndicatorClickPlugin);

function renderBreadcrumbs(view: EditorView, container: HTMLElement): void {
	container.replaceChildren();
	const session = getFocusSession(view.state);
	if (session === null) {
		return;
	}

	for (const [index, breadcrumb] of session.breadcrumbs.entries()) {
		if (index > 0) {
			const separator = container.ownerDocument.createElement('span');
			separator.className = 'bullet-zoom-breadcrumb-separator';
			separator.setAttribute('aria-hidden', 'true');
			separator.textContent = '›';
			container.append(separator);
		}

		const button = container.ownerDocument.createElement('button');
		button.type = 'button';
		button.className = 'bullet-zoom-breadcrumb';
		button.textContent = breadcrumb.label;
		button.title = breadcrumb.label;
		button.setAttribute('aria-label', breadcrumb.label);
		button.dataset.breadcrumbIndex = String(index);
		if (index === session.breadcrumbs.length - 1) {
			button.classList.add('is-current');
			button.setAttribute('aria-current', 'location');
		}
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

class BulletZoomBreadcrumbPanel implements Panel {
	readonly dom: HTMLElement;
	readonly top = true;

	constructor(view: EditorView) {
		this.dom = view.dom.ownerDocument.createElement('nav');
		this.dom.className = 'bullet-zoom-breadcrumbs';
		this.dom.setAttribute('aria-label', 'Bullet 聚焦路徑');
		renderBreadcrumbs(view, this.dom);
	}

	update(update: ViewUpdate): void {
		if (
			update.docChanged ||
			getFocusSession(update.startState) !== getFocusSession(update.state)
		) {
			renderBreadcrumbs(update.view, this.dom);
		}
	}
}

const breadcrumbPanel = (view: EditorView): Panel =>
	new BulletZoomBreadcrumbPanel(view);

const breadcrumbPanelExtension = showPanel.compute([focusStateField], (state) =>
	state.field(focusStateField) === null ? null : breadcrumbPanel,
);

export function getFocusSession(state: EditorState): FocusSession | null {
	return state.field(focusStateField, false) ?? null;
}

export function exitFocus(view: EditorView): boolean {
	if (getFocusSession(view.state) === null) {
		return false;
	}

	view.dispatch({
		effects: [
			clearFocusEffect.of(),
			EditorView.scrollIntoView(view.state.selection.main, { y: 'center' }),
		],
	});
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

export function createFocusExtension(): Extension {
	return [
		focusStateField,
		focusDecorations,
		bulletMarkerPlugin,
		markerClickHandler,
		foldIndicatorClickPlugin,
		breadcrumbPanelExtension,
	];
}
