import { markdown } from '@codemirror/lang-markdown';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { describe, expect, it, vi } from 'vitest';

import {
	classifySwipe,
	createSwipeExtension,
	installDrawerEdgeGuard,
	shouldBlockDrawerGesture,
	SWIPE_EDGE_MARGIN_PX,
} from '../src/swipe-gestures';

describe('classifySwipe', () => {
	it('recognises dominant horizontal movement only', () => {
		expect(classifySwipe(80, 10)).toBe('right');
		expect(classifySwipe(-80, 10)).toBe('left');
		expect(classifySwipe(30, 5)).toBeNull();
		expect(classifySwipe(80, 50)).toBeNull();
	});
});

describe('createSwipeExtension', () => {
	function mount(
		rightAction: 'none' | 'prefix' | 'copy',
		leftAction: 'none' | 'prefix' | 'copy',
	): {
		view: EditorView;
		parent: HTMLDivElement;
		onAction: ReturnType<typeof vi.fn>;
	} {
		const onAction = vi.fn();
		const parent = document.createElement('div');
		document.body.append(parent);
		const view = new EditorView({
			parent,
			state: EditorState.create({
				doc: '- idea',
				extensions: [
					markdown(),
					createSwipeExtension({ rightAction, leftAction, onAction }),
				],
			}),
		});
		vi.spyOn(view, 'posAtCoords').mockReturnValue(2);
		return { view, parent, onAction };
	}

	function pointer(
		type: string,
		x: number,
		y: number,
		pointerType = 'touch',
	): Event {
		// jsdom has no PointerEvent, so extend a MouseEvent with pointer fields.
		const event = new MouseEvent(type, {
			bubbles: true,
			cancelable: true,
			clientX: x,
			clientY: y,
		});
		Object.defineProperties(event, {
			pointerId: { value: 1 },
			pointerType: { value: pointerType },
			isPrimary: { value: true },
		});
		return event;
	}

	function swipe(
		view: EditorView,
		fromX: number,
		toX: number,
		toY = 100,
		pointerType = 'touch',
	): void {
		const target = view.contentDOM;
		target.dispatchEvent(pointer('pointerdown', fromX, 100, pointerType));
		target.dispatchEvent(pointer('pointermove', toX, toY, pointerType));
		target.dispatchEvent(pointer('pointerup', toX, toY, pointerType));
	}

	it('runs the configured action for each direction', () => {
		const { view, parent, onAction } = mount('prefix', 'copy');
		swipe(view, 200, 300);
		expect(onAction).toHaveBeenCalledWith(view, 2, 'prefix');
		swipe(view, 300, 200);
		expect(onAction).toHaveBeenLastCalledWith(view, 2, 'copy');
		view.destroy();
		parent.remove();
	});

	it('ignores vertical scrolling and short swipes', () => {
		const { view, parent, onAction } = mount('prefix', 'copy');
		swipe(view, 200, 300, 200);
		swipe(view, 200, 230);
		expect(onAction).not.toHaveBeenCalled();
		view.destroy();
		parent.remove();
	});

	it('ignores mouse pointers and edge starts', () => {
		const { view, parent, onAction } = mount('prefix', 'copy');
		swipe(view, 200, 300, 100, 'mouse');
		swipe(view, SWIPE_EDGE_MARGIN_PX - 1, 300);
		expect(onAction).not.toHaveBeenCalled();
		view.destroy();
		parent.remove();
	});

	it('installs nothing when both directions are disabled', () => {
		const { view, parent, onAction } = mount('none', 'none');
		swipe(view, 200, 300);
		expect(onAction).not.toHaveBeenCalled();
		view.destroy();
		parent.remove();
	});
});

describe('shouldBlockDrawerGesture', () => {
	const base = { viewportWidth: 400, edgeZone: 24, startedInEditor: true };

	it('blocks centre swipes that start inside the editor', () => {
		expect(shouldBlockDrawerGesture({ ...base, startX: 200 })).toBe(true);
	});

	it('allows swipes that start within the edge zone', () => {
		expect(shouldBlockDrawerGesture({ ...base, startX: 10 })).toBe(false);
		expect(shouldBlockDrawerGesture({ ...base, startX: 390 })).toBe(false);
	});

	it('ignores touches that start outside the editor', () => {
		expect(
			shouldBlockDrawerGesture({
				...base,
				startX: 200,
				startedInEditor: false,
			}),
		).toBe(false);
	});
});

describe('installDrawerEdgeGuard', () => {
	function setup(): {
		editor: HTMLElement;
		outside: HTMLElement;
		remove: () => void;
		stopPropagation: ReturnType<typeof vi.fn>;
		preventDefault: ReturnType<typeof vi.fn>;
		fire: (type: string, x: number, target: HTMLElement) => void;
	} {
		const editor = document.createElement('div');
		editor.className = 'cm-content';
		const outside = document.createElement('div');
		document.body.append(editor, outside);
		Object.defineProperty(window, 'innerWidth', {
			configurable: true,
			value: 400,
		});
		const remove = installDrawerEdgeGuard(window, { getEdgeZone: () => 24 });
		const stopPropagation = vi.fn();
		const preventDefault = vi.fn();
		const fire = (type: string, x: number, target: HTMLElement): void => {
			const event = new Event(type, { bubbles: true, cancelable: true });
			Object.defineProperties(event, {
				touches: { value: [{ clientX: x, clientY: 100 }] },
				stopPropagation: { value: stopPropagation },
				preventDefault: { value: preventDefault },
			});
			target.dispatchEvent(event);
		};
		return { editor, outside, remove, stopPropagation, preventDefault, fire };
	}

	it('stops propagation for centre swipes without preventing defaults', () => {
		const guard = setup();
		guard.fire('touchstart', 200, guard.editor);
		guard.fire('touchmove', 300, guard.editor);
		expect(guard.stopPropagation).toHaveBeenCalled();
		expect(guard.preventDefault).not.toHaveBeenCalled();
		guard.remove();
	});

	it('leaves edge swipes and non-editor touches alone', () => {
		const guard = setup();
		guard.fire('touchstart', 10, guard.editor);
		guard.fire('touchmove', 120, guard.editor);
		guard.fire('touchstart', 200, guard.outside);
		guard.fire('touchmove', 300, guard.outside);
		expect(guard.stopPropagation).not.toHaveBeenCalled();
		guard.remove();
	});

	it('stops blocking once removed', () => {
		const guard = setup();
		guard.remove();
		guard.fire('touchstart', 200, guard.editor);
		guard.fire('touchmove', 300, guard.editor);
		expect(guard.stopPropagation).not.toHaveBeenCalled();
	});
});
