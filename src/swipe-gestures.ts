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
				event.clientX <= SWIPE_EDGE_MARGIN_PX ||
				(width > 0 && event.clientX >= width - SWIPE_EDGE_MARGIN_PX)
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
