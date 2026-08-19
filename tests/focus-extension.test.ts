import { markdown } from '@codemirror/lang-markdown';
import { history, undo } from '@codemirror/commands';
import {
	codeFolding,
	foldEffect,
	foldable,
	foldedRanges,
	indentUnit,
} from '@codemirror/language';
import {
	Compartment,
	EditorState,
	type Extension,
} from '@codemirror/state';
import { Decoration, EditorView, showPanel, WidgetType } from '@codemirror/view';
import { describe, expect, it, vi } from 'vitest';

import {
	appendDirectChild,
	ADD_CHILD_UNAVAILABLE_NOTICE,
	createFocusExtension,
	clearFocusEffect,
	EDITOR_VIEW_UNAVAILABLE_NOTICE,
	NO_ANCESTOR_NOTICE,
	classifyLineTapZone,
	enterFocusAt,
	planFoldToggle,
	exitFocus,
	focusParent,
	focusAtEffect,
	focusFilePath,
	focusLivePreview,
	focusNoteTitle,
	getFocusSession,
	LIVE_PREVIEW_REQUIRED_NOTICE,
	resolveCodeMirrorView,
	runExitCommand,
	runFocusCommand,
	runParentCommand,
	runTopLevelCommand,
	SUPPORTED_BULLET_REQUIRED_NOTICE,
} from '../src/focus-extension';
import { findSupportedBullet } from '../src/list-structure';

function createState(
	document: string,
	filePath = 'Ideas.md',
	additionalExtensions: Extension = [],
	isPhone = false,
	isMobile = isPhone,
): EditorState {
	return EditorState.create({
		doc: document,
		extensions: [
			markdown(),
			focusFilePath.of(filePath),
			focusNoteTitle.of(filePath.replace(/\.md$/, '')),
			focusLivePreview.of(true),
			createFocusExtension({
				isPhone,
				isMobile,
			}),
			additionalExtensions,
		],
	});
}

function focus(state: EditorState, position: number): EditorState {
	return state.update({ effects: focusAtEffect.of(position) }).state;
}

function decorationRanges(state: EditorState): Array<{ from: number; to: number }> {
	const ranges: Array<{ from: number; to: number }> = [];
	for (const source of state.facet(EditorView.decorations)) {
		if (typeof source === 'function') {
			continue;
		}
		const iterator = source.iter();
		while (iterator.value !== null) {
			if (iterator.from !== iterator.to) {
				ranges.push({ from: iterator.from, to: iterator.to });
			}
			iterator.next();
		}
	}
	return ranges;
}

function activeFoldRanges(view: EditorView): Array<{
	from: number;
	to: number;
}> {
	const ranges: Array<{ from: number; to: number }> = [];
	foldedRanges(view.state).between(
		0,
		view.state.doc.length,
		(from, to) => {
			ranges.push({ from, to });
		},
	);
	return ranges;
}

function foldLine(view: EditorView, lineNumber: number): {
	from: number;
	to: number;
} {
	const line = view.state.doc.line(lineNumber);
	const range = foldable(view.state, line.from, line.to);
	expect(range).not.toBeNull();
	if (range === null) {
		throw new Error(`Expected line ${lineNumber} to be foldable`);
	}
	view.dispatch({ effects: foldEffect.of(range) });
	return range;
}

describe('per-editor focus state', () => {
	it('keeps split pane state independent', () => {
		const document = '- Parent\n  - Child';
		const firstPane = createState(document);
		const secondPane = createState(document);
		const focusedFirstPane = focus(firstPane, firstPane.doc.line(2).from);

		expect(getFocusSession(focusedFirstPane)?.breadcrumbs.at(-1)?.label).toBe(
			'Child',
		);
		expect(getFocusSession(secondPane)).toBeNull();
	});

	it('maps the marker anchor through indentation edits', () => {
		const initial = createState('- Parent\n  - Child');
		const focused = focus(initial, initial.doc.line(2).from);
		const originalAnchor = getFocusSession(focused)?.anchor;
		expect(originalAnchor).toBeTypeOf('number');

		const next = focused.update({
			changes: { from: focused.doc.line(2).from, insert: '  ' },
		}).state;
		expect(getFocusSession(next)?.anchor).toBe((originalAnchor ?? 0) + 2);
		expect(getFocusSession(next)?.breadcrumbs.at(-1)?.label).toBe('Child');
	});

	it('clears focus when the editor file path changes', () => {
		const fileCompartment = new Compartment();
		const state = EditorState.create({
			doc: '- Parent\n  - Child',
			extensions: [
				markdown(),
				fileCompartment.of(focusFilePath.of('Ideas.md')),
				focusNoteTitle.of('Ideas'),
				focusLivePreview.of(true),
				createFocusExtension({ isPhone: false, isMobile: false }),
			],
		});
		const focused = focus(state, state.doc.line(2).from);
		const next = focused.update({
			effects: fileCompartment.reconfigure(focusFilePath.of('Other.md')),
		}).state;
		expect(getFocusSession(next)).toBeNull();
	});

	it('starts clear when the editor state is recreated', () => {
		const document = '- Parent\n  - Child';
		const state = createState(document);
		expect(getFocusSession(focus(state, state.doc.line(2).from))).not.toBeNull();
		expect(getFocusSession(createState(document))).toBeNull();
	});

	it('clears focus when the target becomes an ordered item', () => {
		const state = createState('- Parent\n  - Child');
		const focused = focus(state, state.doc.line(2).from);
		const marker = getFocusSession(focused)?.anchor;
		expect(marker).toBeTypeOf('number');

		const next = focused.update({
			changes: { from: marker ?? 0, to: (marker ?? 0) + 1, insert: '1.' },
		}).state;
		expect(getFocusSession(next)).toBeNull();
		expect(next.doc.toString()).toContain('1. Child');
	});

	it('clears focus when Live Preview is turned off', () => {
		const modeCompartment = new Compartment();
		const state = createState(
			'- Parent',
			'Ideas.md',
			modeCompartment.of(focusLivePreview.of(true)),
		);
		const focused = focus(state, 0);
		const next = focused.update({
			effects: modeCompartment.reconfigure(focusLivePreview.of(false)),
		}).state;
		expect(getFocusSession(next)).toBeNull();
	});
});

describe('focus decorations and document integrity', () => {
	it('hides only the ranges outside the focused branch', () => {
		const state = createState(
			'- Parent\n  - Child A\n    - Grandchild\n  - Child B\nAfter list',
		);
		const focused = focus(state, state.doc.line(2).from);
		const sortedRanges = decorationRanges(focused).sort(
			(left, right) => left.from - right.from,
		);
		expect(sortedRanges).toEqual([
			{ from: 0, to: state.doc.line(2).from - 1 },
			{
				from: state.doc.line(2).from,
				to: findSupportedBullet(state, state.doc.line(2).from)?.contentFrom ?? -1,
			},
			{ from: state.doc.line(3).from, to: state.doc.line(3).from + 4 },
			{ from: state.doc.line(3).to + 1, to: state.doc.length },
		]);
	});

	it('does not change Markdown while focusing or refocusing', () => {
		const state = createState('- Parent\n  - Child');
		const source = state.doc.toString();
		const childFocused = focus(state, state.doc.line(2).from);
		const parentFocused = focus(childFocused, childFocused.doc.line(1).from);
		const cleared = parentFocused.update({ effects: clearFocusEffect.of() }).state;

		expect(childFocused.doc.toString()).toBe(source);
		expect(parentFocused.doc.toString()).toBe(source);
		expect(cleared.doc.toString()).toBe(source);
	});

	it('retains an explicit user edit and recomputes the focused branch', () => {
		const state = createState('- Parent\n  - Child A\n  - Child B');
		const focused = focus(state, state.doc.line(2).from);
		const edited = focused.update({
			changes: {
				from: focused.doc.line(3).from,
				insert: '  ',
			},
		}).state;

		expect(edited.doc.toString()).toBe('- Parent\n  - Child A\n    - Child B');
		expect(getFocusSession(edited)?.branch.to).toBe(edited.doc.length);
		const sortedEditedRanges = decorationRanges(edited).sort(
			(left, right) => left.from - right.from,
		);
		expect(sortedEditedRanges).toEqual([
			{ from: 0, to: edited.doc.line(2).from - 1 },
			{
				from: edited.doc.line(2).from,
				to:
					findSupportedBullet(edited, edited.doc.line(2).from)?.contentFrom ??
					-1,
			},
			{ from: edited.doc.line(3).from, to: edited.doc.line(3).from + 4 },
		]);
	});

	it('keeps user edits in CodeMirror history and supports undo', () => {
		const parent = document.createElement('div');
		document.body.append(parent);
		const view = new EditorView({
			parent,
			state: createState('- Parent\n  - Child', 'Ideas.md', history()),
		});
		view.dispatch({ effects: focusAtEffect.of(view.state.doc.line(2).from) });
		const original = view.state.doc.toString();
		view.dispatch({
			changes: {
				from: view.state.doc.line(2).to,
				insert: ' updated',
			},
		});

		expect(view.state.doc.toString()).toContain('Child updated');
		expect(undo(view)).toBe(true);
		expect(view.state.doc.toString()).toBe(original);
		expect(getFocusSession(view.state)).not.toBeNull();
		view.destroy();
		parent.remove();
	});
});

describe('exitFocus', () => {
	it('clears active focus while retaining source and selection', () => {
		const parent = document.createElement('div');
		document.body.append(parent);
		const view = new EditorView({
			parent,
			state: createState('- Parent\n  - Child'),
		});
		const child = view.state.doc.line(2);
		view.dispatch({
			selection: { anchor: child.to },
			effects: focusAtEffect.of(child.from),
		});
		const source = view.state.doc.toString();
		const selection = view.state.selection;

		expect(exitFocus(view)).toBe(true);
		expect(getFocusSession(view.state)).toBeNull();
		expect(view.state.doc.toString()).toBe(source);
		expect(view.state.selection.eq(selection)).toBe(true);
		view.destroy();
		parent.remove();
	});

	it('does nothing when focus is already clear', () => {
		const parent = document.createElement('div');
		document.body.append(parent);
		const view = new EditorView({
			parent,
			state: createState('- Parent'),
		});
		const source = view.state.doc.toString();
		const selection = view.state.selection;

		expect(exitFocus(view)).toBe(false);
		expect(view.state.doc.toString()).toBe(source);
		expect(view.state.selection.eq(selection)).toBe(true);
		view.destroy();
		parent.remove();
	});
});

describe('focusParent', () => {
	it('returns exactly one Bullet level at a time without changing source or selection', () => {
		const parent = document.createElement('div');
		document.body.append(parent);
		const view = new EditorView({
			parent,
			state: createState('- Parent\n  - Child\n    - Grandchild'),
		});
		const grandchild = view.state.doc.line(3);
		view.dispatch({
			selection: { anchor: grandchild.to },
			effects: focusAtEffect.of(grandchild.from),
		});
		const source = view.state.doc.toString();
		const selection = view.state.selection;

		expect(focusParent(view)).toBe(true);
		expect(getFocusSession(view.state)?.breadcrumbs.at(-1)?.label).toBe('Child');
		expect(view.state.doc.toString()).toBe(source);
		expect(view.state.selection.eq(selection)).toBe(true);

		expect(focusParent(view)).toBe(true);
		expect(getFocusSession(view.state)?.breadcrumbs.at(-1)?.label).toBe('Parent');
		expect(view.state.doc.toString()).toBe(source);
		expect(view.state.selection.eq(selection)).toBe(true);
		view.destroy();
		parent.remove();
	});

	it('returns from a root Bullet to the complete note', () => {
		const parent = document.createElement('div');
		document.body.append(parent);
		const view = new EditorView({
			parent,
			state: createState('- Parent\n  - Child'),
		});
		const root = view.state.doc.line(1);
		view.dispatch({
			selection: { anchor: root.to },
			effects: focusAtEffect.of(root.from),
		});
		const selection = view.state.selection;

		expect(focusParent(view)).toBe(true);
		expect(getFocusSession(view.state)).toBeNull();
		expect(view.state.selection.eq(selection)).toBe(true);
		view.destroy();
		parent.remove();
	});

	it('does nothing when focus is already clear', () => {
		const parent = document.createElement('div');
		document.body.append(parent);
		const view = new EditorView({
			parent,
			state: createState('- Parent'),
		});
		const source = view.state.doc.toString();
		const selection = view.state.selection;

		expect(focusParent(view)).toBe(false);
		expect(getFocusSession(view.state)).toBeNull();
		expect(view.state.doc.toString()).toBe(source);
		expect(view.state.selection.eq(selection)).toBe(true);
		view.destroy();
		parent.remove();
	});
});

describe('bullet marker interaction', () => {
	class ObsidianFoldWidget extends WidgetType {
		toDOM(view: EditorView): HTMLElement {
			const foldIndicator = view.dom.ownerDocument.createElement('span');
			foldIndicator.className = 'cm-fold-indicator';
			const collapseIndicator = view.dom.ownerDocument.createElement('div');
			collapseIndicator.className = 'collapse-indicator collapse-icon';
			foldIndicator.append(collapseIndicator);
			return foldIndicator;
		}
	}

	function foldIndicatorExtension(position = 0): Extension {
		const foldDecoration = Decoration.widget({
			widget: new ObsidianFoldWidget(),
			side: -1,
		}).range(position);
		return EditorView.decorations.of(Decoration.set([foldDecoration]));
	}

	function createView(
		documentText: string,
		additionalExtensions: Extension = [],
		isPhone = false,
		isMobile = isPhone,
	): { parent: HTMLDivElement; view: EditorView } {
		const parent = document.createElement('div');
		document.body.append(parent);
		return {
			parent,
			view: new EditorView({
				parent,
				state: createState(
					documentText,
					'Ideas.md',
					additionalExtensions,
					isPhone,
					isMobile,
				),
			}),
		};
	}

	it('focuses on desktop click and moves selection to the line end', () => {
		const { parent, view } = createView('- Parent\n  - Child');
		const markers = view.dom.querySelectorAll<HTMLElement>('.bullet-zoom-marker');
		expect(markers).toHaveLength(2);

		markers[1]?.click();
		expect(getFocusSession(view.state)?.breadcrumbs.at(-1)?.label).toBe('Child');
		expect(view.state.selection.main.head).toBe(view.state.doc.line(2).to);
		view.destroy();
		parent.remove();
	});

	it.each([
		{ platform: 'desktop', isPhone: false, isMobile: false },
		{ platform: 'phone', isPhone: true, isMobile: true },
		{ platform: 'tablet', isPhone: false, isMobile: true },
	])(
		'hides the current $platform page marker and keeps parent navigation explicit',
		({ isPhone, isMobile }) => {
			const source = '- Parent\n  - Child\n    - Grandchild';
			const { parent, view } = createView(
				source,
				[],
				isPhone,
				isMobile,
			);
			const markerAt = (anchor: number): HTMLElement | undefined =>
				Array.from(
					view.contentDOM.querySelectorAll<HTMLElement>('.bullet-zoom-marker'),
				).find((marker) => view.posAtDOM(marker) === anchor);
			const grandchildAnchor = view.state.doc.line(3).from + 4;
			const childAnchor = view.state.doc.line(2).from + 2;
			const parentAnchor = view.state.doc.line(1).from;
			const requestMeasureSpy = vi.spyOn(view, 'requestMeasure');

			markerAt(grandchildAnchor)?.click();
			expect(getFocusSession(view.state)?.anchor).toBe(grandchildAnchor);
			const retainedSelection = view.state.selection;
			expect(markerAt(grandchildAnchor)).toBeUndefined();
			expect(focusParent(view)).toBe(true);
			expect(getFocusSession(view.state)?.anchor).toBe(childAnchor);
			expect(view.state.selection.eq(retainedSelection)).toBe(true);
			expect(markerAt(childAnchor)).toBeUndefined();
			expect(focusParent(view)).toBe(true);
			expect(getFocusSession(view.state)?.anchor).toBe(parentAnchor);
			expect(view.state.selection.eq(retainedSelection)).toBe(true);
			expect(markerAt(parentAnchor)).toBeUndefined();
			expect(focusParent(view)).toBe(true);
			expect(getFocusSession(view.state)).toBeNull();
			expect(view.state.selection.eq(retainedSelection)).toBe(true);
			expect(view.state.doc.toString()).toBe(source);
			if (isPhone) {
				expect(
					requestMeasureSpy.mock.calls.some(
						([request]) => request !== undefined,
					),
				).toBe(true);
			}
			view.destroy();
			parent.remove();
		},
	);

	it('enters a different phone marker instead of returning from the current focus', () => {
		const { parent, view } = createView(
			'- Parent\n  - Child A\n  - Child B',
			[],
			true,
			true,
		);
		const childB = view.state.doc.line(3).from + 2;
		const markerAt = (anchor: number): HTMLElement | undefined =>
			Array.from(
				view.contentDOM.querySelectorAll<HTMLElement>('.bullet-zoom-marker'),
			).find((marker) => view.posAtDOM(marker) === anchor);

		markerAt(0)?.click();
		expect(getFocusSession(view.state)?.anchor).toBe(0);
		markerAt(childB)?.click();
		expect(getFocusSession(view.state)?.anchor).toBe(childB);
		view.destroy();
		parent.remove();
	});

	it.each([
		{
			direction: 'LTR',
			markerLeft: 26,
			markerRight: 34,
			contentX: 50,
			acceptedX: 40,
			rejectedTextX: 50,
		},
		{
			direction: 'RTL',
			markerLeft: 90,
			markerRight: 98,
			contentX: 70,
			acceptedX: 84,
			rejectedTextX: 70,
		},
	])(
		'accepts only the bounded $direction marker gutter before editable content',
		({ markerLeft, markerRight, contentX, acceptedX, rejectedTextX }) => {
			const createGeometryView = () => {
				const { parent, view } = createView('- Parent', [], true, true);
				const line = view.contentDOM.querySelector<HTMLElement>('.cm-line');
				const marker = line?.querySelector<HTMLElement>('.bullet-zoom-marker');
				if (line === null || marker == null) {
					throw new Error('Expected a rendered mobile Bullet marker');
				}
				vi.spyOn(line, 'getBoundingClientRect').mockReturnValue({
					left: 0,
					right: 120,
					top: 10,
					bottom: 38,
					width: 120,
					height: 28,
					x: 0,
					y: 10,
					toJSON: () => ({}),
				});
				vi.spyOn(marker, 'getBoundingClientRect').mockReturnValue({
					left: markerLeft,
					right: markerRight,
					top: 18,
					bottom: 26,
					width: markerRight - markerLeft,
					height: 8,
					x: markerLeft,
					y: 18,
					toJSON: () => ({}),
				});
				vi.spyOn(view, 'coordsAtPos').mockReturnValue({
					left: contentX,
					right: contentX,
					top: 18,
					bottom: 26,
				});
				const requestMeasureSpy = vi
					.spyOn(view, 'requestMeasure')
					.mockImplementation(() => {});
				return { parent, view, line, requestMeasureSpy };
			};
			const dispatchAt = (line: HTMLElement, x: number): MouseEvent => {
				const event = new MouseEvent('click', {
					bubbles: true,
					cancelable: true,
					clientX: x,
					clientY: 22,
				});
				line.dispatchEvent(event);
				return event;
			};

			const accepted = createGeometryView();
			const acceptedSource = accepted.view.state.doc.toString();
			const acceptedEvent = dispatchAt(accepted.line, acceptedX);
			expect(acceptedEvent.defaultPrevented).toBe(true);
			expect(getFocusSession(accepted.view.state)?.anchor).toBe(0);
			expect(accepted.view.state.selection.main.head).toBe(
				accepted.view.state.doc.line(1).to,
			);
			expect(accepted.view.state.doc.toString()).toBe(acceptedSource);
			expect(
				accepted.requestMeasureSpy.mock.calls.some(
					([request]) => request !== undefined,
				),
			).toBe(true);
			accepted.view.destroy();
			accepted.parent.remove();

			const rejected = createGeometryView();
			const rejectedSource = rejected.view.state.doc.toString();
			const selection = rejected.view.state.selection;
			const rejectedEvent = dispatchAt(rejected.line, rejectedTextX);
			expect(rejectedEvent.defaultPrevented).toBe(false);
			expect(getFocusSession(rejected.view.state)).toBeNull();
			expect(rejected.view.state.selection.eq(selection)).toBe(true);
			expect(rejected.view.state.doc.toString()).toBe(rejectedSource);
			rejected.view.destroy();
			rejected.parent.remove();
		},
	);

	it('caps the expanded phone marker target at 28 pixels and the current line', () => {
		const { parent, view } = createView('- Parent', [], true, true);
		const line = view.contentDOM.querySelector<HTMLElement>('.cm-line');
		const marker = line?.querySelector<HTMLElement>('.bullet-zoom-marker');
		if (line === null || marker == null) {
			throw new Error('Expected a rendered mobile Bullet marker');
		}
		vi.spyOn(line, 'getBoundingClientRect').mockReturnValue({
			left: 0,
			right: 120,
			top: 10,
			bottom: 38,
			width: 120,
			height: 28,
			x: 0,
			y: 10,
			toJSON: () => ({}),
		});
		vi.spyOn(marker, 'getBoundingClientRect').mockReturnValue({
			left: 36,
			right: 44,
			top: 18,
			bottom: 26,
			width: 8,
			height: 8,
			x: 36,
			y: 18,
			toJSON: () => ({}),
		});
		vi.spyOn(view, 'coordsAtPos').mockReturnValue({
			left: 72,
			right: 72,
			top: 18,
			bottom: 26,
		});

		const outsideHorizontal = new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
			clientX: 25,
			clientY: 22,
		});
		line.dispatchEvent(outsideHorizontal);
		expect(outsideHorizontal.defaultPrevented).toBe(false);
		const outsideLine = new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
			clientX: 40,
			clientY: 39,
		});
		line.dispatchEvent(outsideLine);
		expect(outsideLine.defaultPrevented).toBe(false);
		expect(getFocusSession(view.state)).toBeNull();
		view.destroy();
		parent.remove();
	});

	it('fails expanded mobile activation closed when geometry is unavailable', () => {
		const { parent, view } = createView('- Parent', [], true, true);
		const line = view.contentDOM.querySelector<HTMLElement>('.cm-line');
		const marker = line?.querySelector<HTMLElement>('.bullet-zoom-marker');
		if (line === null || marker == null) {
			throw new Error('Expected a rendered mobile Bullet marker');
		}
		const gutterEvent = new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
			clientX: 10,
			clientY: 10,
		});
		line.dispatchEvent(gutterEvent);
		expect(gutterEvent.defaultPrevented).toBe(false);
		expect(getFocusSession(view.state)).toBeNull();

		marker.click();
		expect(getFocusSession(view.state)?.anchor).toBe(0);
		view.destroy();
		parent.remove();
	});

	it('rejects stale mobile marker DOM after its Bullet becomes unsupported', () => {
		const { parent, view } = createView('- Parent', [], true, true);
		const marker = view.contentDOM.querySelector<HTMLElement>(
			'.bullet-zoom-marker',
		);
		if (marker === null) {
			throw new Error('Expected a rendered mobile Bullet marker');
		}
		view.dispatch({ changes: { from: 0, to: 1, insert: '1.' } });
		const event = new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
		});

		expect(marker.dispatchEvent(event)).toBe(true);
		expect(event.defaultPrevented).toBe(false);
		expect(getFocusSession(view.state)).toBeNull();
		expect(view.dom.querySelectorAll('.bullet-zoom-marker')).toHaveLength(0);
		view.destroy();
		parent.remove();
	});

	it('rejects a mobile descendant marker after its row is folded away', () => {
		const { parent, view } = createView(
			'- Parent\n  - Child',
			codeFolding(),
			true,
			true,
		);
		const childMarker = Array.from(
			view.contentDOM.querySelectorAll<HTMLElement>('.bullet-zoom-marker'),
		).find((marker) => view.posAtDOM(marker) === view.state.doc.line(2).from + 2);
		if (childMarker === undefined) {
			throw new Error('Expected the child mobile marker');
		}
		foldLine(view, 1);
		const event = new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
		});

		expect(childMarker.dispatchEvent(event)).toBe(true);
		expect(event.defaultPrevented).toBe(false);
		expect(getFocusSession(view.state)).toBeNull();
		view.destroy();
		parent.remove();
	});

	it('rejects a retained mobile marker after its editor view is destroyed', () => {
		const { parent, view } = createView('- Parent', [], true, true);
		const marker = view.contentDOM.querySelector<HTMLElement>(
			'.bullet-zoom-marker',
		);
		if (marker === null) {
			throw new Error('Expected a rendered mobile Bullet marker');
		}
		view.destroy();
		const event = new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
		});

		expect(() => marker.dispatchEvent(event)).not.toThrow();
		expect(event.defaultPrevented).toBe(false);
		parent.remove();
	});

	it('rejects foreign same-class mobile marker and line DOM', () => {
		const { parent, view } = createView('- Parent', [], true, true);
		const line = view.contentDOM.querySelector<HTMLElement>('.cm-line');
		if (line === null) {
			throw new Error('Expected a rendered mobile Bullet line');
		}
		const foreignMarker = document.createElement('span');
		foreignMarker.className = 'bullet-zoom-marker';
		const foreignCollapseIndicator = document.createElement('span');
		foreignCollapseIndicator.className = 'collapse-indicator';
		foreignMarker.append(foreignCollapseIndicator);
		line.append(foreignMarker);
		const foreignClick = new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
		});

		expect(foreignCollapseIndicator.dispatchEvent(foreignClick)).toBe(true);
		expect(foreignClick.defaultPrevented).toBe(false);
		expect(getFocusSession(view.state)).toBeNull();

		foreignMarker.remove();
		line.classList.add('bullet-zoom-marker');
		const lineClick = new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
		});
		expect(line.dispatchEvent(lineClick)).toBe(true);
		expect(lineClick.defaultPrevented).toBe(false);
		expect(getFocusSession(view.state)).toBeNull();
		view.destroy();
		parent.remove();
	});

	it.each([
		{ platform: 'desktop', isPhone: false, isMobile: false },
		{ platform: 'phone', isPhone: true, isMobile: true },
		{ platform: 'tablet', isPhone: false, isMobile: true },
	])('renders marker-only Zoom on $platform', ({ isPhone, isMobile }) => {
		const { parent, view } = createView(
			'- Parent\n  - Child',
			[],
			isPhone,
			isMobile,
		);

		expect(view.dom.querySelectorAll('.bullet-zoom-marker')).toHaveLength(2);
		expect(view.dom.querySelectorAll('button.bullet-zoom-row-control')).toHaveLength(
			0,
		);
		expect(view.dom.textContent).not.toContain('↘');
		expect(view.dom.textContent).not.toContain('↖');
		view.destroy();
		parent.remove();
	});

	it('unfolds a folded target before entering focus without projecting hidden descendant controls', () => {
		const source = '- Parent\n  - Child A\n  - Child B\n- Sibling';
		const { parent, view } = createView(source, codeFolding());
		const parentFold = foldLine(view, 1);

		expect(activeFoldRanges(view)).toEqual([parentFold]);
		expect(view.contentDOM.querySelectorAll('.cm-foldPlaceholder')).toHaveLength(
			1,
		);
		expect(view.contentDOM.querySelectorAll('.bullet-zoom-marker')).toHaveLength(2);

		const marker = view.contentDOM.querySelector<HTMLElement>(
			'.bullet-zoom-marker',
		);
		expect(marker).not.toBeNull();
		marker?.click();

		expect(activeFoldRanges(view)).toEqual([]);
		expect(view.contentDOM.querySelectorAll('.cm-foldPlaceholder')).toHaveLength(
			0,
		);
		expect(view.contentDOM.querySelectorAll('.bullet-zoom-marker')).toHaveLength(2);
		expect(view.contentDOM.querySelectorAll('.bullet-zoom-row-control')).toHaveLength(
			0,
		);
		expect(view.contentDOM.textContent).toContain('Parent');
		expect(view.contentDOM.textContent).toContain('Child A');
		expect(view.contentDOM.textContent).toContain('Child B');
		expect(view.contentDOM.textContent).not.toContain('Sibling');
		expect(view.state.doc.toString()).toBe(source);

		expect(focusParent(view)).toBe(true);
		expect(getFocusSession(view.state)).toBeNull();
		expect(activeFoldRanges(view)).toEqual([]);
		expect(view.contentDOM.querySelector('.cm-foldPlaceholder')).toBeNull();
		expect(view.contentDOM.textContent).toContain('Sibling');
		expect(view.state.doc.toString()).toBe(source);
		view.destroy();
		parent.remove();
	});

	it('uses the same folded-target transition for a phone marker tap', () => {
		const source = '- Parent\n  - Child A\n  - Child B';
		const { parent, view } = createView(source, codeFolding(), true);
		foldLine(view, 1);
		const marker = view.contentDOM.querySelector<HTMLElement>(
			'.bullet-zoom-marker',
		);

		expect(marker).not.toBeNull();
		marker?.click();

		expect(activeFoldRanges(view)).toEqual([]);
		expect(getFocusSession(view.state)?.breadcrumbs.at(-1)?.label).toBe(
			'Parent',
		);
		expect(view.state.selection.main.head).toBe(view.state.doc.line(1).to);
		expect(view.contentDOM.querySelector('.cm-foldPlaceholder')).toBeNull();
		expect(view.state.doc.toString()).toBe(source);
		view.destroy();
		parent.remove();
	});

	it('unfolds only the target while preserving an independently folded descendant', () => {
		const source = [
			'- Parent',
			'  - Child',
			'    - Grandchild',
			'  - Sibling',
		].join('\n');
		const { parent, view } = createView(source, codeFolding());
		const parentFold = foldLine(view, 1);
		const childFold = foldLine(view, 2);
		expect(activeFoldRanges(view)).toEqual([parentFold, childFold]);

		expect(enterFocusAt(view, view.state.doc.line(1).from, true)).toBe(true);

		expect(activeFoldRanges(view)).toEqual([childFold]);
		expect(view.contentDOM.querySelectorAll('.bullet-zoom-row-control')).toHaveLength(
			0,
		);
		expect(view.contentDOM.querySelectorAll('.cm-foldPlaceholder')).toHaveLength(
			1,
		);
		expect(view.state.doc.toString()).toBe(source);
		view.destroy();
		parent.remove();
	});

	it('preserves a descendant fold when a non-moving focus transition retains a covered selection', () => {
		const source = [
			'- Parent',
			'  - Child',
			'    - Grandchild',
			'  - Sibling',
		].join('\n');
		const { parent, view } = createView(source, codeFolding());
		const coveredSelection = view.state.doc.line(3).from + 4;
		view.dispatch({ selection: { anchor: coveredSelection } });
		const parentFold = foldLine(view, 1);
		const descendantFold = foldLine(view, 2);
		expect(activeFoldRanges(view)).toEqual([parentFold, descendantFold]);
		expect(enterFocusAt(view, view.state.doc.line(1).from)).toBe(true);

		expect(activeFoldRanges(view)).toEqual([descendantFold]);
		expect(view.state.selection.main.head).toBe(coveredSelection);
		expect(getFocusSession(view.state)?.breadcrumbs.at(-1)?.label).toBe(
			'Parent',
		);
		expect(view.state.doc.toString()).toBe(source);
		view.destroy();
		parent.remove();
	});

	it('keeps the no-fold focus path unchanged', () => {
		const source = '- Parent\n  - Child';
		const { parent, view } = createView(source, codeFolding());

		expect(activeFoldRanges(view)).toEqual([]);
		expect(enterFocusAt(view, 0, true)).toBe(true);

		expect(activeFoldRanges(view)).toEqual([]);
		expect(getFocusSession(view.state)?.breadcrumbs.at(-1)?.label).toBe(
			'Parent',
		);
		expect(view.state.selection.main.head).toBe(view.state.doc.line(1).to);
		expect(view.state.doc.toString()).toBe(source);
		view.destroy();
		parent.remove();
	});

	it('passes desktop collapse indicator clicks through', () => {
		const { parent, view } = createView(
			'- Parent\n  - Child',
			foldIndicatorExtension(),
		);
		const collapseIndicator = view.contentDOM.querySelector<HTMLElement>(
			'.collapse-indicator',
		);
		const nativeClickHandler = vi.fn();
		collapseIndicator?.addEventListener('click', nativeClickHandler);
		const selection = view.state.selection;
		const event = new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
		});

		expect(collapseIndicator?.dispatchEvent(event)).toBe(true);
		expect(event.defaultPrevented).toBe(false);
		expect(nativeClickHandler).toHaveBeenCalledTimes(1);
		expect(getFocusSession(view.state)).toBeNull();
		expect(view.state.selection.eq(selection)).toBe(true);
		view.destroy();
		parent.remove();
	});

	it('passes phone collapse indicator taps through', () => {
		const { parent, view } = createView(
			'- Parent\n  - Child',
			foldIndicatorExtension(),
			true,
		);
		const collapseIndicator = view.contentDOM.querySelector<HTMLElement>(
			'.collapse-indicator',
		);
		const nativeClickHandler = vi.fn();
		collapseIndicator?.addEventListener('click', nativeClickHandler);
		const selection = view.state.selection;
		const event = new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
		});

		expect(collapseIndicator?.dispatchEvent(event)).toBe(true);
		expect(event.defaultPrevented).toBe(false);
		expect(nativeClickHandler).toHaveBeenCalledTimes(1);
		expect(getFocusSession(view.state)).toBeNull();
		expect(view.state.selection.eq(selection)).toBe(true);
		view.destroy();
		parent.remove();
	});

	it('leaves the native phone fold transition in control during focus', () => {
		const source = '- Parent\n  - Child';
		const { parent, view } = createView(
			source,
			[codeFolding(), foldIndicatorExtension()],
			true,
			true,
		);
		const parentLine = view.state.doc.line(1);
		const range = foldable(view.state, parentLine.from, parentLine.to);
		const collapseIndicator = view.contentDOM.querySelector<HTMLElement>(
			'.collapse-indicator',
		);
		if (range === null || collapseIndicator === null) {
			throw new Error('Expected a native fold range and collapse indicator');
		}
		expect(enterFocusAt(view, parentLine.from, true)).toBe(true);
		const session = getFocusSession(view.state);
		const selection = view.state.selection;
		collapseIndicator.addEventListener('click', () => {
			view.dispatch({ effects: foldEffect.of(range) });
		});
		const event = new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
		});

		expect(collapseIndicator.dispatchEvent(event)).toBe(true);
		expect(event.defaultPrevented).toBe(false);
		expect(activeFoldRanges(view)).toEqual([range]);
		expect(getFocusSession(view.state)?.anchor).toBe(session?.anchor);
		expect(view.state.selection.eq(selection)).toBe(true);
		expect(view.state.doc.toString()).toBe(source);
		view.destroy();
		parent.remove();
	});

	it('preserves active focus when a visible collapse indicator is clicked', () => {
		const documentText = '- Parent\n  - Child';
		const childMarker = documentText.indexOf('-', 1);
		const { parent, view } = createView(
			documentText,
			foldIndicatorExtension(childMarker),
		);
		expect(enterFocusAt(view, 0)).toBe(true);
		const session = getFocusSession(view.state);
		const selection = view.state.selection;
		const collapseIndicator = view.contentDOM.querySelector<HTMLElement>(
			'.collapse-indicator',
		);
		const nativeClickHandler = vi.fn();
		collapseIndicator?.addEventListener('click', nativeClickHandler);
		const event = new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
		});

		expect(collapseIndicator?.dispatchEvent(event)).toBe(true);
		expect(event.defaultPrevented).toBe(false);
		expect(nativeClickHandler).toHaveBeenCalledTimes(1);
		expect(getFocusSession(view.state)?.anchor).toBe(session?.anchor);
		expect(view.state.selection.eq(selection)).toBe(true);
		view.destroy();
		parent.remove();
	});

	it('gives an exact marker click precedence over a nested collapse indicator', () => {
		const { parent, view } = createView(
			'- Parent\n  - Child',
			codeFolding(),
		);
		foldLine(view, 1);
		expect(activeFoldRanges(view)).toHaveLength(1);
		const marker = view.contentDOM.querySelector<HTMLElement>(
			'.bullet-zoom-marker',
		);
		const collapseIndicator = document.createElement('span');
		collapseIndicator.className = 'collapse-indicator collapse-icon';
		marker?.append(collapseIndicator);
		const nativeClickHandler = vi.fn();
		view.contentDOM.addEventListener('click', nativeClickHandler);
		const event = new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
		});

		expect(collapseIndicator.dispatchEvent(event)).toBe(false);
		expect(event.defaultPrevented).toBe(true);
		expect(nativeClickHandler).not.toHaveBeenCalled();
		expect(getFocusSession(view.state)?.anchor).toBe(0);
		expect(view.state.selection.main.head).toBe(view.state.doc.line(1).to);
		expect(activeFoldRanges(view)).toEqual([]);
		view.destroy();
		parent.remove();
	});

	it('ignores an Obsidian fold indicator on unsupported content', () => {
		const { parent, view } = createView('# Heading');
		const line = view.contentDOM.querySelector('.cm-line');
		const collapseIndicator = document.createElement('div');
		collapseIndicator.className = 'collapse-indicator collapse-icon';
		line?.prepend(collapseIndicator);

		collapseIndicator.click();
		expect(getFocusSession(view.state)).toBeNull();
		view.destroy();
		parent.remove();
	});

	it('uses the same synthesized click path for mobile tap and nested refocus', () => {
		const { parent, view } = createView(
			'- Parent\n  - Child\n    - Grandchild',
			[],
			true,
		);
		view.dom
			.querySelector<HTMLElement>('.bullet-zoom-marker')
			?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(getFocusSession(view.state)?.breadcrumbs.at(-1)?.label).toBe('Parent');

		const visibleMarkers = view.dom.querySelectorAll<HTMLElement>(
			'.bullet-zoom-marker',
		);
		const grandchildMarker = Array.from(visibleMarkers).find(
			(marker) =>
				view.posAtDOM(marker) === view.state.doc.line(3).from + 4,
		);
		grandchildMarker?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(getFocusSession(view.state)?.breadcrumbs.at(-1)?.label).toBe(
			'Grandchild',
		);
		view.destroy();
		parent.remove();
	});

	it('ignores unsupported task, numbered, and paragraph clicks', () => {
		const { parent, view } = createView('- [ ] Task\n1. Numbered\nParagraph');
		expect(view.dom.querySelectorAll('.bullet-zoom-marker')).toHaveLength(0);
		view.contentDOM.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(getFocusSession(view.state)).toBeNull();
		view.destroy();
		parent.remove();
	});
});

describe('focus page rebase (0.1.36)', () => {
	function createRebaseView(): { parent: HTMLDivElement; view: EditorView } {
		const parent = document.createElement('div');
		document.body.append(parent);
		const view = new EditorView({
			parent,
			state: createState(
				'- A\n  - B\n    - C 這是一段會折行的長文字\n      - D\n        - E',
			),
		});
		return { parent, view };
	}

	it('rebases branch lines to relative depth while focused', () => {
		const { parent, view } = createRebaseView();
		const anchorC = view.state.doc.line(3).from + 4;
		expect(enterFocusAt(view, anchorC)).toBe(true);
		const rebased = Array.from(
			view.contentDOM.querySelectorAll<HTMLElement>('.bullet-zoom-rebased-line'),
		);
		expect(rebased).toHaveLength(2);
		expect(
			rebased.map((line) =>
				line.style.getPropertyValue('--bullet-zoom-relative-depth').trim(),
			),
		).toEqual(['1', '2']);
		for (const line of rebased) {
			expect(line.textContent?.startsWith(' ')).toBe(false);
			expect(line.textContent?.startsWith('\t')).toBe(false);
		}
		const rootLine = view.contentDOM.querySelector('.bullet-zoom-focus-root-line');
		expect(rootLine).not.toBeNull();
		expect(exitFocus(view)).toBe(true);
		expect(
			view.contentDOM.querySelectorAll('.bullet-zoom-rebased-line'),
		).toHaveLength(0);
		expect(
			view.contentDOM.querySelectorAll('.bullet-zoom-focus-root-line'),
		).toHaveLength(0);
		view.destroy();
		parent.remove();
	});

	it('keeps the document unchanged while hiding branch indentation', () => {
		const { parent, view } = createRebaseView();
		const source = view.state.doc.toString();
		const anchorC = view.state.doc.line(3).from + 4;
		expect(enterFocusAt(view, anchorC)).toBe(true);
		expect(view.state.doc.toString()).toBe(source);
		view.destroy();
		parent.remove();
	});
});

describe('stray line handling (1.4.0)', () => {
	function createStrayView(
		documentText: string,
		autoFix: boolean,
	): { parent: HTMLDivElement; view: EditorView } {
		const parent = document.createElement('div');
		document.body.append(parent);
		const view = new EditorView({
			parent,
			state: EditorState.create({
				doc: documentText,
				extensions: [
					markdown(),
					history(),
					focusFilePath.of('Ideas.md'),
					focusNoteTitle.of('Ideas'),
					focusLivePreview.of(true),
					createFocusExtension({
						isPhone: false,
						isMobile: false,
						autoFixStrayLines: autoFix,
					}),
				],
			}),
		});
		return { parent, view };
	}

	it('never shrinks the visible end while focused', () => {
		const { parent, view } = createStrayView('- Topic\n  - A\n- Later', false);
		expect(enterFocusAt(view, 0)).toBe(true);
		const before = getFocusSession(view.state);
		expect(before?.visibleTo).toBe(view.state.doc.line(2).to);
		view.dispatch({
			changes: { from: before?.visibleTo ?? 0, insert: '\n\ndictated text' },
		});
		const after = getFocusSession(view.state);
		const strayLine = view.state.doc.line(4);
		expect(strayLine.text).toBe('dictated text');
		expect(after?.visibleTo).toBeGreaterThanOrEqual(strayLine.to);
		const covering = decorationRanges(view.state).filter(
			(range) => range.from <= strayLine.from && range.to >= strayLine.to,
		);
		expect(covering).toHaveLength(0);
		view.destroy();
		parent.remove();
	});

	it('keeps stray lines visible instead of hiding them', () => {
		const { parent, view } = createStrayView(
			'- Topic\n  - A\n\ndictated text',
			false,
		);
		expect(enterFocusAt(view, 0)).toBe(true);
		const strayLine = view.state.doc.line(4);
		const hidden = decorationRanges(view.state).filter(
			(range) => range.from <= strayLine.from && range.to >= strayLine.to,
		);
		expect(hidden).toHaveLength(0);
		view.destroy();
		parent.remove();
	});

	it('repairs stray lines after edits settle and keeps one undo step', async () => {
		vi.useFakeTimers();
		const { parent, view } = createStrayView('- Topic\n  - A', true);
		view.focus();
		expect(enterFocusAt(view, 0)).toBe(true);
		view.dispatch({
			changes: {
				from: view.state.doc.length,
				insert: '\n\nfirst idea\n\nsecond idea',
			},
		});
		expect(view.state.doc.toString()).toBe(
			'- Topic\n  - A\n\nfirst idea\n\nsecond idea',
		);
		await vi.advanceTimersByTimeAsync(700);
		expect(view.state.doc.toString()).toBe(
			'- Topic\n  - A\n    - first idea\n    - second idea',
		);
		undo(view);
		expect(view.state.doc.toString()).toBe(
			'- Topic\n  - A\n\nfirst idea\n\nsecond idea',
		);
		vi.useRealTimers();
		view.destroy();
		parent.remove();
	});

	it('never repairs a pane the user is not typing in', async () => {
		vi.useFakeTimers();
		const { parent, view } = createStrayView('- Topic\n  - A', true);
		view.focus();
		expect(enterFocusAt(view, 0)).toBe(true);
		// The pane loses focus, then its document changes anyway: sync, the same
		// note open in another pane, or another plugin.
		view.contentDOM.blur();
		expect(view.hasFocus).toBe(false);
		view.dispatch({
			changes: {
				from: view.state.doc.length,
				insert: '\n\ndictated text',
			},
		});
		await vi.advanceTimersByTimeAsync(700);
		expect(view.state.doc.toString()).toBe(
			'- Topic\n  - A\n\ndictated text',
		);
		vi.useRealTimers();
		view.destroy();
		parent.remove();
	});

	it('never modifies the document when no focus session is active', async () => {
		vi.useFakeTimers();
		const { parent, view } = createStrayView('- A', true);
		expect(getFocusSession(view.state)).toBeNull();
		view.dispatch({
			changes: {
				from: view.state.doc.length,
				insert: '\n\ndictated text',
			},
		});
		await vi.advanceTimersByTimeAsync(700);
		expect(view.state.doc.toString()).toBe('- A\n\ndictated text');
		vi.useRealTimers();
		view.destroy();
		parent.remove();
	});

	it('does not touch the document when auto-fix is disabled', async () => {
		vi.useFakeTimers();
		const { parent, view } = createStrayView('- Topic\n  - A', false);
		expect(enterFocusAt(view, 0)).toBe(true);
		view.dispatch({
			changes: { from: view.state.doc.length, insert: '\n\ndictated text' },
		});
		await vi.advanceTimersByTimeAsync(700);
		expect(view.state.doc.toString()).toBe('- Topic\n  - A\n\ndictated text');
		vi.useRealTimers();
		view.destroy();
		parent.remove();
	});
});

describe('long press menu gesture (1.12.0)', () => {
	function mountMarkerView(
		onLongPress: (
			view: EditorView,
			markerFrom: number,
			clientX: number,
			clientY: number,
			pointerId: number,
		) => void,
		openOnTap = false,
	): {
		parent: HTMLDivElement;
		view: EditorView;
	} {
		const parent = document.createElement('div');
		document.body.append(parent);
		const view = new EditorView({
			parent,
			state: EditorState.create({
				doc: '- Parent\n  - Child',
				extensions: [
					markdown(),
					focusFilePath.of('Ideas.md'),
					focusNoteTitle.of('Ideas'),
					focusLivePreview.of(true),
					createFocusExtension({
						isPhone: true,
						isMobile: true,
						radialMenu: {
							enabled: true,
							allowMouse: false,
							openOnTap,
							pressDuration: 450,
							onLongPress,
						},
					}),
				],
			}),
		});
		vi.spyOn(view, 'posAtCoords').mockReturnValue(0);
		vi.spyOn(view, 'coordsAtPos').mockImplementation((position: number) => {
			if (position === 0) {
				return { left: 40, right: 46, top: 10, bottom: 30 };
			}
			if (position === 1) {
				return { left: 46, right: 52, top: 10, bottom: 30 };
			}
			return { left: 60, right: 66, top: 10, bottom: 30 };
		});
		return { parent, view };
	}

	function marker(
		type: string,
		x: number,
		y: number,
		pointerType = 'touch',
	): Event {
		const event = new MouseEvent(type, {
			bubbles: true,
			cancelable: true,
			clientX: x,
			clientY: y,
		});
		Object.defineProperties(event, {
			pointerId: { value: 3 },
			pointerType: { value: pointerType },
			isPrimary: { value: true },
		});
		return event;
	}

	it('zooms when the press is released before the timer', async () => {
		vi.useFakeTimers();
		const onLongPress = vi.fn();
		const { parent, view } = mountMarkerView(onLongPress);
		view.contentDOM.dispatchEvent(marker('pointerdown', 46, 20));
		await vi.advanceTimersByTimeAsync(120);
		view.contentDOM.dispatchEvent(marker('pointerup', 46, 20));
		expect(getFocusSession(view.state)?.anchor).toBe(0);
		expect(onLongPress).not.toHaveBeenCalled();
		vi.useRealTimers();
		view.destroy();
		parent.remove();
	});

	it('opens the menu when the press is held', async () => {
		vi.useFakeTimers();
		const onLongPress = vi.fn();
		const { parent, view } = mountMarkerView(onLongPress);
		view.contentDOM.dispatchEvent(marker('pointerdown', 46, 20));
		await vi.advanceTimersByTimeAsync(500);
		expect(onLongPress).toHaveBeenCalledTimes(1);
		expect(onLongPress.mock.calls[0]?.[1]).toBe(0);
		expect(getFocusSession(view.state)).toBeNull();
		vi.useRealTimers();
		view.destroy();
		parent.remove();
	});

	it('abandons the gesture when the pointer moves away', async () => {
		vi.useFakeTimers();
		const onLongPress = vi.fn();
		const { parent, view } = mountMarkerView(onLongPress);
		view.contentDOM.dispatchEvent(marker('pointerdown', 46, 20));
		view.contentDOM.dispatchEvent(marker('pointermove', 46, 60));
		await vi.advanceTimersByTimeAsync(500);
		view.contentDOM.dispatchEvent(marker('pointerup', 46, 60));
		expect(onLongPress).not.toHaveBeenCalled();
		expect(getFocusSession(view.state)).toBeNull();
		vi.useRealTimers();
		view.destroy();
		parent.remove();
	});

	it('keeps zooming immediately for mouse presses', () => {
		const onLongPress = vi.fn();
		const { parent, view } = mountMarkerView(onLongPress);
		view.contentDOM.dispatchEvent(marker('pointerdown', 46, 20, 'mouse'));
		expect(getFocusSession(view.state)?.anchor).toBe(0);
		expect(onLongPress).not.toHaveBeenCalled();
		view.destroy();
		parent.remove();
	});
});

describe('fold gutter (1.11.0)', () => {
	function mountFoldView(documentText: string): {
		parent: HTMLDivElement;
		view: EditorView;
	} {
		const parent = document.createElement('div');
		document.body.append(parent);
		const view = new EditorView({
			parent,
			state: createState(documentText, 'Ideas.md', [
				codeFolding(),
				indentUnit.of('  '),
			]),
		});
		vi.spyOn(view, 'posAtCoords').mockReturnValue(
			view.state.doc.line(2).from + 2,
		);
		vi.spyOn(view, 'coordsAtPos').mockImplementation((position: number) => {
			const markerFrom = view.state.doc.line(2).from + 2;
			if (position === markerFrom) {
				return { left: 60, right: 66, top: 10, bottom: 30 };
			}
			if (position === markerFrom + 1) {
				return { left: 66, right: 72, top: 10, bottom: 30 };
			}
			return { left: 80, right: 86, top: 10, bottom: 30 };
		});
		return { parent, view };
	}

	function pressGutter(view: EditorView): MouseEvent {
		const press = new MouseEvent('pointerdown', {
			bubbles: true,
			cancelable: true,
			clientX: 12,
			clientY: 20,
		});
		Object.defineProperties(press, {
			isPrimary: { value: true },
			pointerId: { value: 1 },
		});
		view.contentDOM.dispatchEvent(press);
		return press;
	}

	it('plans a fold and then an unfold for a foldable line', () => {
		const { parent, view } = mountFoldView('- A\n  - B\n    - C');
		const anchor = view.state.doc.line(2).from + 2;
		const first = planFoldToggle(view.state, anchor);
		expect(first?.action).toBe('fold');
		if (first !== null) {
			view.dispatch({
				effects: foldEffect.of({ from: first.from, to: first.to }),
			});
		}
		expect(planFoldToggle(view.state, anchor)?.action).toBe('unfold');
		view.destroy();
		parent.remove();
	});

	it('returns null for a line with nothing to fold', () => {
		const { parent, view } = mountFoldView('- A\n  - B\n- C');
		expect(planFoldToggle(view.state, view.state.doc.line(2).from + 2)).toBeNull();
		view.destroy();
		parent.remove();
	});

	it('folds from the far left of a nested line and toggles back', () => {
		const { parent, view } = mountFoldView('- A\n  - B\n    - C');
		const press = pressGutter(view);
		expect(press.defaultPrevented).toBe(true);
		expect(activeFoldRanges(view).length).toBe(1);
		pressGutter(view);
		expect(activeFoldRanges(view).length).toBe(0);
		view.destroy();
		parent.remove();
	});

	it('does not intercept the gutter of a leaf line', () => {
		const { parent, view } = mountFoldView('- A\n  - B\n- C');
		const press = pressGutter(view);
		expect(press.defaultPrevented).toBe(false);
		expect(activeFoldRanges(view).length).toBe(0);
		view.destroy();
		parent.remove();
	});
});

describe('marker tap zones (1.10.0)', () => {
	it('classifies presses across the line', () => {
		const bounds = {
			markerLeft: 40,
			markerRight: 52,
			contentLeft: 60,
			tolerance: 6,
		};
		expect(classifyLineTapZone({ ...bounds, x: 20 })).toBe('fold');
		expect(classifyLineTapZone({ ...bounds, x: 46 })).toBe('marker');
		expect(classifyLineTapZone({ ...bounds, x: 56 })).toBe('marker');
		expect(classifyLineTapZone({ ...bounds, x: 90 })).toBe('content');
	});

	it('never lets the marker zone run past the content start', () => {
		expect(
			classifyLineTapZone({
				x: 59,
				markerLeft: 40,
				markerRight: 58,
				contentLeft: 58,
				tolerance: 6,
			}),
		).toBe('content');
	});

	it('zooms on pointerdown even when the editor is unfocused', () => {
		const parent = document.createElement('div');
		document.body.append(parent);
		const view = new EditorView({
			parent,
			state: createState('- Parent\n  - Child'),
		});
		vi.spyOn(view, 'posAtCoords').mockReturnValue(0);
		vi.spyOn(view, 'coordsAtPos').mockImplementation((position: number) => {
			if (position === 0) {
				return { left: 40, right: 46, top: 10, bottom: 30 };
			}
			if (position === 1) {
				return { left: 46, right: 52, top: 10, bottom: 30 };
			}
			return { left: 60, right: 66, top: 10, bottom: 30 };
		});

		const press = new MouseEvent('pointerdown', {
			bubbles: true,
			cancelable: true,
			clientX: 46,
			clientY: 20,
		});
		Object.defineProperties(press, {
			isPrimary: { value: true },
			pointerId: { value: 1 },
		});
		view.contentDOM.dispatchEvent(press);

		expect(getFocusSession(view.state)?.anchor).toBe(0);
		expect(press.defaultPrevented).toBe(true);

		const follow = new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
			clientX: 46,
			clientY: 20,
		});
		view.contentDOM.dispatchEvent(follow);
		expect(follow.defaultPrevented).toBe(true);
		expect(getFocusSession(view.state)?.anchor).toBe(0);
		view.destroy();
		parent.remove();
	});

	it('leaves content-zone presses untouched', () => {
		const parent = document.createElement('div');
		document.body.append(parent);
		const view = new EditorView({
			parent,
			state: createState('- Parent\n  - Child'),
		});
		vi.spyOn(view, 'posAtCoords').mockReturnValue(0);
		vi.spyOn(view, 'coordsAtPos').mockImplementation((position: number) => {
			if (position === 0) {
				return { left: 40, right: 46, top: 10, bottom: 30 };
			}
			if (position === 1) {
				return { left: 46, right: 52, top: 10, bottom: 30 };
			}
			return { left: 60, right: 66, top: 10, bottom: 30 };
		});

		for (const x of [90]) {
			const press = new MouseEvent('pointerdown', {
				bubbles: true,
				cancelable: true,
				clientX: x,
				clientY: 20,
			});
			Object.defineProperties(press, {
				isPrimary: { value: true },
				pointerId: { value: 1 },
			});
			view.contentDOM.dispatchEvent(press);
			expect(press.defaultPrevented).toBe(false);
		}
		expect(getFocusSession(view.state)).toBeNull();
		view.destroy();
		parent.remove();
	});
});

describe('plugin commands and safe failures', () => {
	function createView(
		documentText: string,
		livePreview = true,
		additionalExtensions: Extension = [],
	): { parent: HTMLDivElement; view: EditorView } {
		const parent = document.createElement('div');
		document.body.append(parent);
		const state = EditorState.create({
			doc: documentText,
			extensions: [
				markdown(),
				focusFilePath.of('Ideas.md'),
				focusNoteTitle.of('Ideas'),
					focusLivePreview.of(livePreview),
					createFocusExtension({ isPhone: false, isMobile: false }),
					additionalExtensions,
			],
		});
		return { parent, view: new EditorView({ parent, state }) };
	}

	it('focuses the Bullet Point at the command cursor', () => {
		const { parent, view } = createView('- Parent\n  - Child');
		const child = view.state.doc.line(2);
		view.dispatch({ selection: { anchor: child.to } });
		const notices: string[] = [];

		expect(runFocusCommand(view, (message) => notices.push(message))).toBe(true);
		expect(getFocusSession(view.state)?.breadcrumbs.at(-1)?.label).toBe('Child');
		expect(view.state.selection.main.head).toBe(child.to);
		expect(notices).toEqual([]);
		view.destroy();
		parent.remove();
	});

	it('unfolds a folded Bullet Point through the focus command', () => {
		const source = '- Parent\n  - Child';
		const { parent, view } = createView(source, true, codeFolding());
		foldLine(view, 1);
		const notices: string[] = [];

		expect(runFocusCommand(view, (message) => notices.push(message))).toBe(true);

		expect(activeFoldRanges(view)).toEqual([]);
		expect(getFocusSession(view.state)?.breadcrumbs.at(-1)?.label).toBe(
			'Parent',
		);
		expect(notices).toEqual([]);
		expect(view.state.doc.toString()).toBe(source);
		view.destroy();
		parent.remove();
	});

	it('unfolds an ancestor fold that covers the command target', () => {
		const source = [
			'- Parent',
			'  - Child',
			'    - Grandchild',
			'  - Sibling',
		].join('\n');
		const { parent, view } = createView(source, true, codeFolding());
		const child = view.state.doc.line(2);
		view.dispatch({ selection: { anchor: child.from + 4 } });
		const parentFold = foldLine(view, 1);
		expect(activeFoldRanges(view)).toEqual([parentFold]);
		const notices: string[] = [];

		expect(runFocusCommand(view, (message) => notices.push(message))).toBe(true);

		expect(activeFoldRanges(view)).toEqual([]);
		expect(getFocusSession(view.state)?.breadcrumbs.at(-1)?.label).toBe('Child');
		expect(view.contentDOM.querySelector('.cm-foldPlaceholder')).toBeNull();
		expect(view.contentDOM.textContent).toContain('Grandchild');
		expect(view.state.doc.toString()).toBe(source);
		expect(notices).toEqual([]);
		view.destroy();
		parent.remove();
	});

	it('shows the exact Live Preview notice without changing Source mode', () => {
		const { parent, view } = createView('- Parent', false);
		const source = view.state.doc.toString();
		const selection = view.state.selection;
		const notices: string[] = [];

		expect(runFocusCommand(view, (message) => notices.push(message))).toBe(false);
		expect(notices).toEqual([LIVE_PREVIEW_REQUIRED_NOTICE]);
		expect(getFocusSession(view.state)).toBeNull();
		expect(view.dom.querySelectorAll('.bullet-zoom-marker')).toHaveLength(0);
		expect(view.state.doc.toString()).toBe(source);
		expect(view.state.selection.eq(selection)).toBe(true);
		view.destroy();
		parent.remove();
	});

	it('shows the exact unsupported-cursor notice without changing the document', () => {
		const { parent, view } = createView('Paragraph');
		const source = view.state.doc.toString();
		const notices: string[] = [];

		expect(runFocusCommand(view, (message) => notices.push(message))).toBe(false);
		expect(notices).toEqual([SUPPORTED_BULLET_REQUIRED_NOTICE]);
		expect(getFocusSession(view.state)).toBeNull();
		expect(view.state.doc.toString()).toBe(source);
		view.destroy();
		parent.remove();
	});

	it('guards an unavailable CodeMirror adapter and reports the exact notice', () => {
		const notices: string[] = [];
		expect(resolveCodeMirrorView(undefined)).toBeNull();
		expect(resolveCodeMirrorView({ cm: 'not-an-editor-view' })).toBeNull();
		expect(runFocusCommand(null, (message) => notices.push(message))).toBe(false);
		expect(notices).toEqual([EDITOR_VIEW_UNAVAILABLE_NOTICE]);
	});

	it('exits active focus and stays quiet when focus is already clear', () => {
		const { parent, view } = createView('- Parent\n  - Child');
		view.dispatch({ effects: focusAtEffect.of(view.state.doc.line(2).from) });
		const notices: string[] = [];

		expect(runExitCommand(view, (message) => notices.push(message))).toBe(true);
		expect(getFocusSession(view.state)).toBeNull();
		expect(runExitCommand(view, (message) => notices.push(message))).toBe(false);
		expect(notices).toEqual([]);
		view.destroy();
		parent.remove();
	});

	it('reports adapter failure for the exit command', () => {
		const notices: string[] = [];
		expect(runExitCommand(null, (message) => notices.push(message))).toBe(false);
		expect(notices).toEqual([EDITOR_VIEW_UNAVAILABLE_NOTICE]);
	});

	it('runs parent navigation and stays quiet when focus is already clear', () => {
		const { parent, view } = createView('- Parent\n  - Child');
		view.dispatch({ effects: focusAtEffect.of(view.state.doc.line(2).from) });
		const notices: string[] = [];

		expect(runParentCommand(view, (message) => notices.push(message))).toBe(true);
		expect(getFocusSession(view.state)?.breadcrumbs.at(-1)?.label).toBe(
			'Parent',
		);
		expect(runParentCommand(view, (message) => notices.push(message))).toBe(true);
		expect(getFocusSession(view.state)).toBeNull();
		expect(runParentCommand(view, (message) => notices.push(message))).toBe(false);
		expect(notices).toEqual([NO_ANCESTOR_NOTICE]);
		view.destroy();
		parent.remove();
	});

	it('moves the cursor to the parent bullet when nothing is zoomed', () => {
		const { parent, view } = createView('- Parent\n\t- Child\n\t\t- Deep');
		const deep = view.state.doc.line(3);
		view.dispatch({ selection: { anchor: deep.to } });
		const notices: string[] = [];

		expect(runParentCommand(view, (message) => notices.push(message))).toBe(true);
		expect(view.state.doc.lineAt(view.state.selection.main.head).number).toBe(2);
		expect(notices).toEqual([]);
		view.destroy();
		parent.remove();
	});

	it('jumps to the outermost bullet for context', () => {
		const { parent, view } = createView('- Parent\n\t- Child\n\t\t- Deep');
		const deep = view.state.doc.line(3);
		view.dispatch({ selection: { anchor: deep.to } });
		const notices: string[] = [];

		expect(runTopLevelCommand(view, (message) => notices.push(message))).toBe(
			true,
		);
		const head = view.state.selection.main.head;
		expect(view.state.doc.lineAt(head).number).toBe(1);
		// The cursor lands on the text, not before the marker.
		expect(view.state.doc.sliceString(head, head + 6)).toBe('Parent');
		expect(notices).toEqual([]);
		view.destroy();
		parent.remove();
	});

	it('explains when a bullet has no parent', () => {
		const { parent, view } = createView('- Only');
		view.dispatch({ selection: { anchor: 3 } });
		const notices: string[] = [];

		expect(runTopLevelCommand(view, (message) => notices.push(message))).toBe(
			false,
		);
		expect(notices).toEqual([NO_ANCESTOR_NOTICE]);
		view.destroy();
		parent.remove();
	});

	it('reports adapter failure for the top-level command', () => {
		const notices: string[] = [];
		expect(runTopLevelCommand(null, (message) => notices.push(message))).toBe(
			false,
		);
		expect(notices).toEqual([EDITOR_VIEW_UNAVAILABLE_NOTICE]);
	});

	it('reports adapter failure for the parent command', () => {
		const notices: string[] = [];
		expect(runParentCommand(null, (message) => notices.push(message))).toBe(
			false,
		);
		expect(notices).toEqual([EDITOR_VIEW_UNAVAILABLE_NOTICE]);
	});
});

describe('per-editor breadcrumb panel', () => {
	it.each([
		{ platform: 'desktop', isPhone: false, isMobile: false },
		{ platform: 'phone', isPhone: true, isMobile: true },
		{ platform: 'tablet', isPhone: false, isMobile: true },
	])(
		'promotes the live focus root and renders a footer on $platform',
		({ isPhone, isMobile }) => {
			const source = '- **Write** the draft\n  - Child';
			const { parent, view } = createView(source, [], isPhone, isMobile);
			expect(enterFocusAt(view, 0)).toBe(true);
			const title = parent.querySelector<HTMLElement>(
				'.bullet-zoom-focus-root-line',
			);
			const footer = parent.querySelector<HTMLElement>(
				'.bullet-zoom-focus-page-footer',
			);
			const addChild = footer?.querySelector<HTMLButtonElement>(
				'.bullet-zoom-add-child',
			);

			expect(title?.textContent).toContain('Write');
			expect(title?.querySelector('.bullet-zoom-marker')).toBeNull();
			expect(footer).not.toBeNull();
			expect(addChild?.textContent).toBe('＋');
			expect(addChild?.getAttribute('aria-label')).toBe(
				'Add a child bullet under Write the draft',
			);
			const childLine = Array.from(
				view.contentDOM.querySelectorAll<HTMLElement>('.cm-line'),
			).find((line) => line.textContent?.includes('Child'));
			expect(childLine).not.toBeUndefined();
			expect(
				childLine?.compareDocumentPosition(footer ?? childLine) ?? 0,
			).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
			if (isPhone) {
				const navigation = parent.querySelector(
					'.bullet-zoom-breadcrumbs-mobile-block',
				);
				expect(
					navigation?.compareDocumentPosition(title ?? navigation) ?? 0,
				).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
			}
			expect(view.state.doc.toString()).toBe(source);
			view.destroy();
			parent.remove();
		},
	);

	it('keeps hostile title content inert and shows an editable empty placeholder', () => {
		const { parent, view } = createView(
			'- <img src=x onerror=alert(1)>\n-   ',
		);
		expect(enterFocusAt(view, 0)).toBe(true);
		let title = parent.querySelector<HTMLElement>(
			'.bullet-zoom-focus-root-line',
		);
		expect(title?.textContent).toContain('<img src=x onerror=alert(1)>');
		expect(title?.querySelector('img:not(.cm-widgetBuffer)')).toBeNull();

		expect(enterFocusAt(view, view.state.doc.line(2).from)).toBe(true);
		title = parent.querySelector('.bullet-zoom-focus-root-line');
		expect(title?.textContent).toBe('Untitled bullet');
		expect(
			parent
				.querySelector('.bullet-zoom-add-child')
				?.getAttribute('aria-label'),
		).toBe('Add a child bullet under Untitled bullet');
		view.destroy();
		parent.remove();
	});

	it('removes the focus page presentation on exit and keeps another pane unchanged', () => {
		const first = createView('- Parent');
		const second = createView('- Other');
		expect(enterFocusAt(first.view, 0)).toBe(true);
		expect(
			first.parent.querySelector('.bullet-zoom-focus-root-line'),
		).not.toBeNull();
		expect(
			second.parent.querySelector('.bullet-zoom-focus-root-line'),
		).toBeNull();
		expect(exitFocus(first.view)).toBe(true);
		expect(
			first.parent.querySelector('.bullet-zoom-focus-root-line'),
		).toBeNull();
		first.view.destroy();
		second.view.destroy();
		first.parent.remove();
		second.parent.remove();
	});

	it('keeps the promoted root live-editable with one visible label and one-step Undo', () => {
		const source = '- Parent\n  - Child';
		const { parent, view } = createView(source, history());
		expect(enterFocusAt(view, 0)).toBe(true);
		const root = findSupportedBullet(view.state, 0);
		expect(root).not.toBeNull();
		if (root === null) {
			return;
		}

		expect(
			Array.from(parent.querySelectorAll('.cm-line')).filter((line) =>
				line.textContent?.includes('Parent'),
			),
		).toHaveLength(1);
		view.dispatch({
			changes: { from: root.contentFrom, to: root.lineTo, insert: 'Edited' },
			selection: { anchor: root.contentFrom + 'Edited'.length },
		});
		expect(view.state.doc.toString()).toBe('- Edited\n  - Child');
		expect(
			parent.querySelector('.bullet-zoom-focus-root-line')?.textContent,
		).toContain('Edited');
		expect(undo(view)).toBe(true);
		expect(view.state.doc.toString()).toBe(source);
		expect(
			parent.querySelector('.bullet-zoom-focus-root-line')?.textContent,
		).toContain('Parent');
		view.destroy();
		parent.remove();
	});

	it('appends one blank direct child, retains parent focus, and undoes in one step', () => {
		const source = '- Parent\n  - Child A\n  - Child B';
		const { parent, view } = createView(source, history());
		expect(enterFocusAt(view, 0)).toBe(true);
		const addChild = parent.querySelector<HTMLButtonElement>(
			'.bullet-zoom-add-child',
		);
		addChild?.click();

		expect(view.state.doc.toString()).toBe(
			'- Parent\n  - Child A\n  - Child B\n  - ',
		);
		expect(getFocusSession(view.state)?.breadcrumbs.at(-1)?.label).toBe(
			'Parent',
		);
		expect(view.state.selection.main.empty).toBe(true);
		expect(view.state.selection.main.head).toBe(view.state.doc.line(4).to);
		expect(undo(view)).toBe(true);
		expect(view.state.doc.toString()).toBe(source);
		expect(undo(view)).toBe(false);
		view.destroy();
		parent.remove();
	});

	it('uses the configured Outliner indentation unit for the appended child', () => {
		const source = '- Fundraising video';
		const { parent, view } = createView(
			source,
			[history(), indentUnit.of('    ')],
		);
		expect(enterFocusAt(view, 0)).toBe(true);

		parent.querySelector<HTMLButtonElement>('.bullet-zoom-add-child')?.click();

		expect(view.state.doc.toString()).toBe('- Fundraising video\n    - ');
		const child = findSupportedBullet(view.state, view.state.doc.line(2).from);
		expect(child?.indent).toBe(4);
		expect(view.state.selection.main.head).toBe(view.state.doc.line(2).to);
		expect(getFocusSession(view.state)?.anchor).toBe(0);
		expect(undo(view)).toBe(true);
		expect(view.state.doc.toString()).toBe(source);
		view.destroy();
		parent.remove();
	});

	it('preserves a folded existing child while appending after it', () => {
		const source = '- Parent\n  - Child\n    - Grandchild\n- Sibling';
		const { parent, view } = createView(source, codeFolding());
		expect(enterFocusAt(view, 0)).toBe(true);
		foldLine(view, 2);
		expect(activeFoldRanges(view)).toHaveLength(1);

		parent.querySelector<HTMLButtonElement>('.bullet-zoom-add-child')?.click();

		expect(view.state.doc.toString()).toBe(
			'- Parent\n  - Child\n    - Grandchild\n  - \n- Sibling',
		);
		expect(activeFoldRanges(view)).toHaveLength(1);
		expect(getFocusSession(view.state)?.anchor).toBe(0);
		view.destroy();
		parent.remove();
	});

	it('fails closed with one notice when the owning editor is detached', () => {
		const notices: string[] = [];
		const source = '- Parent';
		const { parent, view } = createView(source);
		expect(enterFocusAt(view, 0)).toBe(true);
		parent.remove();

		expect(appendDirectChild(view, (message) => notices.push(message))).toBe(false);
		expect(notices).toEqual([ADD_CHILD_UNAVAILABLE_NOTICE]);
		expect(view.state.doc.toString()).toBe(source);
		view.destroy();
	});

	it('rejects a retained add-child button after its focus target changes', () => {
		const { parent, view } = createView('- Parent\n- Other');
		expect(enterFocusAt(view, 0)).toBe(true);
		const retained = parent.querySelector<HTMLButtonElement>(
			'.bullet-zoom-add-child',
		);
		expect(enterFocusAt(view, view.state.doc.line(2).from)).toBe(true);
		retained?.dispatchEvent(new MouseEvent('click', { bubbles: false }));
		expect(view.state.doc.toString()).toBe('- Parent\n- Other');
		expect(getFocusSession(view.state)?.breadcrumbs.at(-1)?.label).toBe('Other');
		view.destroy();
		parent.remove();
	});

	it('ignores a retained add-child button after its editor is destroyed', () => {
		const source = '- Parent';
		const { parent, view } = createView(source);
		expect(enterFocusAt(view, 0)).toBe(true);
		const retained = parent.querySelector<HTMLButtonElement>(
			'.bullet-zoom-add-child',
		);
		view.destroy();
		expect(() => {
			retained?.dispatchEvent(new MouseEvent('click', { bubbles: false }));
		}).not.toThrow();
		expect(view.state.doc.toString()).toBe(source);
		parent.remove();
	});

	it('keeps navigation presentation-only while retaining explicit child edits', () => {
		const source = [
			'Before',
			'- **Parent**',
			'  continuation',
			'- Sibling',
			'After',
		].join('\n');
		const { parent, view } = createView(source, history());
		const parentLine = view.state.doc.line(2);
		expect(enterFocusAt(view, parentLine.from)).toBe(true);
		expect(
			parent.querySelector('.bullet-zoom-focus-root-line')?.textContent,
		).toContain('Parent');
		expect(view.state.doc.toString()).toBe(source);

		parent.querySelector<HTMLButtonElement>('.bullet-zoom-add-child')?.click();
		view.dispatch({
			changes: {
				from: view.state.selection.main.head,
				insert: 'Draft',
			},
		});
		expect(exitFocus(view)).toBe(true);
		expect(view.state.doc.toString()).toBe(
			[
				'Before',
				'- **Parent**',
				'  continuation',
				'  - Draft',
				'- Sibling',
				'After',
			].join('\n'),
		);
		expect(undo(view)).toBe(true);
		expect(view.state.doc.toString()).toContain('  - ');
		expect(undo(view)).toBe(true);
		expect(view.state.doc.toString()).toBe(source);
		view.destroy();
		parent.remove();
	});

	it('renders semantic plain text for visible, accessible, and tooltip labels', () => {
		const { parent, view } = createView(
			'- **Parent**\n  - **Child** [link](https://example.com)',
		);
		expect(enterFocusAt(view, view.state.doc.line(2).from)).toBe(true);
		const items = Array.from(
			parent.querySelectorAll<HTMLElement>('.bullet-zoom-breadcrumb'),
		);
		expect(items.map(({ textContent }) => textContent)).toEqual([
			'',
			'Parent',
			'Child link',
		]);
		expect(items.map(({ title }) => title)).toEqual([
			'Back to full note',
			'Parent',
			'Child link',
		]);
		expect(items.map((item) => item.getAttribute('aria-label'))).toEqual([
			'Back to full note',
			'Parent',
			'Child link',
		]);
		expect(items[0]?.querySelector('svg.bullet-zoom-home-icon')).not.toBeNull();
		expect(items[0]?.querySelector('.bullet-zoom-breadcrumb-label')).toBeNull();
		view.destroy();
		parent.remove();
	});

	function createView(
		documentText: string,
		additionalExtensions: Extension = [],
		isPhone = false,
		isMobile = isPhone,
	): {
		parent: HTMLDivElement;
		pane: HTMLDivElement;
		view: EditorView;
	} {
		const parent = document.createElement('div');
		const pane = document.createElement('div');
		pane.className = 'markdown-source-view';
		parent.append(pane);
		document.body.append(parent);
		return {
			parent,
			pane,
			view: new EditorView({
				parent: pane,
				state: createState(
					documentText,
					'Ideas.md',
					additionalExtensions,
					isPhone,
					isMobile,
				),
			}),
		};
	}

	it('renders Bike-inspired navigation with actions followed by a non-interactive current location', () => {
		const { parent, view } = createView(
			'- Parent\n  - Child\n    - Grandchild',
		);
		view.dispatch({ effects: focusAtEffect.of(view.state.doc.line(3).from) });
		const navigationItems = Array.from(
			parent.querySelectorAll<HTMLElement>(
				'.bullet-zoom-back, .bullet-zoom-breadcrumb',
			),
		);

		expect(navigationItems.map((item) => item.textContent)).toEqual([
			'',
			'Parent',
			'Child',
			'Grandchild',
		]);
		expect(navigationItems.map((item) => item.tagName)).toEqual([
			'BUTTON',
			'BUTTON',
			'BUTTON',
			'SPAN',
		]);
		expect(navigationItems.map((item) => item.getAttribute('aria-label'))).toEqual([
			'Back to full note',
			'Parent',
			'Child',
			'Grandchild',
		]);
		expect(navigationItems.map((item) => item.title)).toEqual([
			'Back to full note',
			'Parent',
			'Child',
			'Grandchild',
		]);
		expect(navigationItems.map((item) => item.getAttribute('aria-current'))).toEqual([
			null,
			null,
			null,
			'location',
		]);
		expect(parent.querySelector('.bullet-zoom-back')).toBeNull();
		expect(parent.querySelector('.bullet-zoom-menu-trigger')).toBeNull();
		expect(parent.querySelector('.bullet-zoom-outline-trigger')).toBeNull();
		expect(document.body.querySelector('.bullet-zoom-hierarchy-menu')).toBeNull();
		expect(document.body.querySelector('.bullet-zoom-outline-layer')).toBeNull();
		expect(
			parent.querySelector('button.bullet-zoom-breadcrumb.is-current'),
		).toBeNull();
		expect(
			parent.querySelector('.bullet-zoom-breadcrumbs')?.textContent,
		).toBe('›Parent›Child›Grandchild');
		view.destroy();
		parent.remove();
	});

	it('keeps direct ancestor and note breadcrumb transitions without a visible previous-level action', () => {
		const { parent, view } = createView(
			'- Parent\n  - Child\n    - Grandchild',
		);
		view.dispatch({ effects: focusAtEffect.of(view.state.doc.line(3).from) });

		expect(parent.querySelector('.bullet-zoom-back')).toBeNull();

		parent
			.querySelector<HTMLButtonElement>('.bullet-zoom-breadcrumb.is-ancestor')
			?.click();
		expect(getFocusSession(view.state)?.breadcrumbs.at(-1)?.label).toBe('Parent');

		parent
			.querySelector<HTMLButtonElement>('.bullet-zoom-breadcrumb.is-note')
			?.click();
		expect(getFocusSession(view.state)).toBeNull();
		expect(parent.querySelector('.bullet-zoom-breadcrumbs')).toBeNull();
		view.destroy();
		parent.remove();
	});

	it('unfolds a folded ancestor when its breadcrumb is activated', () => {
		const source = '- Parent\n  - Child\n    - Grandchild';
		const { parent, view } = createView(source, codeFolding());
		view.dispatch({ effects: focusAtEffect.of(view.state.doc.line(3).from) });
		const parentFold = foldLine(view, 1);
		expect(activeFoldRanges(view)).toEqual([parentFold]);

		parent
			.querySelector<HTMLButtonElement>(
				'.bullet-zoom-breadcrumb.is-ancestor[aria-label="Parent"]',
			)
			?.click();

		expect(activeFoldRanges(view)).toEqual([]);
		expect(getFocusSession(view.state)?.breadcrumbs.at(-1)?.label).toBe(
			'Parent',
		);
		expect(view.state.doc.toString()).toBe(source);
		view.destroy();
		parent.remove();
	});

	it('uses the empty-item fallback as its visible and accessible label', () => {
		const { parent, view } = createView('- Parent\n  -   ');
		view.dispatch({ effects: focusAtEffect.of(view.state.doc.line(2).from) });
		const emptyCurrent = parent.querySelector<HTMLElement>(
			'.bullet-zoom-breadcrumb.is-current',
		);

		expect(emptyCurrent?.tagName).toBe('SPAN');
		expect(emptyCurrent?.textContent).toBe('Untitled bullet');
		expect(emptyCurrent?.getAttribute('aria-label')).toBe('Untitled bullet');
		expect(emptyCurrent?.title).toBe('Untitled bullet');
		view.destroy();
		parent.remove();
	});

	it('keeps breadcrumb hover passive without rendering an outline action', () => {
		const { parent, view } = createView(
			[
				'- Parent A',
				'  - Child A1',
				'    - Grandchild A1',
				'  - Child A2',
				'- Parent B',
			].join('\n'),
			[],
			false,
			false,
		);
		view.dispatch({ effects: focusAtEffect.of(view.state.doc.line(3).from) });
		const breadcrumbs = Array.from(
			parent.querySelectorAll<HTMLElement>('.bullet-zoom-breadcrumb'),
		);
		expect(breadcrumbs.map((item) => item.textContent)).toEqual([
			'',
			'Parent A',
			'Child A1',
			'Grandchild A1',
		]);
		expect(parent.querySelector('.bullet-zoom-outline-trigger')).toBeNull();
		for (const breadcrumb of breadcrumbs) {
			breadcrumb.dispatchEvent(
				new MouseEvent('mouseover', { bubbles: true }),
			);
		}
		expect(document.body.querySelector('.bullet-zoom-hierarchy-menu')).toBeNull();
		expect(document.body.querySelector('.bullet-zoom-outline-layer')).toBeNull();
		expect(getFocusSession(view.state)?.breadcrumbs.at(-1)?.label).toBe(
			'Grandchild A1',
		);
		expect(document.body.querySelector('.bullet-zoom-outline-layer')).toBeNull();
		expect(getFocusSession(view.state)?.breadcrumbs.at(-1)?.label).toBe(
			'Grandchild A1',
		);
		view.destroy();
		parent.remove();
	});

	it('keeps panels scoped to their own editor pane', () => {
		const first = createView('- Parent\n  - Child');
		const second = createView('- Parent\n  - Child');
		first.view.dispatch({
			effects: focusAtEffect.of(first.view.state.doc.line(2).from),
		});

		expect(first.parent.querySelectorAll('.bullet-zoom-breadcrumbs')).toHaveLength(
			1,
		);
		expect(
			second.parent.querySelectorAll('.bullet-zoom-breadcrumbs'),
		).toHaveLength(0);
		expect(getFocusSession(second.view.state)).toBeNull();
		first.view.destroy();
		second.view.destroy();
		first.parent.remove();
		second.parent.remove();
	});

	it('renders the phone breadcrumb inside the padded CodeMirror scroll content', () => {
		document.body.classList.add('is-phone');
		const otherPanel = (): { dom: HTMLElement; top: true } => {
			const dom = document.createElement('div');
			dom.className = 'other-top-panel';
			return { dom, top: true };
		};
		const { parent, view } = createView(
			'- Parent\n  - Child',
			showPanel.of(otherPanel),
			true,
		);
		const safeAreaStyle = document.createElement('style');
		safeAreaStyle.textContent =
			'.bullet-zoom-test-safe-scroller { padding-top: 72px; }';
		document.head.append(safeAreaStyle);

		try {
			view.scrollDOM.classList.add('bullet-zoom-test-safe-scroller');
			view.dispatch({
				effects: focusAtEffect.of(view.state.doc.line(2).from),
			});
			const breadcrumbs = parent.querySelector(
				'.bullet-zoom-breadcrumbs-mobile-block',
			);
			const other = parent.querySelector('.other-top-panel');
			const focusedLine = view.contentDOM.querySelector(
				'.bullet-zoom-focus-root-line',
			);

			expect(view.scrollDOM.contains(breadcrumbs)).toBe(true);
			expect(breadcrumbs?.closest('.cm-scroller')).toBe(view.scrollDOM);
			expect(breadcrumbs?.parentElement).not.toBe(view.dom);
			expect(focusedLine).not.toBeNull();
			expect(
				breadcrumbs?.compareDocumentPosition(focusedLine as Node) ?? 0,
			).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
			expect(
				parent.querySelector('.cm-panels-top .bullet-zoom-breadcrumbs'),
			).toBeNull();
			expect(other?.parentElement?.classList).toContain('cm-panels-top');
		} finally {
			view.destroy();
			parent.remove();
			safeAreaStyle.remove();
			document.body.classList.remove('is-phone');
		}
	});

	it('keeps a phone breadcrumb-height margin above each focused bullet', () => {
		const phone = createView('- Parent\n  - Child\n    - Grandchild', [], true);
		const requestMeasureSpy = vi
			.spyOn(phone.view, 'requestMeasure')
			.mockImplementation(() => {});

		try {
			const grandchild = phone.view.state.doc.line(3);
			expect(enterFocusAt(phone.view, grandchild.from, true)).toBe(true);
			expect(
				requestMeasureSpy.mock.calls.filter(([request]) => request !== undefined),
			).toHaveLength(1);

			requestMeasureSpy.mockClear();
			phone.parent
				.querySelector<HTMLButtonElement>(
					'.bullet-zoom-breadcrumb.is-parent',
				)
				?.click();
			expect(getFocusSession(phone.view.state)?.breadcrumbs.at(-1)?.label).toBe(
				'Child',
			);
			expect(
				requestMeasureSpy.mock.calls.filter(([request]) => request !== undefined),
			).toHaveLength(1);
		} finally {
			phone.view.destroy();
			phone.parent.remove();
		}

		const desktop = createView('- Parent\n  - Child\n    - Grandchild');
		const desktopMeasureSpy = vi.spyOn(desktop.view, 'requestMeasure');

		try {
			expect(
				enterFocusAt(desktop.view, desktop.view.state.doc.line(3).from, true),
			).toBe(true);
			expect(
				desktopMeasureSpy.mock.calls.filter(([request]) => request !== undefined),
			).toHaveLength(0);
		} finally {
			desktop.view.destroy();
			desktop.parent.remove();
		}
	});

	it('confines phone focus scrolling to the current editor scroller', () => {
		const phone = createView('- Parent\n  - Child\n    - Grandchild', [], true);
		const desktop = createView('- Parent\n  - Child\n    - Grandchild');
		const requestMeasureSpy = vi
			.spyOn(phone.view, 'requestMeasure')
			.mockImplementation(() => {});

		try {
			const grandchild = phone.view.state.doc.line(3);
			expect(enterFocusAt(phone.view, grandchild.from, true)).toBe(true);
			const anchor = getFocusSession(phone.view.state)?.anchor;
			expect(anchor).toBeTypeOf('number');

			const measureRequest = requestMeasureSpy.mock.calls.find(
				([request]) => request !== undefined,
			)?.[0];
			if (measureRequest === undefined || anchor === undefined) {
				throw new Error('Expected one phone focus measure request and anchor.');
			}

			const stateAtRequest = phone.view.state;
			phone.view.dispatch({});
			expect(phone.view.state).not.toBe(stateAtRequest);
			const lineTop = phone.view.lineBlockAt(anchor).top;
			phone.parent.scrollTop = 37;
			phone.view.scrollDOM.scrollTop = 5;
			const measuredScrollTop = measureRequest.read(phone.view);
			measureRequest.write?.(measuredScrollTop, phone.view);
			expect(phone.view.scrollDOM.scrollTop).toBe(
				Math.max(0, lineTop - 52),
			);
			expect(phone.parent.scrollTop).toBe(37);

			phone.view.scrollDOM.scrollTop = 13;
			expect(
				enterFocusAt(phone.view, phone.view.state.doc.line(2).from, true),
			).toBe(true);
			const staleScrollTop = measureRequest.read(phone.view);
			expect(staleScrollTop).toBeNull();
			measureRequest.write?.(staleScrollTop, phone.view);
			expect(phone.view.scrollDOM.scrollTop).toBe(13);
			expect(phone.parent.scrollTop).toBe(37);
			expect(phone.view.state.facet(EditorView.scrollHandler)).toEqual([]);
			expect(desktop.view.state.facet(EditorView.scrollHandler)).toEqual([]);
		} finally {
			phone.view.destroy();
			phone.parent.remove();
			desktop.view.destroy();
			desktop.parent.remove();
		}
	});

	it('keeps phone root-to-note scrolling inside the current editor', () => {
		const phone = createView('- Parent\n  - Child', [], true);
		const requestMeasureSpy = vi
			.spyOn(phone.view, 'requestMeasure')
			.mockImplementation(() => {});

		try {
			const root = phone.view.state.doc.line(1);
			const child = phone.view.state.doc.line(2);
			phone.view.dispatch({
				selection: { anchor: root.to, head: child.to },
				effects: focusAtEffect.of(root.from),
			});
			requestMeasureSpy.mockClear();

			phone.parent.scrollTop = 29;
			phone.view.scrollDOM.scrollTop = 7;
			Object.defineProperty(phone.view.scrollDOM, 'clientHeight', {
				configurable: true,
				value: 160,
			});

			expect(focusParent(phone.view)).toBe(true);
			expect(getFocusSession(phone.view.state)).toBeNull();
			expect(phone.view.state.selection.main.empty).toBe(false);
			const measureRequest = requestMeasureSpy.mock.calls.find(
				([request]) => request !== undefined,
			)?.[0];
			if (measureRequest === undefined) {
				throw new Error('Expected a phone root-to-note measure request.');
			}

			const selection = phone.view.state.selection.main;
			const firstSelectionLine = phone.view.lineBlockAt(selection.from);
			const lastSelectionLine = phone.view.lineBlockAt(selection.to);
			const selectionHeight =
				lastSelectionLine.bottom - firstSelectionLine.top;
			const measuredScrollTop = measureRequest.read(phone.view);
			measureRequest.write?.(measuredScrollTop, phone.view);
			expect(phone.view.scrollDOM.scrollTop).toBe(
				Math.max(0, firstSelectionLine.top - (160 - selectionHeight) / 2),
			);
			expect(phone.parent.scrollTop).toBe(29);
			expect(phone.view.state.facet(EditorView.scrollHandler)).toEqual([]);

			expect(selectionHeight).toBeGreaterThan(10);
			Object.defineProperty(phone.view.scrollDOM, 'clientHeight', {
				configurable: true,
				value: 10,
			});
			const activeHeadScrollTop = measureRequest.read(phone.view);
			measureRequest.write?.(activeHeadScrollTop, phone.view);
			expect(phone.view.scrollDOM.scrollTop).toBe(
				Math.max(0, lastSelectionLine.bottom - 10),
			);
			expect(phone.parent.scrollTop).toBe(29);

			phone.view.dispatch({
				selection: { anchor: child.to, head: root.to },
				effects: focusAtEffect.of(root.from),
			});
			requestMeasureSpy.mockClear();
			expect(focusParent(phone.view)).toBe(true);
			const backwardMeasureRequest = requestMeasureSpy.mock.calls.find(
				([request]) => request !== undefined,
			)?.[0];
			if (backwardMeasureRequest === undefined) {
				throw new Error('Expected a backward-selection measure request.');
			}
			const backwardScrollTop = backwardMeasureRequest.read(phone.view);
			backwardMeasureRequest.write?.(backwardScrollTop, phone.view);
			expect(phone.view.scrollDOM.scrollTop).toBe(
				Math.max(0, firstSelectionLine.top),
			);
			expect(phone.parent.scrollTop).toBe(29);

			phone.view.dispatch({
				changes: {
					from: 0,
					to: phone.view.state.doc.length,
					insert: '- Other note',
				},
			});
			phone.view.scrollDOM.scrollTop = 17;
			const staleScrollTop = backwardMeasureRequest.read(phone.view);
			expect(staleScrollTop).toBeNull();
			backwardMeasureRequest.write?.(staleScrollTop, phone.view);
			expect(phone.view.scrollDOM.scrollTop).toBe(17);
			expect(phone.parent.scrollTop).toBe(29);
		} finally {
			phone.view.destroy();
			phone.parent.remove();
		}
	});

	it('keeps its desktop breadcrumb in the CodeMirror top panel group', () => {
		const { parent, view } = createView('- Parent\n  - Child');
		view.dispatch({ effects: focusAtEffect.of(view.state.doc.line(2).from) });
		const breadcrumbs = parent.querySelector('.bullet-zoom-breadcrumbs');

		expect(breadcrumbs?.parentElement?.classList).toContain('cm-panels-top');
		view.destroy();
		parent.remove();
	});

	it('keeps the phone breadcrumb in scroll content when another top panel opens', () => {
		document.body.classList.add('is-phone');
		const panelCompartment = new Compartment();
		const otherPanel = (): { dom: HTMLElement; top: true } => {
			const dom = document.createElement('div');
			dom.className = 'late-top-panel';
			return { dom, top: true };
		};
		const { parent, view } = createView(
			'- Parent\n  - Child',
			panelCompartment.of([]),
			true,
		);

		try {
			view.dispatch({
				effects: focusAtEffect.of(view.state.doc.line(2).from),
			});
			view.dispatch({
				effects: panelCompartment.reconfigure(showPanel.of(otherPanel)),
			});

			const breadcrumbs = parent.querySelector(
				'.bullet-zoom-breadcrumbs-mobile-block',
			);
			const other = parent.querySelector('.late-top-panel');
			expect(view.scrollDOM.contains(breadcrumbs)).toBe(true);
			expect(breadcrumbs?.closest('.cm-scroller')).toBe(view.scrollDOM);
			expect(other?.parentElement?.classList).toContain('cm-panels-top');
			expect(
				parent.querySelector('.cm-panels-top .bullet-zoom-breadcrumbs'),
			).toBeNull();

			view.dispatch({
				effects: panelCompartment.reconfigure([]),
			});
			const breadcrumbsAfterClose = parent.querySelector(
				'.bullet-zoom-breadcrumbs-mobile-block',
			);
			expect(view.scrollDOM.contains(breadcrumbsAfterClose)).toBe(true);
			expect(breadcrumbsAfterClose?.closest('.cm-scroller')).toBe(
				view.scrollDOM,
			);
			expect(parent.querySelector('.late-top-panel')).toBeNull();
		} finally {
			view.destroy();
			parent.remove();
			document.body.classList.remove('is-phone');
		}
	});

	it('renders Bike-inspired phone navigation without an outline action', () => {
		document.body.classList.add('is-phone', 'is-mobile');
		const { parent, view } = createView(
			'- Parent\n  - Child\n    - Grandchild',
			[],
			true,
			true,
		);

		try {
			view.dispatch({
				effects: focusAtEffect.of(view.state.doc.line(3).from),
			});
			const mobileNavigation = parent.querySelector(
				'.bullet-zoom-breadcrumbs-mobile-block',
			);
			expect(mobileNavigation).not.toBeNull();
			expect(
				Array.from(
					mobileNavigation?.querySelectorAll<HTMLElement>(
						'.bullet-zoom-back, .bullet-zoom-breadcrumb',
					) ?? [],
				).map((item) => ({
					label: item.getAttribute('aria-label'),
					tag: item.tagName,
				})),
			).toEqual([
				{ label: 'Back to full note', tag: 'BUTTON' },
				{ label: 'Parent', tag: 'BUTTON' },
				{ label: 'Child', tag: 'BUTTON' },
				{ label: 'Grandchild', tag: 'SPAN' },
			]);
			expect(mobileNavigation?.querySelector('.bullet-zoom-back')).toBeNull();
			expect(
				mobileNavigation?.querySelector('.bullet-zoom-outline-trigger'),
			).toBeNull();
			expect(document.body.querySelector('.bullet-zoom-outline-layer')).toBeNull();
			expect(getFocusSession(view.state)?.breadcrumbs.at(-1)?.label).toBe(
				'Grandchild',
			);

			parent
				.querySelector<HTMLButtonElement>('.bullet-zoom-breadcrumb.is-note')
				?.click();
			expect(getFocusSession(view.state)).toBeNull();
			expect(
				parent.querySelector('.bullet-zoom-breadcrumbs-mobile-block'),
			).toBeNull();
		} finally {
			view.destroy();
			parent.remove();
			document.body.classList.remove('is-phone', 'is-mobile');
		}
	});

	it('retains the desktop breadcrumb panel on a tablet without an outline action', () => {
		document.body.classList.add('is-mobile');
		const { parent, view } = createView(
			'- Parent\n  - Child',
			[],
			false,
			true,
		);

		try {
			view.dispatch({
				effects: focusAtEffect.of(view.state.doc.line(2).from),
			});
			expect(
				parent.querySelector('.cm-panels-top .bullet-zoom-breadcrumbs'),
			).not.toBeNull();
			expect(parent.querySelector('.bullet-zoom-outline-trigger')).toBeNull();
			expect(document.body.querySelector('.bullet-zoom-outline-layer')).toBeNull();
		} finally {
			view.destroy();
			parent.remove();
			document.body.classList.remove('is-mobile');
		}
	});

	it('removes the phone block widget after focus invalidation and destroy', () => {
		document.body.classList.add('is-phone');
		const { parent, view } = createView(
			'- Parent\n  - Child',
			[],
			true,
		);
		let destroyed = false;

		try {
			view.dispatch({
				effects: focusAtEffect.of(view.state.doc.line(2).from),
			});
			expect(
				parent.querySelector('.bullet-zoom-breadcrumbs-mobile-block'),
			).not.toBeNull();

			const anchor = getFocusSession(view.state)?.anchor ?? 0;
			view.dispatch({
				changes: { from: anchor, to: anchor + 1, insert: '1.' },
			});
			expect(getFocusSession(view.state)).toBeNull();
			expect(
				parent.querySelector('.bullet-zoom-breadcrumbs-mobile-block'),
			).toBeNull();

			view.dispatch({
				changes: { from: anchor, to: anchor + 2, insert: '-' },
				effects: focusAtEffect.of(anchor),
			});
			expect(
				parent.querySelector('.bullet-zoom-breadcrumbs-mobile-block'),
			).not.toBeNull();
			view.destroy();
			destroyed = true;
			expect(
				parent.querySelector('.bullet-zoom-breadcrumbs-mobile-block'),
			).toBeNull();
		} finally {
			if (!destroyed) {
				view.destroy();
			}
			parent.remove();
			document.body.classList.remove('is-phone');
		}
	});

	it('marks only the focused pane and clears the marker after invalidation', () => {
		const first = createView('- Parent\n  - Child');
		const second = createView('- Parent\n  - Child');
		const initialMarker = first.pane.classList.contains(
			'bullet-zoom-pane-is-focused',
		);

		first.view.dispatch({
			effects: focusAtEffect.of(first.view.state.doc.line(2).from),
		});
		const focusedMarker = first.pane.classList.contains(
			'bullet-zoom-pane-is-focused',
		);
		const siblingMarker = second.pane.classList.contains(
			'bullet-zoom-pane-is-focused',
		);

		const anchor = getFocusSession(first.view.state)?.anchor ?? 0;
		first.view.dispatch({
			changes: { from: anchor, to: anchor + 1, insert: '1.' },
		});
		const invalidatedMarker = first.pane.classList.contains(
			'bullet-zoom-pane-is-focused',
		);

		first.view.destroy();
		second.view.destroy();
		first.parent.remove();
		second.parent.remove();

		expect(initialMarker).toBe(false);
		expect(focusedMarker).toBe(true);
		expect(siblingMarker).toBe(false);
		expect(invalidatedMarker).toBe(false);
	});

	it('removes the focused-pane marker when the editor view is destroyed', () => {
		const { parent, pane, view } = createView('- Parent\n  - Child');
		view.dispatch({ effects: focusAtEffect.of(view.state.doc.line(2).from) });
		const markerBeforeDestroy = pane.classList.contains(
			'bullet-zoom-pane-is-focused',
		);

		view.destroy();
		const markerAfterDestroy = pane.classList.contains(
			'bullet-zoom-pane-is-focused',
		);
		parent.remove();

		expect(markerBeforeDestroy).toBe(true);
		expect(markerAfterDestroy).toBe(false);
	});

	it('keeps focusing safe when the expected Obsidian pane wrapper is absent', () => {
		const parent = document.createElement('div');
		document.body.append(parent);
		const view = new EditorView({
			parent,
			state: createState('- Parent\n  - Child'),
		});

		expect(() => {
			view.dispatch({ effects: focusAtEffect.of(view.state.doc.line(2).from) });
		}).not.toThrow();
		expect(parent.querySelector('.bullet-zoom-breadcrumbs')).not.toBeNull();

		view.destroy();
		parent.remove();
	});
});

describe('marker tap opens the menu (1.16.0)', () => {
	it('opens the menu on a quick tap when configured', async () => {
		vi.useFakeTimers();
		const onLongPress = vi.fn();
		const parent = document.createElement('div');
		document.body.append(parent);
		const view = new EditorView({
			parent,
			state: EditorState.create({
				doc: '- Parent\n  - Child',
				extensions: [
					markdown(),
					focusFilePath.of('Ideas.md'),
					focusNoteTitle.of('Ideas'),
					focusLivePreview.of(true),
					createFocusExtension({
						isPhone: true,
						isMobile: true,
						radialMenu: {
							enabled: true,
							allowMouse: false,
							openOnTap: true,
							pressDuration: 450,
							onLongPress,
						},
					}),
				],
			}),
		});
		vi.spyOn(view, 'posAtCoords').mockReturnValue(0);
		vi.spyOn(view, 'coordsAtPos').mockImplementation((position: number) => {
			if (position === 0) {
				return { left: 40, right: 46, top: 10, bottom: 30 };
			}
			if (position === 1) {
				return { left: 46, right: 52, top: 10, bottom: 30 };
			}
			return { left: 60, right: 66, top: 10, bottom: 30 };
		});

		const press = (type: string, x: number, y: number): Event => {
			const event = new MouseEvent(type, {
				bubbles: true,
				cancelable: true,
				clientX: x,
				clientY: y,
			});
			Object.defineProperties(event, {
				pointerId: { value: 5 },
				pointerType: { value: 'touch' },
				isPrimary: { value: true },
			});
			return event;
		};

		view.contentDOM.dispatchEvent(press('pointerdown', 46, 20));
		await vi.advanceTimersByTimeAsync(80);
		view.contentDOM.dispatchEvent(press('pointerup', 46, 20));
		expect(onLongPress).toHaveBeenCalledTimes(1);
		expect(getFocusSession(view.state)).toBeNull();
		// Anchored on the measured marker centre, not the release point.
		expect(onLongPress.mock.calls[0]?.[2]).toBe(43);
		expect(onLongPress.mock.calls[0]?.[3]).toBe(20);
		vi.useRealTimers();
		view.destroy();
		parent.remove();
	});
});

describe('desktop menu opt-in (1.27.0)', () => {
	function createMarkerView(allowMouse: boolean, onLongPress: () => void) {
		const parent = document.createElement('div');
		document.body.append(parent);
		const view = new EditorView({
			parent,
			state: EditorState.create({
				doc: '- Parent\n  - Child',
				extensions: [
					markdown(),
					focusFilePath.of('Ideas.md'),
					focusNoteTitle.of('Ideas'),
					focusLivePreview.of(true),
					createFocusExtension({
						isPhone: false,
						isMobile: false,
						radialMenu: {
							enabled: true,
							allowMouse,
							openOnTap: true,
							pressDuration: 450,
							onLongPress,
						},
					}),
				],
			}),
		});
		vi.spyOn(view, 'posAtCoords').mockReturnValue(0);
		vi.spyOn(view, 'coordsAtPos').mockImplementation((position: number) => {
			if (position === 0) return { left: 40, right: 46, top: 10, bottom: 30 };
			if (position === 1) return { left: 46, right: 52, top: 10, bottom: 30 };
			return { left: 60, right: 66, top: 10, bottom: 30 };
		});
		return { parent, view };
	}

	function mousePress(type: string, x: number, y: number): Event {
		const event = new MouseEvent(type, {
			bubbles: true,
			cancelable: true,
			clientX: x,
			clientY: y,
		});
		Object.defineProperties(event, {
			pointerId: { value: 3 },
			pointerType: { value: 'mouse' },
			isPrimary: { value: true },
		});
		return event;
	}

	it('ignores a mouse click on the marker by default', async () => {
		vi.useFakeTimers();
		const onLongPress = vi.fn();
		const { parent, view } = createMarkerView(false, onLongPress);
		view.contentDOM.dispatchEvent(mousePress('pointerdown', 46, 20));
		await vi.advanceTimersByTimeAsync(80);
		view.contentDOM.dispatchEvent(mousePress('pointerup', 46, 20));
		expect(onLongPress).not.toHaveBeenCalled();
		vi.useRealTimers();
		view.destroy();
		parent.remove();
	});

	it('opens the menu from a mouse click once desktop is enabled', async () => {
		vi.useFakeTimers();
		const onLongPress = vi.fn();
		const { parent, view } = createMarkerView(true, onLongPress);
		view.contentDOM.dispatchEvent(mousePress('pointerdown', 46, 20));
		await vi.advanceTimersByTimeAsync(80);
		view.contentDOM.dispatchEvent(mousePress('pointerup', 46, 20));
		expect(onLongPress).toHaveBeenCalledTimes(1);
		expect(getFocusSession(view.state)).toBeNull();
		vi.useRealTimers();
		view.destroy();
		parent.remove();
	});
});
