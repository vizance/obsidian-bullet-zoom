import { EditorView } from '@codemirror/view';
import type { Extension } from '@codemirror/state';

export const SWIPE_DISTANCE_PX = 60;
export const SWIPE_VERTICAL_CANCEL_PX = 24;
export const SWIPE_EDGE_MARGIN_PX = 24;

export type SwipeDirection = 'left' | 'right';
export type SwipeAction = 'none' | 'prefix' | 'copy';

export function classifySwipe(
	deltaX: number,
	deltaY: number,
): SwipeDirection | null {
	const horizontal = Math.abs(deltaX);
	const vertical = Math.abs(deltaY);
	if (vertical > SWIPE_VERTICAL_CANCEL_PX) {
		return null;
	}
	if (horizontal < SWIPE_DISTANCE_PX || horizontal <= vertical * 2) {
		return null;
	}
	return deltaX > 0 ? 'right' : 'left';
}

export interface SwipeExtensionOptions {
	readonly rightAction: SwipeAction;
	readonly leftAction: SwipeAction;
	readonly edgeZone?: number;
	readonly onAction: (
		view: EditorView,
		position: number,
		action: Exclude<SwipeAction, 'none'>,
	) => void;
}

export function createSwipeExtension(
	options: SwipeExtensionOptions,
): Extension {
	if (options.rightAction === 'none' && options.leftAction === 'none') {
		return [];
	}

	const edgeZone = options.edgeZone ?? SWIPE_EDGE_MARGIN_PX;
	let pointerId: number | null = null;
	let startX = 0;
	let startY = 0;
	let position: number | null = null;
	let cancelled = false;
	let recognised = false;

	const reset = (): void => {
		pointerId = null;
		position = null;
		cancelled = false;
	};

	return EditorView.domEventHandlers({
		pointerdown: (event, view) => {
			if (event.pointerType === 'mouse' || event.isPrimary === false) {
				return false;
			}
			const window = view.dom.ownerDocument.defaultView;
			const width = window?.innerWidth ?? 0;
			if (
				event.clientX <= edgeZone ||
				(width > 0 && event.clientX >= width - edgeZone)
			) {
				return false;
			}
			pointerId = event.pointerId;
			startX = event.clientX;
			startY = event.clientY;
			cancelled = false;
			position = view.posAtCoords(
				{ x: event.clientX, y: event.clientY },
				false,
			);
			return false;
		},
		pointermove: (event) => {
			if (pointerId !== event.pointerId || cancelled) {
				return false;
			}
			if (Math.abs(event.clientY - startY) > SWIPE_VERTICAL_CANCEL_PX) {
				cancelled = true;
			}
			return false;
		},
		pointerup: (event, view) => {
			if (pointerId !== event.pointerId) {
				return false;
			}
			const resolved = position;
			const wasCancelled = cancelled;
			reset();
			if (wasCancelled || resolved === null) {
				return false;
			}
			const direction = classifySwipe(
				event.clientX - startX,
				event.clientY - startY,
			);
			if (direction === null) {
				return false;
			}
			const action =
				direction === 'right' ? options.rightAction : options.leftAction;
			if (action === 'none') {
				return false;
			}
			recognised = true;
			options.onAction(view, resolved, action);
			event.preventDefault();
			return true;
		},
		pointercancel: (event) => {
			if (pointerId === event.pointerId) {
				reset();
			}
			return false;
		},
		click: (event) => {
			if (!recognised) {
				return false;
			}
			recognised = false;
			event.preventDefault();
			event.stopPropagation();
			return true;
		},
	});
}

export const DRAWER_EDGE_ZONE_MIN = 8;
export const DRAWER_EDGE_ZONE_MAX = 80;

export function shouldBlockDrawerGesture(input: {
	readonly startX: number;
	readonly viewportWidth: number;
	readonly edgeZone: number;
	readonly startedInEditor: boolean;
}): boolean {
	if (!input.startedInEditor) {
		return false;
	}
	if (input.startX <= input.edgeZone) {
		return false;
	}
	if (
		input.viewportWidth > 0 &&
		input.startX >= input.viewportWidth - input.edgeZone
	) {
		return false;
	}
	return true;
}

interface DrawerGuardWindow {
	addEventListener: Window['addEventListener'];
	removeEventListener: Window['removeEventListener'];
	innerWidth?: number;
}

export function installDrawerEdgeGuard(
	target: DrawerGuardWindow,
	options: { readonly getEdgeZone: () => number },
): () => void {
	let startX = 0;
	let startedInEditor = false;

	const isInsideEditor = (node: EventTarget | null): boolean =>
		node instanceof Element && node.closest('.cm-content') !== null;

	const onTouchStart = (event: Event): void => {
		const touch = (event as TouchEvent).touches?.[0];
		if (touch === undefined) {
			startedInEditor = false;
			return;
		}
		startX = touch.clientX;
		startedInEditor = isInsideEditor(event.target);
	};

	const onTouchMove = (event: Event): void => {
		if (
			shouldBlockDrawerGesture({
				startX,
				viewportWidth: target.innerWidth ?? 0,
				edgeZone: options.getEdgeZone(),
				startedInEditor,
			})
		) {
			// Only stop other handlers; never preventDefault so scrolling and
			// text selection keep their native behaviour.
			event.stopPropagation();
		}
	};

	const onTouchEnd = (): void => {
		startedInEditor = false;
	};

	target.addEventListener('touchstart', onTouchStart, true);
	target.addEventListener('touchmove', onTouchMove, true);
	target.addEventListener('touchend', onTouchEnd, true);
	target.addEventListener('touchcancel', onTouchEnd, true);
	return () => {
		target.removeEventListener('touchstart', onTouchStart, true);
		target.removeEventListener('touchmove', onTouchMove, true);
		target.removeEventListener('touchend', onTouchEnd, true);
		target.removeEventListener('touchcancel', onTouchEnd, true);
	};
}
