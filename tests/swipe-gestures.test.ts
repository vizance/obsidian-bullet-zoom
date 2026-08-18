import { markdown } from '@codemirror/lang-markdown';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { describe, expect, it, vi } from 'vitest';

import {
	classifySwipe,
	createSwipeExtension,
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
