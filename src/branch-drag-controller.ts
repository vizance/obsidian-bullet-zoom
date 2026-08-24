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
export const DRAG_SCROLL_TOLERANCE_PX = 10;
export const DRAG_TOUCH_HOLD_MS = 350;

export const DRAGGING_CLASS = 'bullet-zoom-branch-dragging';
export const INDICATOR_CLASS = 'bullet-zoom-branch-drop-indicator';
/** Put on the window body so every pane hides its caret, not just the source. */
export const DRAG_ACTIVE_CLASS = 'bullet-zoom-branch-drag-active';
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
	/**
	 * False when the radial menu needs the long press as its only entry point;
	 * a touch hold must not steal it.
	 */
	allowTouchHold(): boolean;
	/**
	 * Hides the caret and drops editor focus for the length of the drag, so the
	 * pointer driving the branch does not appear to drag the caret with it.
	 */
	setCaretSuspended(suspended: boolean): void;
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
	let holdTimer: number | null = null;
	let preview: DropPreview | null = null;
	let indicator: HTMLElement | null = null;

	const reset = (): void => {
		if (holdTimer !== null) {
			window?.clearTimeout(holdTimer);
			holdTimer = null;
		}
		if (dragging) {
			dom.classList.remove(DRAGGING_CLASS);
			environment.setCaretSuspended(false);
		}
		preview = null;
		indicator = renderDropIndicator(indicator, null);
		dragging = false;
		pointerId = null;
		sourceAnchor = null;
	};

	const beginDrag = (): void => {
		dragging = true;
		dom.classList.add(DRAGGING_CLASS);
		environment.setCaretSuspended(true);
	};

	return {
		pointerDown(event, sourceAnchorPosition) {
			if (event.isPrimary === false) {
				return;
			}
			const anchor = sourceAnchorPosition;
			pointerId = event.pointerId;
			sourceAnchor = anchor;
			startX = event.clientX;
			startY = event.clientY;
			if (event.pointerType !== 'mouse' && environment.allowTouchHold()) {
				// Touch has to hold still, otherwise every scroll drags a branch.
				holdTimer =
					window?.setTimeout(() => {
						holdTimer = null;
						beginDrag();
					}, DRAG_TOUCH_HOLD_MS) ?? null;
			}
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
				if (event.pointerType === 'mouse') {
					if (distance >= DRAG_START_DISTANCE_PX) {
						beginDrag();
					}
				} else if (
					holdTimer !== null &&
					distance >= DRAG_SCROLL_TOLERANCE_PX
				) {
					reset();
					return;
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
