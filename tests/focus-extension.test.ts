import { markdown } from '@codemirror/lang-markdown';
import { history, undo } from '@codemirror/commands';
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import { Decoration, EditorView, showPanel, WidgetType } from '@codemirror/view';
import { describe, expect, it } from 'vitest';

import {
	createFocusExtension,
	clearFocusEffect,
	EDITOR_VIEW_UNAVAILABLE_NOTICE,
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
	SUPPORTED_BULLET_REQUIRED_NOTICE,
} from '../src/focus-extension';

function createState(
	document: string,
	filePath = 'Ideas.md',
	additionalExtensions: Extension = [],
): EditorState {
	return EditorState.create({
		doc: document,
		extensions: [
			markdown(),
			focusFilePath.of(filePath),
			focusNoteTitle.of(filePath.replace(/\.md$/, '')),
			focusLivePreview.of(true),
			createFocusExtension(),
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
			ranges.push({ from: iterator.from, to: iterator.to });
			iterator.next();
		}
	}
	return ranges;
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
				createFocusExtension(),
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
		expect(decorationRanges(focused)).toEqual([
			{ from: 0, to: state.doc.line(2).from - 1 },
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
		expect(decorationRanges(edited)).toEqual([
			{ from: 0, to: edited.doc.line(2).from - 1 },
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
	function createView(
		documentText: string,
		additionalExtensions: Extension = [],
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

	it('focuses through the fold indicator Obsidian renders over a parent bullet', () => {
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
		const foldDecoration = Decoration.widget({
			widget: new ObsidianFoldWidget(),
			side: -1,
		}).range(0);
		const { parent, view } = createView(
			'- Parent\n  - Child',
			EditorView.decorations.of(Decoration.set([foldDecoration])),
		);
		const collapseIndicator = view.contentDOM.querySelector<HTMLElement>(
			'.collapse-indicator',
		);

		collapseIndicator?.click();
		expect(getFocusSession(view.state)?.breadcrumbs.at(-1)?.label).toBe(
			'Parent',
		);
		expect(view.state.selection.main.head).toBe(view.state.doc.line(1).to);
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
		const { parent, view } = createView('- Parent\n  - Child\n    - Grandchild');
		view.dom
			.querySelector<HTMLElement>('.bullet-zoom-marker')
			?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(getFocusSession(view.state)?.breadcrumbs.at(-1)?.label).toBe('Parent');

		const visibleMarkers = view.dom.querySelectorAll<HTMLElement>(
			'.bullet-zoom-marker',
		);
		visibleMarkers[2]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
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

describe('plugin commands and safe failures', () => {
	function createView(
		documentText: string,
		livePreview = true,
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
				createFocusExtension(),
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
		expect(notices).toEqual([]);
		view.destroy();
		parent.remove();
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
	function createView(
		documentText: string,
		additionalExtensions: Extension = [],
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
				state: createState(documentText, 'Ideas.md', additionalExtensions),
			}),
		};
	}

	function buttons(parent: HTMLElement): HTMLButtonElement[] {
		return Array.from(
			parent.querySelectorAll<HTMLButtonElement>('.bullet-zoom-breadcrumb'),
		);
	}

	it('shows the note, ancestors, and current item with full accessible labels', () => {
		const { parent, view } = createView(
			'- Parent\n  - Child\n    - Grandchild',
		);
		view.dispatch({ effects: focusAtEffect.of(view.state.doc.line(3).from) });
		const breadcrumbButtons = buttons(parent);

		expect(breadcrumbButtons.map((button) => button.textContent)).toEqual([
			'Ideas',
			'Parent',
			'Child',
			'Grandchild',
		]);
		expect(
			breadcrumbButtons.map((button) => button.getAttribute('aria-label')),
		).toEqual(['Ideas', 'Parent', 'Child', 'Grandchild']);
		expect(breadcrumbButtons.map((button) => button.title)).toEqual([
			'Ideas',
			'Parent',
			'Child',
			'Grandchild',
		]);
		expect(
			breadcrumbButtons.map((button) => button.getAttribute('aria-current')),
		).toEqual([null, null, null, 'location']);
		expect(
			breadcrumbButtons.map((button) =>
				button.classList.contains('is-current'),
			),
		).toEqual([false, false, false, true]);
		expect(
			breadcrumbButtons.map((button) => ({
				isNote: button.classList.contains('is-note'),
				isAncestor: button.classList.contains('is-ancestor'),
				isParent: button.classList.contains('is-parent'),
				isCurrent: button.classList.contains('is-current'),
			})),
		).toEqual([
			{
				isNote: true,
				isAncestor: false,
				isParent: false,
				isCurrent: false,
			},
			{
				isNote: false,
				isAncestor: true,
				isParent: false,
				isCurrent: false,
			},
			{
				isNote: false,
				isAncestor: true,
				isParent: true,
				isCurrent: false,
			},
			{
				isNote: false,
				isAncestor: false,
				isParent: false,
				isCurrent: true,
			},
		]);
		view.destroy();
		parent.remove();
	});

	it('refocuses an ancestor from its breadcrumb', () => {
		const { parent, view } = createView(
			'- Parent\n  - Child\n    - Grandchild',
		);
		view.dispatch({ effects: focusAtEffect.of(view.state.doc.line(3).from) });

		buttons(parent)[1]?.click();
		expect(getFocusSession(view.state)?.breadcrumbs.at(-1)?.label).toBe('Parent');
		expect(buttons(parent).map((button) => button.textContent)).toEqual([
			'Ideas',
			'Parent',
		]);
		view.destroy();
		parent.remove();
	});

	it('exits focus from the note breadcrumb and removes the panel', () => {
		const { parent, view } = createView('- Parent\n  - Child');
		view.dispatch({ effects: focusAtEffect.of(view.state.doc.line(2).from) });
		expect(parent.querySelector('.bullet-zoom-breadcrumbs')).not.toBeNull();

		buttons(parent)[0]?.click();
		expect(getFocusSession(view.state)).toBeNull();
		expect(parent.querySelector('.bullet-zoom-breadcrumbs')).toBeNull();
		view.destroy();
		parent.remove();
	});

	it('uses the empty-item fallback as its visible and accessible label', () => {
		const { parent, view } = createView('- Parent\n  -   ');
		view.dispatch({ effects: focusAtEffect.of(view.state.doc.line(2).from) });
		const emptyButton = buttons(parent).at(-1);

		expect(emptyButton?.textContent).toBe('（空白節點）');
		expect(emptyButton?.getAttribute('aria-label')).toBe('（空白節點）');
		expect(emptyButton?.title).toBe('（空白節點）');
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

	it('moves only its phone breadcrumb out of the shared sticky panel group', () => {
		document.body.classList.add('is-phone');
		const otherPanel = (): { dom: HTMLElement; top: true } => {
			const dom = document.createElement('div');
			dom.className = 'other-top-panel';
			return { dom, top: true };
		};
		const { parent, view } = createView(
			'- Parent\n  - Child',
			showPanel.of(otherPanel),
		);

		try {
			view.dispatch({
				effects: focusAtEffect.of(view.state.doc.line(2).from),
			});
			const breadcrumbs = parent.querySelector('.bullet-zoom-breadcrumbs');
			const other = parent.querySelector('.other-top-panel');

			expect(breadcrumbs?.parentElement).toBe(view.dom);
			expect(breadcrumbs?.nextElementSibling).toBe(view.scrollDOM);
			expect(other?.parentElement?.classList).toContain('cm-panels-top');
			expect(other?.parentElement).not.toBe(breadcrumbs?.parentElement);
		} finally {
			view.destroy();
			parent.remove();
			document.body.classList.remove('is-phone');
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

	it('keeps the phone breadcrumb outside when another top panel opens', async () => {
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
		);

		try {
			view.dispatch({
				effects: focusAtEffect.of(view.state.doc.line(2).from),
			});
			view.dispatch({
				effects: panelCompartment.reconfigure(showPanel.of(otherPanel)),
			});
			await new Promise<void>((resolve) => {
				window.setTimeout(resolve, 0);
			});

			const breadcrumbs = parent.querySelector('.bullet-zoom-breadcrumbs');
			const other = parent.querySelector('.late-top-panel');
			expect(breadcrumbs?.parentElement).toBe(view.dom);
			expect(breadcrumbs?.nextElementSibling).toBe(view.scrollDOM);
			expect(other?.parentElement?.classList).toContain('cm-panels-top');

			view.dispatch({
				effects: panelCompartment.reconfigure([]),
			});
			await new Promise<void>((resolve) => {
				window.setTimeout(resolve, 0);
			});
			expect(breadcrumbs?.parentElement).toBe(view.dom);
			expect(breadcrumbs?.nextElementSibling).toBe(view.scrollDOM);
			expect(parent.querySelector('.late-top-panel')).toBeNull();
		} finally {
			view.destroy();
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
