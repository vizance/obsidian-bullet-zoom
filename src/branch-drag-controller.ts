import { countColumn, type EditorState } from '@codemirror/state';

import {
	candidateIndents,
	planBranchDrop,
	resolveDropGap,
	type BranchDropPlan,
	type DropGap,
} from './branch-drop-plan';

/** Shared with the outline sidebar so both drag gestures feel the same. */
/** Matches the radial menu's press-cancel distance, so one gesture ends as the other begins. */
export const DRAG_START_DISTANCE_PX = 12;


export const DRAGGING_CLASS = 'bullet-zoom-branch-dragging';
export const INDICATOR_CLASS = 'bullet-zoom-branch-drop-indicator';
/** Put on the window body so every pane hides its caret, not just the source. */
export const DRAG_ACTIVE_CLASS = 'bullet-zoom-branch-drag-active';
export const DRAG_SOURCE_CLASS = 'bullet-zoom-branch-drag-source';
/**
 * The indicator has to move with the pointer, and Obsidian plugins should not
 * write plain inline styles. Custom properties keep the real declarations in
 * styles.css where a theme can still override them.
 */
export const DROP_LEFT_PROPERTY = '--bullet-zoom-drop-left';
export const DROP_TOP_PROPERTY = '--bullet-zoom-drop-top';

export type LineGeometry = Readonly<{
	top: number;
	bottom: number;
	left: number;
}>;

/**
 * One editor the pointer can currently be over. The controller never touches
 * Obsidian or CodeMirror directly; everything it needs about a target arrives
 * through this shape, so the gesture can be driven from a test.
 */
export interface DragTarget {
	/** Identity used to tell one editor from another. */
	readonly key: unknown;
	readonly state: EditorState;
	readonly writable: boolean;
	readonly sameDocumentAsSource: boolean;
	/** False for an editor in an Obsidian popout window. */
	readonly sameWindowAsSource: boolean;
	readonly focusRange: Readonly<{ from: number; to: number }> | null;
	readonly indicatorHost: HTMLElement;
	posAtCoords(x: number, y: number): number | null;
	lineGeometry(position: number): LineGeometry | null;
	/** Width of a single indent column, measured in the target editor. */
	columnWidthPx(): number;
}

export type DropPreview = Readonly<{
	target: DragTarget;
	gap: DropGap;
	candidates: readonly string[];
	indent: string;
	indicatorTop: number;
	indicatorLeft: number;
}>;

/**
 * The legal indent whose column lands closest to the pointer. Ties go to the
 * shallower indent, so drifting right is what deepens a drop, never noise.
 */
export function chooseIndent(
	candidates: readonly string[],
	state: EditorState,
	lineLeft: number,
	columnWidth: number,
	pointerX: number,
): string | null {
	let best: string | null = null;
	let bestDistance = Number.POSITIVE_INFINITY;
	for (const indent of candidates) {
		const columns = countColumn(indent, state.tabSize);
		const distance = Math.abs(pointerX - (lineLeft + columns * columnWidth));
		if (distance < bestDistance) {
			best = indent;
			bestDistance = distance;
		}
	}
	return best;
}

export interface BranchDragEnvironment {
	/** The document position of the marker the gesture started on. */
	sourceAnchorAt(marker: HTMLElement): number | null;
	sourceState(): EditorState;
	/** The editor under the given screen coordinates, if any. */
	resolveTarget(x: number, y: number): DragTarget | null;
	applyPlan(plan: BranchDropPlan, target: DragTarget): void;
	/** Tints the rows being carried, so the user sees what travels with them. */
	setSourceHighlighted(highlighted: boolean, anchor: number): void;
}

/**
 * Turns a pointer position into the gap, indent and indicator geometry the drop
 * would use. Candidates are only recomputed when the gap itself changes, so
 * sliding sideways inside one gap stays cheap on a long document.
 */
export function computeDropPreview(
	target: DragTarget,
	pointerX: number,
	pointerY: number,
	previous: DropPreview | null,
): DropPreview | null {
	if (!target.writable || !target.sameWindowAsSource) {
		return null;
	}
	const position = target.posAtCoords(pointerX, pointerY);
	if (position === null) {
		return null;
	}
	const geometry = target.lineGeometry(position);
	if (geometry === null) {
		return null;
	}
	const half =
		pointerY < (geometry.top + geometry.bottom) / 2 ? 'upper' : 'lower';
	const gap = resolveDropGap(target.state, position, half);
	if (gap === null) {
		return null;
	}
	const reusable =
		previous !== null &&
		previous.target.key === target.key &&
		previous.gap.insertAt === gap.insertAt &&
		(previous.gap.above?.lineFrom ?? null) === (gap.above?.lineFrom ?? null);
	const candidates = reusable
		? previous.candidates
		: candidateIndents(target.state, gap);
	const columnWidth = target.columnWidthPx();
	const indent = chooseIndent(
		candidates,
		target.state,
		geometry.left,
		columnWidth,
		pointerX,
	);
	if (indent === null) {
		return null;
	}
	return Object.freeze({
		target,
		gap,
		candidates,
		indent,
		indicatorTop: half === 'upper' ? geometry.top : geometry.bottom,
		indicatorLeft:
			geometry.left +
			countColumn(indent, target.state.tabSize) * columnWidth,
	});
}

export function renderDropIndicator(
	previous: HTMLElement | null,
	preview: DropPreview | null,
): HTMLElement | null {
	if (preview === null) {
		previous?.remove();
		return null;
	}
	const host = preview.target.indicatorHost;
	const indicator =
		previous !== null && previous.parentElement === host
			? previous
			: host.ownerDocument.createElement('div');
	if (indicator !== previous) {
		previous?.remove();
		indicator.className = INDICATOR_CLASS;
		host.append(indicator);
	}
	const hostRect = host.getBoundingClientRect();
	indicator.style.setProperty(
		DROP_LEFT_PROPERTY,
		`${preview.indicatorLeft - hostRect.left}px`,
	);
	indicator.style.setProperty(
		DROP_TOP_PROPERTY,
		`${preview.indicatorTop - hostRect.top}px`,
	);
	return indicator;
}

export interface BranchDragGesture {
	pointerDown(event: PointerEvent, sourceAnchorPosition: number): void;
	pointerMove(event: PointerEvent): void;
	/** Returns true when the release ended a drag and must not also click. */
	pointerUp(event: PointerEvent): boolean;
	pointerCancel(event: PointerEvent): void;
	isDragging(): boolean;
	dispose(): void;
}

/**
 * The gesture on its own, with no event listeners of its own, so the plugin
 * that already owns marker pointer events can drive it instead of a second
 * listener racing the first one.
 */
export function createBranchDragGesture(
	dom: HTMLElement,
	environment: BranchDragEnvironment,
): BranchDragGesture {
	const window = dom.ownerDocument.defaultView;
	let pointerId: number | null = null;
	let sourceAnchor: number | null = null;
	let startX = 0;
	let startY = 0;
	let dragging = false;
	let preview: DropPreview | null = null;
	let indicator: HTMLElement | null = null;
	let scrollLocks: { element: Element; top: number; left: number }[] = [];
	let lockedWindowX = 0;
	let lockedWindowY = 0;

	/**
	 * Which element actually scrolls differs between the desktop and mobile
	 * layouts, so every ancestor is held rather than one guessed container.
	 * Writing scrollTop on an element that cannot scroll does nothing.
	 */
	const collectScrollLocks = (): void => {
		const locks: { element: Element; top: number; left: number }[] = [];
		const scroller = dom.querySelector<HTMLElement>('.cm-scroller');
		if (scroller !== null) {
			locks.push({
				element: scroller,
				top: scroller.scrollTop,
				left: scroller.scrollLeft,
			});
		}
		let node: Element | null = dom;
		while (node !== null) {
			locks.push({
				element: node,
				top: node.scrollTop,
				left: node.scrollLeft,
			});
			node = node.parentElement;
		}
		scrollLocks = locks;
		lockedWindowX = window?.scrollX ?? 0;
		lockedWindowY = window?.scrollY ?? 0;
	};

	const holdScroll = (): void => {
		// iOS keeps scrolling a gesture it has already claimed, whatever the
		// pointer handler returns, so every position is put back by hand.
		for (const lock of scrollLocks) {
			if (lock.element.scrollTop !== lock.top) {
				lock.element.scrollTop = lock.top;
			}
			if (lock.element.scrollLeft !== lock.left) {
				lock.element.scrollLeft = lock.left;
			}
		}
		if (
			scrollLocks.length > 0 &&
			window !== null &&
			window !== undefined &&
			(window.scrollX !== lockedWindowX || window.scrollY !== lockedWindowY)
		) {
			window.scrollTo(lockedWindowX, lockedWindowY);
		}
	};

	const reset = (): void => {
		if (dragging) {
			dom.classList.remove(DRAGGING_CLASS);
			dom.ownerDocument.body.classList.remove(DRAG_ACTIVE_CLASS);
			environment.setSourceHighlighted(false, sourceAnchor ?? 0);
		}
		scrollLocks = [];
		preview = null;
		indicator = renderDropIndicator(indicator, null);
		dragging = false;
		pointerId = null;
		sourceAnchor = null;
	};

	const beginDrag = (): void => {
		dragging = true;
		collectScrollLocks();
		if (sourceAnchor !== null) {
			environment.setSourceHighlighted(true, sourceAnchor);
		}
		dom.classList.add(DRAGGING_CLASS);
		// Styling only. Blurring the editor would dismiss the on-screen keyboard,
		// and the viewport change reflows the note under the finger mid-drag.
		dom.ownerDocument.body.classList.add(DRAG_ACTIVE_CLASS);
	};

	return {
		pointerDown(event, sourceAnchorPosition) {
			// Touch cannot carry this gesture: the browser owns the scroll and the
			// on-screen keyboard owns the focus.
			if (event.isPrimary === false || event.pointerType !== 'mouse') {
				return;
			}
			const anchor = sourceAnchorPosition;
			pointerId = event.pointerId;
			sourceAnchor = anchor;
			startX = event.clientX;
			startY = event.clientY;
		},
		pointerMove(event) {
			if (pointerId !== event.pointerId || sourceAnchor === null) {
				return;
			}
			const distance = Math.hypot(
				event.clientX - startX,
				event.clientY - startY,
			);
			if (!dragging) {
				if (distance >= DRAG_START_DISTANCE_PX) {
					beginDrag();
				}
				if (!dragging) {
					return;
				}
				try {
					dom.setPointerCapture(event.pointerId);
				} catch {
					// jsdom and older WebViews may not support pointer capture.
				}
			}
			event.preventDefault();
			holdScroll();
			const target = environment.resolveTarget(
				event.clientX,
				event.clientY,
			);
			preview =
				target === null
					? null
					: computeDropPreview(
							target,
							event.clientX,
							event.clientY,
								preview,
						);
			indicator = renderDropIndicator(indicator, preview);
		},
		pointerUp(event) {
			if (pointerId !== event.pointerId) {
				return false;
			}
			const wasDragging = dragging;
			const anchor = sourceAnchor;
			const dropped = preview;
			reset();
			if (!wasDragging) {
				return false;
			}
			if (dropped === null || anchor === null) {
				return true;
			}
			const plan = planBranchDrop({
				sourceState: environment.sourceState(),
				sourceAnchor: anchor,
				targetState: dropped.target.state,
				gap: dropped.gap,
				indent: dropped.indent,
				sameDocument: dropped.target.sameDocumentAsSource,
				targetFocusRange: dropped.target.focusRange,
			});
			if (plan !== null) {
				environment.applyPlan(plan, dropped.target);
			}
			return true;
		},
		pointerCancel(event) {
			if (pointerId === event.pointerId) {
				reset();
			}
		},
		isDragging: () => dragging,
		dispose: reset,
	};
}

/**
 * Wires the gesture to a element's own pointer events. Used where nothing else
 * already owns those events.
 */
export function attachBranchDragController(
	dom: HTMLElement,
	environment: BranchDragEnvironment,
): () => void {
	const gesture = createBranchDragGesture(dom, environment);
	let suppressClick = false;

	const onPointerDown = (event: PointerEvent): void => {
		if (!(event.target instanceof Element)) {
			return;
		}
		const marker = event.target.closest<HTMLElement>('.bullet-zoom-marker');
		if (marker === null || !dom.contains(marker)) {
			return;
		}
		const anchor = environment.sourceAnchorAt(marker);
		if (anchor === null) {
			return;
		}
		gesture.pointerDown(event, anchor);
	};
	const onPointerMove = (event: PointerEvent): void => {
		gesture.pointerMove(event);
	};
	const onPointerUp = (event: PointerEvent): void => {
		if (gesture.pointerUp(event)) {
			suppressClick = true;
		}
	};
	const onPointerCancel = (event: PointerEvent): void => {
		gesture.pointerCancel(event);
	};
	const onClick = (event: MouseEvent): void => {
		if (!suppressClick) {
			return;
		}
		suppressClick = false;
		event.preventDefault();
		event.stopPropagation();
	};

	dom.addEventListener('pointerdown', onPointerDown);
	dom.addEventListener('pointermove', onPointerMove);
	dom.addEventListener('pointerup', onPointerUp);
	dom.addEventListener('pointercancel', onPointerCancel);
	dom.addEventListener('click', onClick, true);

	return () => {
		gesture.dispose();
		dom.removeEventListener('pointerdown', onPointerDown);
		dom.removeEventListener('pointermove', onPointerMove);
		dom.removeEventListener('pointerup', onPointerUp);
		dom.removeEventListener('pointercancel', onPointerCancel);
		dom.removeEventListener('click', onClick, true);
	};
}
