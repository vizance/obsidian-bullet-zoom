import { markdown } from '@codemirror/lang-markdown';
import { EditorState } from '@codemirror/state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
	attachBranchDragController,
	chooseIndent,
	computeDropPreview,
	renderDropIndicator,
	DROP_LEFT_PROPERTY,
	DROP_TOP_PROPERTY,
	INDICATOR_CLASS,
	DRAGGING_CLASS,
	DRAG_TOUCH_HOLD_MS,
	type BranchDragEnvironment,
	type DragTarget,
} from '../src/branch-drag-controller';
import type { BranchDropPlan } from '../src/branch-drop-plan';

function createState(document: string): EditorState {
	return EditorState.create({ doc: document, extensions: [markdown()] });
}

type Harness = Readonly<{
	dom: HTMLElement;
	marker: HTMLElement;
	applied: { plan: BranchDropPlan; target: DragTarget }[];
	detach: () => void;
	environment: BranchDragEnvironment;
}>;

function createHarness(
	overrides: Partial<BranchDragEnvironment> = {},
): Harness {
	const dom = document.createElement('div');
	const line = document.createElement('div');
	line.className = 'cm-line';
	const marker = document.createElement('span');
	marker.className = 'bullet-zoom-marker';
	line.append(marker);
	dom.append(line);
	document.body.append(dom);

	const state = createState('- A\n- B\n- C');
	const applied: { plan: BranchDropPlan; target: DragTarget }[] = [];
	const environment: BranchDragEnvironment = {
		sourceAnchorAt: () => 0,
		sourceState: () => state,
		resolveTarget: () => null,
		allowTouchHold: () => true,
		applyPlan: (plan, target) => {
			applied.push({ plan, target });
		},
		...overrides,
	};
	const detach = attachBranchDragController(dom, environment);
	return { dom, marker, applied, detach, environment };
}

function pointer(
	type: string,
	init: Readonly<{
		x?: number;
		y?: number;
		pointerType?: string;
		pointerId?: number;
	}> = {},
): MouseEvent {
	const event = new MouseEvent(type, {
		bubbles: true,
		cancelable: true,
		clientX: init.x ?? 0,
		clientY: init.y ?? 0,
	});
	Object.assign(event, {
		pointerId: init.pointerId ?? 1,
		pointerType: init.pointerType ?? 'mouse',
		isPrimary: true,
	});
	return event;
}

describe('attachBranchDragController', () => {
	let harness: Harness;

	beforeEach(() => {
		vi.useFakeTimers();
		harness = createHarness();
	});

	afterEach(() => {
		harness.detach();
		harness.dom.remove();
		vi.useRealTimers();
	});

	it('treats a mouse press below the threshold as a click, not a drag', () => {
		harness.marker.dispatchEvent(pointer('pointerdown'));
		harness.dom.dispatchEvent(pointer('pointermove', { x: 3 }));
		expect(harness.dom.classList.contains(DRAGGING_CLASS)).toBe(false);
		harness.dom.dispatchEvent(pointer('pointerup', { x: 3 }));

		const click = new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
		});
		harness.marker.dispatchEvent(click);
		expect(click.defaultPrevented).toBe(false);
	});

	it('starts dragging once the mouse passes the threshold', () => {
		harness.marker.dispatchEvent(pointer('pointerdown'));
		harness.dom.dispatchEvent(pointer('pointermove', { x: 16 }));
		expect(harness.dom.classList.contains(DRAGGING_CLASS)).toBe(true);
	});

	it('swallows the click that ends a drag so the release does not zoom', () => {
		harness.marker.dispatchEvent(pointer('pointerdown'));
		harness.dom.dispatchEvent(pointer('pointermove', { x: 16 }));
		harness.dom.dispatchEvent(pointer('pointerup', { x: 16 }));

		const click = new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
		});
		harness.marker.dispatchEvent(click);
		expect(click.defaultPrevented).toBe(true);
		expect(harness.dom.classList.contains(DRAGGING_CLASS)).toBe(false);
	});

	it('starts dragging after a touch hold', () => {
		harness.marker.dispatchEvent(
			pointer('pointerdown', { pointerType: 'touch' }),
		);
		expect(harness.dom.classList.contains(DRAGGING_CLASS)).toBe(false);
		vi.advanceTimersByTime(DRAG_TOUCH_HOLD_MS);
		expect(harness.dom.classList.contains(DRAGGING_CLASS)).toBe(true);
	});

	it('cancels the touch hold when the finger scrolls first', () => {
		harness.marker.dispatchEvent(
			pointer('pointerdown', { pointerType: 'touch' }),
		);
		harness.dom.dispatchEvent(
			pointer('pointermove', { y: 20, pointerType: 'touch' }),
		);
		vi.advanceTimersByTime(DRAG_TOUCH_HOLD_MS);
		expect(harness.dom.classList.contains(DRAGGING_CLASS)).toBe(false);
	});

	it('restores itself on pointer cancel without applying anything', () => {
		harness.marker.dispatchEvent(pointer('pointerdown'));
		harness.dom.dispatchEvent(pointer('pointermove', { x: 16 }));
		harness.dom.dispatchEvent(pointer('pointercancel', { x: 16 }));
		expect(harness.dom.classList.contains(DRAGGING_CLASS)).toBe(false);
		expect(harness.applied).toHaveLength(0);
	});

	it('ignores a press that does not land on a marker', () => {
		const plain = document.createElement('span');
		harness.dom.append(plain);
		plain.dispatchEvent(pointer('pointerdown'));
		harness.dom.dispatchEvent(pointer('pointermove', { x: 40 }));
		expect(harness.dom.classList.contains(DRAGGING_CLASS)).toBe(false);
	});

	it('ignores a marker the environment cannot resolve to a bullet', () => {
		harness.detach();
		harness = createHarness({ sourceAnchorAt: () => null });
		harness.marker.dispatchEvent(pointer('pointerdown'));
		harness.dom.dispatchEvent(pointer('pointermove', { x: 40 }));
		expect(harness.dom.classList.contains(DRAGGING_CLASS)).toBe(false);
	});
});

function createTarget(
	doc: string,
	overrides: Partial<DragTarget> = {},
): DragTarget {
	const state = createState(doc);
	const host = document.createElement('div');
	// Each line is 20px tall and starts at x = 100; one indent column is 10px.
	return {
		key: 'target',
		state,
		writable: true,
		sameDocumentAsSource: true,
		sameWindowAsSource: true,
		focusRange: null,
		indicatorHost: host,
		posAtCoords: (_x, y) => {
			const lineNumber = Math.floor(y / 20) + 1;
			return lineNumber >= 1 && lineNumber <= state.doc.lines
				? state.doc.line(lineNumber).from
				: null;
		},
		lineGeometry: (position) => {
			const line = state.doc.lineAt(position);
			return {
				top: (line.number - 1) * 20,
				bottom: line.number * 20,
				left: 100,
			};
		},
		columnWidthPx: () => 10,
		...overrides,
	};
}

describe('chooseIndent', () => {
	const state = createState('- A\n\t- A1\n- B');

	it('picks the deeper indent once the pointer passes the midpoint', () => {
		// '' sits at x = 100, '\t' at x = 100 + 4 columns * 10px = 140.
		expect(chooseIndent(['', '\t'], state, 100, 10, 121)).toBe('\t');
		expect(chooseIndent(['', '\t'], state, 100, 10, 119)).toBe('');
	});

	it('prefers the shallower indent at an equal distance', () => {
		expect(chooseIndent(['', '\t'], state, 100, 10, 120)).toBe('');
	});
});

describe('computeDropPreview', () => {
	it('reads the gap and indent from the pointer position', () => {
		const target = createTarget('- A\n\t- A1\n\t\t- A1a\n- B');
		// Line 3 spans y = 40..60, so y = 55 is its lower half.
		const preview = computeDropPreview(target, 400, 55, null);
		expect(preview?.gap.above?.label).toBe('A1a');
		expect(preview?.gap.below?.label).toBe('B');
		expect(preview?.candidates).toEqual(['', '\t', '\t\t', '\t\t\t']);
		expect(preview?.indent).toBe('\t\t\t');
		expect(preview?.indicatorTop).toBe(60);
		expect(preview?.indicatorLeft).toBe(100 + 12 * 10);
	});

	it('changes only the indent while the pointer stays in one gap', () => {
		const target = createTarget('- A\n\t- A1\n\t\t- A1a\n- B');
		const first = computeDropPreview(target, 400, 55, null);
		const second = computeDropPreview(target, 100, 55, first);
		expect(second?.gap.insertAt).toBe(first?.gap.insertAt);
		expect(second?.indent).toBe('');
	});

	it('reuses the candidates of the previous preview inside the same gap', () => {
		const target = createTarget('- A\n\t- A1\n\t\t- A1a\n- B');
		const first = computeDropPreview(target, 400, 55, null);
		const doctored = { ...first!, candidates: Object.freeze(['\t\t']) };
		const second = computeDropPreview(target, 400, 55, doctored);
		expect(second?.candidates).toBe(doctored.candidates);
		expect(second?.indent).toBe('\t\t');
	});

	it('gives no preview over a read-only editor', () => {
		const target = createTarget('- A\n- B', { writable: false });
		expect(computeDropPreview(target, 100, 10, null)).toBeNull();
	});

	it('gives no preview when the pointer is not over a list line', () => {
		const target = createTarget('- A\n\nPlain paragraph');
		expect(computeDropPreview(target, 100, 50, null)).toBeNull();
	});
});

describe('renderDropIndicator', () => {
	it('positions itself with the two custom properties and nothing else', () => {
		const target = createTarget('- A\n\t- A1\n\t\t- A1a\n- B');
		document.body.append(target.indicatorHost);
		const preview = computeDropPreview(target, 400, 55, null);
		const indicator = renderDropIndicator(null, preview);

		expect(indicator?.parentElement).toBe(target.indicatorHost);
		expect(indicator?.className).toBe(INDICATOR_CLASS);
		expect(indicator?.style.getPropertyValue(DROP_LEFT_PROPERTY)).toBe(
			'220px',
		);
		expect(indicator?.style.getPropertyValue(DROP_TOP_PROPERTY)).toBe(
			'60px',
		);
		expect(indicator?.style.length).toBe(2);
		target.indicatorHost.remove();
	});

	it('moves only the left property when the indent changes in one gap', () => {
		const target = createTarget('- A\n\t- A1\n\t\t- A1a\n- B');
		document.body.append(target.indicatorHost);
		const deep = computeDropPreview(target, 400, 55, null);
		const indicator = renderDropIndicator(null, deep);
		const shallow = computeDropPreview(target, 100, 55, deep);
		const moved = renderDropIndicator(indicator, shallow);

		expect(moved).toBe(indicator);
		// The line's left edge is x = 100, so the outermost indent sits there.
		expect(moved?.style.getPropertyValue(DROP_LEFT_PROPERTY)).toBe('100px');
		expect(moved?.style.getPropertyValue(DROP_TOP_PROPERTY)).toBe('60px');
		target.indicatorHost.remove();
	});

	it('removes itself when there is no drop to preview', () => {
		const target = createTarget('- A\n- B');
		document.body.append(target.indicatorHost);
		const indicator = renderDropIndicator(
			null,
			computeDropPreview(target, 100, 10, null),
		);
		expect(renderDropIndicator(indicator, null)).toBeNull();
		expect(target.indicatorHost.children).toHaveLength(0);
		target.indicatorHost.remove();
	});
});

describe('the drag gesture and the indicator together', () => {
	it('removes the indicator when the drag is canceled', () => {
		vi.useFakeTimers();
		const target = createTarget('- A\n- B\n- C');
		document.body.append(target.indicatorHost);
		const local = createHarness({ resolveTarget: () => target });

		local.marker.dispatchEvent(pointer('pointerdown'));
		local.dom.dispatchEvent(pointer('pointermove', { x: 120, y: 10 }));
		expect(
			target.indicatorHost.querySelectorAll(`.${INDICATOR_CLASS}`),
		).toHaveLength(1);

		local.dom.dispatchEvent(pointer('pointercancel', { x: 120, y: 10 }));
		expect(
			target.indicatorHost.querySelectorAll(`.${INDICATOR_CLASS}`),
		).toHaveLength(0);

		local.detach();
		local.dom.remove();
		target.indicatorHost.remove();
		vi.useRealTimers();
	});
});

describe('applying a drop', () => {
	it('hands a single same-document plan to the environment on release', () => {
		vi.useFakeTimers();
		const target = createTarget('- A\n- B\n- C');
		document.body.append(target.indicatorHost);
		const local = createHarness({
			resolveTarget: () => target,
			sourceState: () => target.state,
			sourceAnchorAt: () => target.state.doc.line(1).from,
		});

		local.marker.dispatchEvent(pointer('pointerdown'));
		// Lower half of line 3, which is the gap after the last item.
		local.dom.dispatchEvent(pointer('pointermove', { x: 120, y: 55 }));
		local.dom.dispatchEvent(pointer('pointerup', { x: 120, y: 55 }));

		expect(local.applied).toHaveLength(1);
		const applied = local.applied[0]!;
		expect(applied.plan.kind).toBe('same-document');
		expect(applied.target).toBe(target);
		expect(
			target.indicatorHost.querySelectorAll(`.${INDICATOR_CLASS}`),
		).toHaveLength(0);

		local.detach();
		local.dom.remove();
		target.indicatorHost.remove();
		vi.useRealTimers();
	});

	it('applies nothing when the release happens outside every editor', () => {
		vi.useFakeTimers();
		const local = createHarness({ resolveTarget: () => null });
		local.marker.dispatchEvent(pointer('pointerdown'));
		local.dom.dispatchEvent(pointer('pointermove', { x: 120, y: 55 }));
		local.dom.dispatchEvent(pointer('pointerup', { x: 120, y: 55 }));
		expect(local.applied).toHaveLength(0);
		local.detach();
		local.dom.remove();
		vi.useRealTimers();
	});
});

describe('leaving the radial menu its entry point', () => {
	it('does not start a touch drag when the long press owns the menu', () => {
		vi.useFakeTimers();
		const local = createHarness({ allowTouchHold: () => false });
		local.marker.dispatchEvent(
			pointer('pointerdown', { pointerType: 'touch' }),
		);
		vi.advanceTimersByTime(DRAG_TOUCH_HOLD_MS * 2);
		expect(local.dom.classList.contains(DRAGGING_CLASS)).toBe(false);
		local.detach();
		local.dom.remove();
		vi.useRealTimers();
	});

	it('still starts a mouse drag when the long press owns the menu', () => {
		vi.useFakeTimers();
		const local = createHarness({ allowTouchHold: () => false });
		local.marker.dispatchEvent(pointer('pointerdown'));
		local.dom.dispatchEvent(pointer('pointermove', { x: 16 }));
		expect(local.dom.classList.contains(DRAGGING_CLASS)).toBe(true);
		local.detach();
		local.dom.remove();
		vi.useRealTimers();
	});
});

describe('a popout window is never a drop target', () => {
	it('gives no preview for an editor in another window document', () => {
		const target = createTarget('- A\n- B', { sameWindowAsSource: false });
		expect(computeDropPreview(target, 100, 10, null)).toBeNull();
	});
});
