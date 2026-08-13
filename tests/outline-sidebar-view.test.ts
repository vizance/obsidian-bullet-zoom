import { markdown } from '@codemirror/lang-markdown';
import {
	codeFolding,
	foldEffect,
	foldable,
	foldedRanges,
} from '@codemirror/language';
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import type { Workspace, WorkspaceLeaf } from 'obsidian';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
	buildBulletOutline,
	BulletOutlineLimitError,
	BulletOutlineParsePendingError,
	findOutlinePath,
	findSupportedBullet,
} from '../src/list-structure';
import {
	createFocusExtension,
	enterFocusAt,
	exitFocus,
	focusFilePath,
	focusLivePreview,
	focusNoteTitle,
	getFocusSession,
} from '../src/focus-extension';
import {
	BULLET_OUTLINE_VIEW_NAME,
	BULLET_OUTLINE_VIEW_TYPE,
	BulletOutlineSidebarCoordinator,
	BulletOutlineSidebarView,
	renderOutlineSidebar,
	syncOutlineLabelOverflow,
	type OutlineSidebarActions,
	type OutlineSidebarModel,
} from '../src/outline-sidebar-view';

type MutableLeaf = {
	view: object;
	detach: ReturnType<typeof vi.fn>;
};

type CoordinatorFixture = Readonly<{
	coordinator: BulletOutlineSidebarCoordinator;
	editorView: EditorView;
	parent: HTMLDivElement;
	sidebarView: BulletOutlineSidebarView;
	sourceLeaf: MutableLeaf;
	sidebarLeaf: MutableLeaf;
	setActiveLeaf: ReturnType<typeof vi.fn>;
	revealLeaf: ReturnType<typeof vi.fn>;
	ensureSideLeaf: ReturnType<typeof vi.fn>;
	onFocus: ReturnType<typeof vi.fn>;
	onExit: ReturnType<typeof vi.fn>;
	onUnexpectedError: ReturnType<typeof vi.fn>;
	focusEditor: ReturnType<typeof vi.fn>;
	setCurrentAnchor: (anchor: number | null) => void;
	setFilePath: (filePath: string) => void;
	setEligible: (eligible: boolean) => void;
	setRightSidebarCollapsed: (collapsed: boolean) => void;
	detachSource: () => void;
	addSource: (source: string, filePath: string, ownerDocument?: Document) => Readonly<{
		leaf: MutableLeaf;
		view: EditorView;
		parent: HTMLDivElement;
	}>;
	emit: (name: string, value?: unknown) => void;
}>;

afterEach(() => {
	document.body.replaceChildren();
	vi.restoreAllMocks();
});

function model(
	overrides: Partial<OutlineSidebarModel> = {},
): OutlineSidebarModel {
	return Object.freeze({
		revision: 1,
		status: 'ready',
		noteTitle: 'Ideas',
		outline: Object.freeze([]),
		currentAnchor: null,
		expandedAnchors: new Set<number>(),
		revealCurrent: true,
		isMobile: false,
		...overrides,
	});
}

function actions(): OutlineSidebarActions {
	return {
		onToggle: vi.fn(),
		onSelect: vi.fn(),
		onExit: vi.fn(),
		onRetry: vi.fn(),
		onPreview: vi.fn(),
	};
}

async function createCoordinatorFixture(
	source: string,
	isMobile = false,
	additionalExtensions: Extension = [],
	buildOutline: typeof buildBulletOutline = buildBulletOutline,
	trackCaretBullet = false,
): Promise<CoordinatorFixture> {
	const sourceLeaf: MutableLeaf = { view: {}, detach: vi.fn() };
	const sourceLeaves: MutableLeaf[] = [sourceLeaf];
	const editorByLeaf = new Map<MutableLeaf, EditorView>();
	const filePaths = new WeakMap<EditorView, string>();
	const currentAnchors = new WeakMap<EditorView, number | null>();
	const sidebarLeaf: MutableLeaf = { view: {}, detach: vi.fn() };
	const handlers = new Map<string, Set<(value?: unknown) => void>>();
	let mostRecent: MutableLeaf | null = sourceLeaf;
	let activeEditorView: EditorView | null = null;
	let sourceAttached = true;
	let eligible = true;
	let editorView: EditorView;
	let sidebarView: BulletOutlineSidebarView;
	let sidebarOpened = false;
	const rightSplit = { collapsed: false };
	const ensureSideLeaf = vi.fn(async () => sidebarLeaf as unknown as WorkspaceLeaf);
	const revealLeaf = vi.fn(async () => {
		sidebarLeaf.view = sidebarView;
		if (!sidebarOpened) {
			sidebarOpened = true;
			await sidebarView.onOpen();
		}
	});
	const setActiveLeaf = vi.fn();
	const workspace = {
		rootSplit: {},
		rightSplit,
		on: vi.fn((name: string, callback: (value?: unknown) => void) => {
			const callbacks = handlers.get(name) ?? new Set();
			callbacks.add(callback);
			handlers.set(name, callbacks);
			return { name, callback };
		}),
		offref: vi.fn((reference: { name: string; callback: () => void }) => {
			handlers.get(reference.name)?.delete(reference.callback);
		}),
		onLayoutReady: vi.fn((callback: () => void) => callback()),
		getMostRecentLeaf: vi.fn(() => mostRecent as unknown as WorkspaceLeaf),
		getLeavesOfType: vi.fn((type: string) => {
			if (type === 'markdown') {
				return sourceLeaves.filter(
					(leaf) => leaf !== sourceLeaf || sourceAttached,
				) as unknown as WorkspaceLeaf[];
			}
			if (type === BULLET_OUTLINE_VIEW_TYPE) {
				return [sidebarLeaf] as unknown as WorkspaceLeaf[];
			}
			return [];
		}),
		ensureSideLeaf,
		revealLeaf,
		setActiveLeaf,
	};
	const onFocus = vi.fn((view: EditorView, anchor: number) =>
		enterFocusAt(view, anchor, true),
	);
	const onExit = vi.fn((view: EditorView) => exitFocus(view));
	const onUnexpectedError = vi.fn();
	const coordinator = new BulletOutlineSidebarCoordinator({
		workspace: workspace as unknown as Workspace,
		isMobile,
		getActiveEditorView: () => activeEditorView,
		resolveEditorView: (leaf) =>
			editorByLeaf.get(leaf as unknown as MutableLeaf) ?? null,
		isEditorEligible: () => eligible,
		getFilePath: (view) => filePaths.get(view) ?? null,
		getNoteTitle: (view) =>
			(filePaths.get(view) ?? '未命名筆記').replace(/\.md$/, ''),
		getFocusAnchor: (view) => currentAnchors.get(view) ?? null,
		getCurrentAnchor: (view) =>
			trackCaretBullet
				? (findSupportedBullet(view.state, view.state.selection.main.head)
						?.markerFrom ??
					currentAnchors.get(view) ??
					null)
				: (currentAnchors.get(view) ?? null),
		onFocus,
		onExit,
		onUnexpectedError,
		buildOutline,
	});
	const parent = document.createElement('div');
	document.body.append(parent);
	editorView = new EditorView({
		parent,
		state: EditorState.create({
			doc: source,
				extensions: [
					markdown(),
					focusFilePath.of('Ideas.md'),
					focusNoteTitle.of('Ideas'),
					focusLivePreview.of(true),
					createFocusExtension({
					isPhone: false,
					isMobile,
					onEditorReady: (view) => coordinator.notifyEditorReady(view),
					onEditorUpdate: (update) => coordinator.notifyEditorUpdate(update),
					onEditorDestroy: (view) => coordinator.notifyEditorDestroyed(view),
					}),
					additionalExtensions,
				],
		}),
	});
	editorByLeaf.set(sourceLeaf, editorView);
	activeEditorView = editorView;
	filePaths.set(editorView, 'Ideas.md');
	currentAnchors.set(editorView, null);
	const focusEditor = vi
		.spyOn(editorView, 'focus')
		.mockImplementation(() => undefined);
	sidebarView = new BulletOutlineSidebarView(
		sidebarLeaf as unknown as WorkspaceLeaf,
		coordinator,
	);
	document.body.append(sidebarView.contentEl);
	coordinator.start();
	await coordinator.openForEditor(editorView);
	await Promise.resolve();

	return {
		coordinator,
		editorView,
		parent,
		sidebarView,
		sourceLeaf,
		sidebarLeaf,
		setActiveLeaf,
		revealLeaf,
		ensureSideLeaf,
		onFocus,
		onExit,
		onUnexpectedError,
		focusEditor,
		setCurrentAnchor: (anchor) => {
			currentAnchors.set(editorView, anchor);
			coordinator.notifyEditorReady(editorView);
		},
		setFilePath: (nextFilePath) => {
			filePaths.set(editorView, nextFilePath);
		},
		setEligible: (nextEligible) => {
			eligible = nextEligible;
		},
		setRightSidebarCollapsed: (collapsed) => {
			rightSplit.collapsed = collapsed;
		},
		detachSource: () => {
			sourceAttached = false;
		},
		addSource: (nextSource, nextFilePath, ownerDocument = document) => {
			const nextParent = ownerDocument.createElement('div');
			ownerDocument.body.append(nextParent);
			const nextLeaf: MutableLeaf = { view: {}, detach: vi.fn() };
			const nextView = new EditorView({
				parent: nextParent,
				state: EditorState.create({
					doc: nextSource,
					extensions: [
						markdown(),
						focusFilePath.of(nextFilePath),
						focusNoteTitle.of(nextFilePath.replace(/\.md$/, '')),
						focusLivePreview.of(true),
						createFocusExtension({
							isPhone: false,
							isMobile,
							onEditorReady: (view) => coordinator.notifyEditorReady(view),
							onEditorUpdate: (update) =>
								coordinator.notifyEditorUpdate(update),
							onEditorDestroy: (view) =>
								coordinator.notifyEditorDestroyed(view),
						}),
					],
				}),
			});
			sourceLeaves.push(nextLeaf);
			editorByLeaf.set(nextLeaf, nextView);
			filePaths.set(nextView, nextFilePath);
			currentAnchors.set(nextView, null);
			mostRecent = nextLeaf;
			return { leaf: nextLeaf, view: nextView, parent: nextParent };
		},
		emit: (name, value) => {
			if (name === 'active-leaf-change' && value === null) {
				mostRecent = null;
			}
			for (const callback of handlers.get(name) ?? []) {
				callback(value);
			}
		},
	};
}

describe('native outline sidebar rendering', () => {
	it('preserves Obsidian-owned classes on the ItemView content element', () => {
		const container = document.createElement('div');
		container.className = 'view-content mod-right-split';
		renderOutlineSidebar(container, model(), actions());

		expect(container.classList.contains('view-content')).toBe(true);
		expect(container.classList.contains('mod-right-split')).toBe(true);
		expect(container.classList.contains('bullet-zoom-outline-sidebar')).toBe(true);
	});

	it('renders a five-level path as one bounded vertical tree without cascade columns', () => {
		const state = EditorState.create({
			doc: [
				'- Root',
				'  - Child',
				'    - Grandchild',
				'      - Level four',
				'        - Level five',
			].join('\n'),
			extensions: [markdown()],
		});
		const outline = buildBulletOutline(state);
		const activePath = findOutlinePath(outline, state.doc.line(5).from + 8);
		const container = document.createElement('div');
		document.body.append(container);
		renderOutlineSidebar(
			container,
			model({
				outline,
				currentAnchor: state.doc.line(5).from + 8,
				expandedAnchors: new Set(
					activePath?.slice(0, -1).map(({ anchor }) => anchor),
				),
			}),
			actions(),
		);

		expect(container.querySelectorAll('.bullet-zoom-outline-sidebar-row')).toHaveLength(5);
		expect(container.querySelector('.bullet-zoom-outline-column')).toBeNull();
		expect(container.querySelector('.bullet-zoom-outline-layer')).toBeNull();
		expect(
			container.querySelectorAll('.bullet-zoom-outline-sidebar-row.is-depth-4'),
		).toHaveLength(1);
		expect(
			container.querySelector('[aria-current="true"]')?.textContent,
		).toBe('Level five');
	});

	it('keeps disclosure and focus as separate native actions', () => {
		const container = document.createElement('div');
		const handlers = actions();
		renderOutlineSidebar(
			container,
			model({
				outline: Object.freeze([
					Object.freeze({
						label: 'Parent',
						anchor: 0,
						children: Object.freeze([
							Object.freeze({ label: 'Child', anchor: 11, children: Object.freeze([]) }),
						]),
					}),
				]),
			}),
			handlers,
		);

		container
			.querySelector<HTMLButtonElement>('.bullet-zoom-outline-sidebar-disclosure')
			?.click();
		expect(handlers.onToggle).toHaveBeenCalledWith({ anchor: 0, revision: 1 });
		expect(handlers.onSelect).not.toHaveBeenCalled();
		container
			.querySelector<HTMLButtonElement>('.bullet-zoom-outline-sidebar-label')
			?.click();
		expect(handlers.onSelect).toHaveBeenCalledWith({ anchor: 0, revision: 1 });
		const collapsedDisclosure = container.querySelector<HTMLButtonElement>(
			'.bullet-zoom-outline-sidebar-disclosure',
		);
		expect(collapsedDisclosure?.hasAttribute('aria-controls')).toBe(false);

		renderOutlineSidebar(
			container,
			model({
				outline: Object.freeze([
					Object.freeze({
						label: 'Parent',
						anchor: 0,
						children: Object.freeze([
							Object.freeze({ label: 'Child', anchor: 11, children: Object.freeze([]) }),
						]),
					}),
				]),
				expandedAnchors: new Set([0]),
			}),
			handlers,
		);
		const expandedDisclosure = container.querySelector<HTMLButtonElement>(
			'.bullet-zoom-outline-sidebar-disclosure',
		);
		const controlledId = expandedDisclosure?.getAttribute('aria-controls');
		expect(controlledId).not.toBeNull();
		expect(container.querySelector(`#${controlledId}`)).not.toBeNull();
	});

	it('renders hostile and empty Markdown labels only as text', () => {
		const container = document.createElement('div');
		renderOutlineSidebar(
			container,
			model({
				outline: Object.freeze([
					Object.freeze({
						label: '<img src=x onerror=alert(1)>',
						anchor: 0,
						children: Object.freeze([]),
					}),
					Object.freeze({ label: '', anchor: 35, children: Object.freeze([]) }),
				]),
			}),
			actions(),
		);

		expect(container.querySelector('img')).toBeNull();
		expect(
			Array.from(
				container.querySelectorAll('.bullet-zoom-outline-sidebar-label'),
			).map(({ textContent }) => textContent),
		).toEqual(['<img src=x onerror=alert(1)>', '（空白節點）']);
	});

	it('keeps every label to one ellipsized line and exposes its full desktop text', () => {
		const container = document.createElement('div');
		const longLabel = '這是一段很長而且需要在側欄中截斷的 Bullet 內容';
		renderOutlineSidebar(
			container,
			model({
				outline: Object.freeze([
					Object.freeze({ label: longLabel, anchor: 0, children: Object.freeze([]) }),
				]),
			}),
			actions(),
		);
		const label = container.querySelector<HTMLButtonElement>(
			'.bullet-zoom-outline-sidebar-label',
		);
		expect(label?.title).toBe(longLabel);
		expect(label?.textContent).toBe(longLabel);
		expect(container.querySelector('.bullet-zoom-outline-sidebar-preview')).toBeNull();
	});

	it('shows the separate mobile full-text action only for an overflowing label', () => {
		const container = document.createElement('div');
		const handlers = actions();
		const labelText = '很長的手機 Bullet 全文';
		renderOutlineSidebar(
			container,
			model({
				isMobile: true,
				outline: Object.freeze([
					Object.freeze({ label: labelText, anchor: 0, children: Object.freeze([]) }),
				]),
			}),
			handlers,
		);
		const label = container.querySelector<HTMLButtonElement>(
			'.bullet-zoom-outline-sidebar-label',
		);
		const preview = container.querySelector<HTMLButtonElement>(
			'.bullet-zoom-outline-sidebar-preview',
		);
		expect(preview?.hidden).toBe(true);
		if (
			label !== null &&
			label !== undefined &&
			preview !== null &&
			preview !== undefined
		) {
			Object.defineProperty(label, 'clientWidth', { configurable: true, value: 80 });
			Object.defineProperty(label, 'scrollWidth', { configurable: true, value: 180 });
			syncOutlineLabelOverflow(container);
			expect(preview.hidden).toBe(false);
			preview.click();
			expect(handlers.onPreview).toHaveBeenCalledWith(
				{ anchor: 0, revision: 1 },
				labelText,
				preview,
			);

			Object.defineProperty(label, 'scrollWidth', { configurable: true, value: 80 });
			Object.defineProperty(label, 'clientWidth', {
				configurable: true,
				get: () => (preview.hidden ? 100 : 60),
			});
			syncOutlineLabelOverflow(container);
			expect(preview.hidden).toBe(true);
		}
	});

	it('keeps mobile disclosure, label, and overflowing preview in one owned row', () => {
		const container = document.createElement('div');
		const handlers = actions();
		const labelText = '很長而且需要截斷的父層 Bullet 全文';
		renderOutlineSidebar(
			container,
			model({
				isMobile: true,
				outline: Object.freeze([
					Object.freeze({
						label: labelText,
						anchor: 0,
						children: Object.freeze([
							Object.freeze({
								label: 'Child',
								anchor: 20,
								children: Object.freeze([]),
							}),
						]),
					}),
				]),
			}),
			handlers,
		);
		const row = container.querySelector<HTMLElement>(
			'.bullet-zoom-outline-sidebar-row',
		);
		const disclosure = row?.querySelector<HTMLButtonElement>(
			'.bullet-zoom-outline-sidebar-disclosure',
		);
		const label = row?.querySelector<HTMLButtonElement>(
			'.bullet-zoom-outline-sidebar-label',
		);
		const preview = row?.querySelector<HTMLButtonElement>(
			'.bullet-zoom-outline-sidebar-preview',
		);

		expect(Array.from(row?.children ?? []).map(({ className }) => className)).toEqual([
			'bullet-zoom-outline-sidebar-disclosure',
			'bullet-zoom-outline-sidebar-label',
			'bullet-zoom-outline-sidebar-preview',
		]);
		expect(disclosure?.parentElement).toBe(row);
		expect(label?.parentElement).toBe(row);
		expect(preview?.parentElement).toBe(row);
		if (
			label !== null &&
			label !== undefined &&
			preview !== null &&
			preview !== undefined
		) {
			Object.defineProperty(label, 'clientWidth', {
				configurable: true,
				value: 80,
			});
			Object.defineProperty(label, 'scrollWidth', {
				configurable: true,
				value: 180,
			});
			syncOutlineLabelOverflow(container);
			expect(preview.hidden).toBe(false);
		}

		disclosure?.click();
		label?.click();
		preview?.click();
		expect(handlers.onToggle).toHaveBeenCalledWith({ anchor: 0, revision: 1 });
		expect(handlers.onSelect).toHaveBeenCalledWith({ anchor: 0, revision: 1 });
		expect(handlers.onPreview).toHaveBeenCalledWith(
			{ anchor: 0, revision: 1 },
			labelText,
			preview,
		);
	});

	it('keeps duplicate plain labels routed by their numeric anchors', () => {
		const container = document.createElement('div');
		const handlers = actions();
		renderOutlineSidebar(
			container,
			model({
				outline: Object.freeze([
					Object.freeze({ label: 'Same', anchor: 0, children: Object.freeze([]) }),
					Object.freeze({ label: 'Same', anchor: 7, children: Object.freeze([]) }),
				]),
			}),
			handlers,
		);
		const labels = container.querySelectorAll<HTMLButtonElement>(
			'.bullet-zoom-outline-sidebar-label',
		);
		labels[0]?.click();
		labels[1]?.click();
		expect(handlers.onSelect).toHaveBeenNthCalledWith(1, {
			anchor: 0,
			revision: 1,
		});
		expect(handlers.onSelect).toHaveBeenNthCalledWith(2, {
			anchor: 7,
			revision: 1,
		});
	});

	it('shows non-actionable empty and pending states with an explicit pending retry', () => {
		const container = document.createElement('div');
		const handlers = actions();
		renderOutlineSidebar(container, model({ status: 'empty' }), handlers);
		expect(container.textContent).toContain('這份筆記沒有可切換的 Bullet');
		expect(container.querySelector('.bullet-zoom-outline-sidebar-label')).toBeNull();
		renderOutlineSidebar(container, model({ status: 'pending' }), handlers);
		expect(container.textContent).toContain('筆記結構仍在解析');
		expect(container.querySelector('.bullet-zoom-outline-sidebar-label')).toBeNull();
		container
			.querySelector<HTMLButtonElement>('.bullet-zoom-outline-sidebar-retry')
			?.click();
		expect(handlers.onRetry).toHaveBeenCalledWith(1);
		renderOutlineSidebar(container, model({ status: 'unavailable' }), handlers);
		expect(container.textContent).toContain(
			'請先開啟即時預覽模式的 Markdown 筆記',
		);
		expect(container.querySelector('button')).toBeNull();
		renderOutlineSidebar(container, model({ status: 'limited' }), handlers);
		expect(container.textContent).toContain('Bullet 大綱過大');
		expect(container.querySelector('.bullet-zoom-outline-sidebar-label')).toBeNull();
	});

	it('ignores a hostile mutated data anchor while restoring focus', () => {
		const container = document.createElement('div');
		document.body.append(container);
		const outline = Object.freeze([
			Object.freeze({ label: 'Parent', anchor: 0, children: Object.freeze([]) }),
		]);
		renderOutlineSidebar(
			container,
			model({ outline, revealCurrent: false }),
			actions(),
		);
		const item = container.querySelector<HTMLElement>('[data-anchor]');
		const label = container.querySelector<HTMLButtonElement>(
			'.bullet-zoom-outline-sidebar-label',
		);
		expect(item).not.toBeNull();
		expect(label).not.toBeNull();
		if (item !== null && label !== null) {
			item.dataset.anchor = '"]';
			label.focus();
			expect(() =>
				renderOutlineSidebar(
					container,
					model({ outline, revealCurrent: false }),
					actions(),
				),
			).not.toThrow();
		}
	});
});

describe('native outline sidebar coordinator', () => {
	it('opens a validated mobile full-text preview without changing editor state', async () => {
		const fixture = await createCoordinatorFixture(
			'- This is a long **plain** Bullet label',
			true,
		);
		const label = fixture.sidebarView.contentEl.querySelector<HTMLButtonElement>(
			'.bullet-zoom-outline-sidebar-label',
		);
		const preview = fixture.sidebarView.contentEl.querySelector<HTMLButtonElement>(
			'.bullet-zoom-outline-sidebar-preview',
		);
		expect(label?.textContent).toBe('This is a long plain Bullet label');
		expect(preview).not.toBeNull();
		if (label !== null && preview !== null) {
			Object.defineProperty(label, 'clientWidth', { configurable: true, value: 90 });
			Object.defineProperty(label, 'scrollWidth', { configurable: true, value: 240 });
			syncOutlineLabelOverflow(fixture.sidebarView.contentEl);
			const beforeDoc = fixture.editorView.state.doc.toString();
			const beforeSelection = fixture.editorView.state.selection;
			preview.click();
			expect(document.body.textContent).toContain('Bullet 全文');
			expect(document.body.textContent).toContain(
				'This is a long plain Bullet label',
			);
			expect(fixture.onFocus).not.toHaveBeenCalled();
			expect(fixture.onExit).not.toHaveBeenCalled();
			expect(fixture.setActiveLeaf).not.toHaveBeenCalled();
			expect(fixture.editorView.state.doc.toString()).toBe(beforeDoc);
			expect(fixture.editorView.state.selection).toEqual(beforeSelection);
			document.body
				.querySelector<HTMLButtonElement>('.bullet-zoom-outline-preview-close')
				?.click();
			expect(document.activeElement).toBe(preview);
		}
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('remeasures mobile overflow on native sidebar resize and disconnects on close', async () => {
		const originalResizeObserver = window.ResizeObserver;
		let resizeCallback: (() => void) | null = null;
		const observe = vi.fn();
		const disconnect = vi.fn();
		class ResizeObserverMock {
			constructor(callback: () => void) {
				resizeCallback = callback;
			}
			observe = observe;
			disconnect = disconnect;
		}
		Object.defineProperty(window, 'ResizeObserver', {
			configurable: true,
			value: ResizeObserverMock,
		});
		const fixture = await createCoordinatorFixture('- Long mobile label', true);
		const label = fixture.sidebarView.contentEl.querySelector<HTMLButtonElement>(
			'.bullet-zoom-outline-sidebar-label',
		);
		const preview = fixture.sidebarView.contentEl.querySelector<HTMLButtonElement>(
			'.bullet-zoom-outline-sidebar-preview',
		);
		expect(observe).toHaveBeenCalledWith(fixture.sidebarView.contentEl);
		if (label !== null && preview !== null) {
			Object.defineProperty(label, 'clientWidth', { configurable: true, value: 80 });
			Object.defineProperty(label, 'scrollWidth', { configurable: true, value: 160 });
			expect(resizeCallback).not.toBeNull();
			(resizeCallback as unknown as () => void)();
			expect(preview.hidden).toBe(false);
		}
		await fixture.sidebarView.onClose();
		expect(disconnect).toHaveBeenCalledOnce();
		Object.defineProperty(window, 'ResizeObserver', {
			configurable: true,
			value: originalResizeObserver,
		});
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('rejects a stale mobile preview action after the document changes', async () => {
		const fixture = await createCoordinatorFixture('- Old **label**', true);
		const stalePreview =
			fixture.sidebarView.contentEl.querySelector<HTMLButtonElement>(
				'.bullet-zoom-outline-sidebar-preview',
			);
		expect(stalePreview).not.toBeNull();
		fixture.editorView.dispatch({
			changes: { from: 0, to: fixture.editorView.state.doc.length, insert: '- New label' },
		});
		stalePreview?.click();
		expect(document.body.textContent).not.toContain('Bullet 全文');
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('rejects a disconnected mobile preview control without opening a dialog', async () => {
		const fixture = await createCoordinatorFixture('- Long label', true);
		const preview = fixture.sidebarView.contentEl.querySelector<HTMLButtonElement>(
			'.bullet-zoom-outline-sidebar-preview',
		);
		expect(preview).not.toBeNull();
		preview?.remove();
		preview?.click();
		expect(document.body.textContent).not.toContain('Bullet 全文');
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('reveals and validates the registered deferred ItemView', async () => {
		const fixture = await createCoordinatorFixture('- Parent');
		expect(fixture.ensureSideLeaf).toHaveBeenCalledWith(
			BULLET_OUTLINE_VIEW_TYPE,
			'right',
			expect.objectContaining({ active: true, reveal: true }),
		);
		expect(fixture.revealLeaf).toHaveBeenCalledWith(fixture.sidebarLeaf);
		expect(fixture.sidebarView.getViewType()).toBe(BULLET_OUTLINE_VIEW_TYPE);
		expect(fixture.sidebarView.getDisplayText()).toBe(BULLET_OUTLINE_VIEW_NAME);
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('expands the current path and keeps the desktop sidebar visible after focus', async () => {
		const fixture = await createCoordinatorFixture(
			'- Parent\n  - Child\n    - Grandchild',
		);
		const grandchild = fixture.editorView.state.doc.line(3).from + 4;
		fixture.setCurrentAnchor(grandchild);
		await Promise.resolve();
		expect(
			fixture.sidebarView.contentEl.querySelectorAll(
				'.bullet-zoom-outline-sidebar-label',
			),
		).toHaveLength(3);
		expect(
			fixture.sidebarView.contentEl.querySelector<HTMLButtonElement>(
				'.bullet-zoom-outline-sidebar-disclosure',
			)?.disabled,
		).toBe(true);
		fixture.sidebarView.contentEl
			.querySelector<HTMLButtonElement>(`[data-anchor="${grandchild}"] .bullet-zoom-outline-sidebar-label`)
			?.click();
		await Promise.resolve();
		expect(fixture.onFocus).toHaveBeenCalledWith(fixture.editorView, grandchild);
		expect(getFocusSession(fixture.editorView.state)?.anchor).toBe(grandchild);
		expect(fixture.focusEditor).toHaveBeenCalled();
		expect(fixture.setActiveLeaf).not.toHaveBeenCalled();
		expect(fixture.sidebarView.contentEl.textContent).toContain('Grandchild');
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('opens only the current path without globally expanding unrelated branches', async () => {
		const fixture = await createCoordinatorFixture(
			'- Parent A\n  - Child A\n    - Grandchild A\n- Parent B\n  - Child B',
			true,
		);
		const grandchild = fixture.editorView.state.doc.line(3).from + 4;
		fixture.setCurrentAnchor(grandchild);
		await Promise.resolve();

		const parentA = fixture.editorView.state.doc.line(1).from;
		const childA = fixture.editorView.state.doc.line(2).from + 2;
		const parentB = fixture.editorView.state.doc.line(4).from;
		expect(
			fixture.sidebarView.contentEl.querySelector<HTMLButtonElement>(
				`[data-anchor="${parentA}"] .bullet-zoom-outline-sidebar-disclosure`,
			)?.getAttribute('aria-expanded'),
		).toBe('true');
		expect(
			fixture.sidebarView.contentEl.querySelector<HTMLButtonElement>(
				`[data-anchor="${childA}"] .bullet-zoom-outline-sidebar-disclosure`,
			)?.getAttribute('aria-expanded'),
		).toBe('true');
		expect(
			fixture.sidebarView.contentEl.querySelector<HTMLButtonElement>(
				`[data-anchor="${parentB}"] .bullet-zoom-outline-sidebar-disclosure`,
			)?.getAttribute('aria-expanded'),
		).toBe('false');
		expect(fixture.sidebarView.contentEl.textContent).not.toContain('Child B');
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('follows the caret Bullet without changing Zoom, folds, or Markdown', async () => {
		const scrollIntoView = vi.fn();
		Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
			configurable: true,
			value: scrollIntoView,
		});
		const outlineBuilder = vi.fn(buildBulletOutline);
		const fixture = await createCoordinatorFixture(
			'- Parent\n  - Child\n    - Grandchild',
			false,
			[],
			outlineBuilder,
			true,
		);
		const childLine = fixture.editorView.state.doc.line(2);
		const childAnchor = childLine.from + 2;
		const documentBefore = fixture.editorView.state.doc.toString();
		const foldsBefore = foldedRanges(fixture.editorView.state);
		scrollIntoView.mockClear();
		outlineBuilder.mockClear();

		fixture.editorView.dispatch({ selection: { anchor: childLine.from + 5 } });
		await new Promise((resolve) => window.setTimeout(resolve, 50));

		const currentRow = fixture.sidebarView.contentEl.querySelector<HTMLElement>(
			'.bullet-zoom-outline-sidebar-row.is-current',
		);
		expect(currentRow?.parentElement?.dataset.anchor).toBe(String(childAnchor));
		expect(
			fixture.sidebarView.contentEl.querySelector<HTMLButtonElement>(
				'[data-anchor="0"] .bullet-zoom-outline-sidebar-disclosure',
			)?.getAttribute('aria-expanded'),
		).toBe('true');
		expect(scrollIntoView).toHaveBeenCalledOnce();
		expect(outlineBuilder).not.toHaveBeenCalled();
		expect(fixture.onFocus).not.toHaveBeenCalled();
		expect(getFocusSession(fixture.editorView.state)).toBeNull();
		expect(foldedRanges(fixture.editorView.state)).toBe(foldsBefore);
		expect(fixture.editorView.state.doc.toString()).toBe(documentBefore);
		expect(fixture.editorView.state.selection.main.head).toBe(childLine.from + 5);

		scrollIntoView.mockClear();
		outlineBuilder.mockClear();
		fixture.editorView.dispatch({ selection: { anchor: childLine.to } });
		await new Promise((resolve) => window.setTimeout(resolve, 50));
		expect(scrollIntoView).not.toHaveBeenCalled();
		expect(outlineBuilder).not.toHaveBeenCalled();

		delete (HTMLElement.prototype as { scrollIntoView?: unknown }).scrollIntoView;
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('reveals a newly created Bullet without waiting for the typing debounce', async () => {
		const scrollIntoView = vi.fn();
		Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
			configurable: true,
			value: scrollIntoView,
		});
		const fixture = await createCoordinatorFixture('- Existing', false, [], buildBulletOutline, true);
		scrollIntoView.mockClear();
		const insertFrom = fixture.editorView.state.doc.length;
		const insertedText = '\n- New';
		fixture.editorView.dispatch({
			changes: { from: insertFrom, insert: insertedText },
			selection: { anchor: insertFrom + insertedText.length },
		});
		await Promise.resolve();

		const newAnchor = fixture.editorView.state.doc.line(2).from;
		expect(
			fixture.sidebarView.contentEl.querySelector<HTMLElement>(
				'.bullet-zoom-outline-sidebar-row.is-current',
			)?.parentElement?.dataset.anchor,
		).toBe(String(newAnchor));
		expect(scrollIntoView).toHaveBeenCalledOnce();

		delete (HTMLElement.prototype as { scrollIntoView?: unknown }).scrollIntoView;
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('coalesces rapid caret movement and reuses the outline for the same document', async () => {
		const source = Array.from({ length: 1000 }, (_, index) => `- Item ${index}`).join(
			'\n',
		);
		const outlineBuilder = vi.fn(buildBulletOutline);
		const fixture = await createCoordinatorFixture(
			source,
			false,
			[],
			outlineBuilder,
			true,
		);
		const updateModel = vi.spyOn(fixture.sidebarView, 'updateModel');
		outlineBuilder.mockClear();

		for (const lineNumber of [250, 500, 750, 1000]) {
			fixture.editorView.dispatch({
				selection: { anchor: fixture.editorView.state.doc.line(lineNumber).to },
			});
		}
		expect(updateModel).not.toHaveBeenCalled();
		await new Promise((resolve) => window.setTimeout(resolve, 50));

		expect(updateModel).toHaveBeenCalledOnce();
		expect(outlineBuilder).not.toHaveBeenCalled();
		expect(
			fixture.sidebarView.contentEl.querySelector<HTMLElement>(
				'.bullet-zoom-outline-sidebar-row.is-current',
			)?.parentElement?.dataset.anchor,
		).toBe(String(fixture.editorView.state.doc.line(1000).from));
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('falls back to the active Zoom anchor when the caret leaves supported Bullets', async () => {
		const fixture = await createCoordinatorFixture(
			'- Parent\n  - Child\n    - Grandchild\n\nParagraph',
			false,
			[],
			buildBulletOutline,
			true,
		);
		const grandchildAnchor = fixture.editorView.state.doc.line(3).from + 4;
		fixture.setCurrentAnchor(grandchildAnchor);
		fixture.editorView.dispatch({
			selection: { anchor: fixture.editorView.state.doc.line(5).to },
		});
		await new Promise((resolve) => window.setTimeout(resolve, 50));

		const currentRow = fixture.sidebarView.contentEl.querySelector<HTMLElement>(
			'.bullet-zoom-outline-sidebar-row.is-current',
		);
		expect(currentRow?.parentElement?.dataset.anchor).toBe(
			String(grandchildAnchor),
		);
		expect(
			fixture.sidebarView.contentEl.querySelectorAll(
				'.bullet-zoom-outline-sidebar-label',
			),
		).toHaveLength(3);
		expect(fixture.onFocus).not.toHaveBeenCalled();
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('changes only tree visibility when disclosure is activated', async () => {
		const fixture = await createCoordinatorFixture('- Parent\n  - Child');
		const documentBefore = fixture.editorView.state.doc.toString();
		const selectionBefore = fixture.editorView.state.selection;
		const focusBefore = getFocusSession(fixture.editorView.state);

		fixture.sidebarView.contentEl
			.querySelector<HTMLButtonElement>('.bullet-zoom-outline-sidebar-disclosure')
			?.click();

		expect(fixture.sidebarView.contentEl.textContent).toContain('Child');
		expect(fixture.onFocus).not.toHaveBeenCalled();
		expect(fixture.editorView.state.selection).toBe(selectionBefore);
		expect(getFocusSession(fixture.editorView.state)).toBe(focusBefore);
		expect(fixture.editorView.state.doc.toString()).toBe(documentBefore);
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('restores disclosure focus and scroll position after a manual toggle', async () => {
		const fixture = await createCoordinatorFixture('- Parent\n  - Child');
		const body = fixture.sidebarView.contentEl.querySelector<HTMLElement>(
			'.bullet-zoom-outline-sidebar-body',
		);
		const disclosure = fixture.sidebarView.contentEl.querySelector<HTMLButtonElement>(
			'.bullet-zoom-outline-sidebar-disclosure',
		);
		expect(body).not.toBeNull();
		expect(disclosure).not.toBeNull();
		if (body !== null && disclosure !== null) {
			body.scrollTop = 37;
			disclosure.focus();
			disclosure.click();
			expect(document.activeElement).toBe(
				fixture.sidebarView.contentEl.querySelector(
					'.bullet-zoom-outline-sidebar-disclosure',
				),
			);
			expect(
				fixture.sidebarView.contentEl.querySelector<HTMLElement>(
					'.bullet-zoom-outline-sidebar-body',
				)?.scrollTop,
			).toBe(37);
		}
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('restores focused controls inside a pop-out document realm', () => {
		const iframe = document.createElement('iframe');
		document.body.append(iframe);
		const popoutDocument = iframe.contentDocument;
		expect(popoutDocument).not.toBeNull();
		if (popoutDocument === null) {
			return;
		}
		const container = popoutDocument.createElement('div');
		popoutDocument.body.append(container);
		const outline = Object.freeze([
			Object.freeze({
				label: 'Parent',
				anchor: 0,
				children: Object.freeze([
					Object.freeze({
						label: 'Child',
						anchor: 11,
						children: Object.freeze([]),
					}),
				]),
			}),
		]);
		renderOutlineSidebar(
			container,
			model({ outline, expandedAnchors: new Set([0]) }),
			actions(),
		);
		container
			.querySelector<HTMLButtonElement>(
				'.bullet-zoom-outline-sidebar-disclosure',
			)
			?.focus();

		renderOutlineSidebar(
			container,
			model({
				outline,
				expandedAnchors: new Set<number>(),
				revealCurrent: false,
			}),
			actions(),
		);
		expect(popoutDocument.activeElement).toBe(
			container.querySelector('.bullet-zoom-outline-sidebar-disclosure'),
		);
		iframe.remove();
	});

	it('does not scroll back to the current node during unrelated disclosure rendering', () => {
		const scrollIntoView = vi.fn();
		Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
			configurable: true,
			value: scrollIntoView,
		});
		const state = EditorState.create({
			doc: '- Parent A\n  - Child A\n- Parent B\n  - Child B',
			extensions: [markdown()],
		});
		const outline = buildBulletOutline(state);
		const currentAnchor = state.doc.line(2).from + 2;
		const container = document.createElement('div');
		renderOutlineSidebar(
			container,
			model({
				outline,
				currentAnchor,
				expandedAnchors: new Set([outline[0]?.anchor ?? 0]),
				revealCurrent: true,
			}),
			actions(),
		);
		expect(scrollIntoView).toHaveBeenCalledOnce();
		scrollIntoView.mockClear();
		renderOutlineSidebar(
			container,
			model({
				outline,
				currentAnchor,
				expandedAnchors: new Set(outline.map(({ anchor }) => anchor)),
				revealCurrent: false,
			}),
			actions(),
		);
		expect(scrollIntoView).not.toHaveBeenCalled();
		delete (HTMLElement.prototype as { scrollIntoView?: unknown }).scrollIntoView;
	});

	it('forces the current node back into view when the same source is reopened', async () => {
		const scrollIntoView = vi.fn();
		Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
			configurable: true,
			value: scrollIntoView,
		});
		const fixture = await createCoordinatorFixture('- Parent\n  - Child');
		const child = fixture.editorView.state.doc.line(2).from + 2;
		fixture.setCurrentAnchor(child);
		await Promise.resolve();
		scrollIntoView.mockClear();
		await fixture.coordinator.openForEditor(fixture.editorView);
		expect(scrollIntoView).toHaveBeenCalledOnce();
		delete (HTMLElement.prototype as { scrollIntoView?: unknown }).scrollIntoView;
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('does not duplicate an immediate reopen through an older queued refresh', async () => {
		const outlineBuilder = vi.fn(buildBulletOutline);
		const fixture = await createCoordinatorFixture(
			'- Parent',
			false,
			[],
			outlineBuilder,
		);
		outlineBuilder.mockClear();
		await fixture.coordinator.openForEditor(fixture.editorView);
		await Promise.resolve();
		expect(outlineBuilder).toHaveBeenCalledOnce();
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('keeps a newer pane when concurrent open requests resolve out of order', async () => {
		const fixture = await createCoordinatorFixture('- First pane');
		const second = fixture.addSource('- Second pane', 'Second.md');
		let resolveOlder: ((leaf: WorkspaceLeaf) => void) | undefined;
		const olderLeaf = new Promise<WorkspaceLeaf>((resolve) => {
			resolveOlder = resolve;
		});
		fixture.ensureSideLeaf.mockReturnValueOnce(olderLeaf);
		const older = fixture.coordinator.openForEditor(fixture.editorView);
		const newer = fixture.coordinator.openForEditor(second.view);
		await expect(newer).resolves.toBe('opened');
		resolveOlder?.(fixture.sidebarLeaf as unknown as WorkspaceLeaf);
		await expect(older).resolves.toBe('superseded');
		expect(fixture.sidebarView.contentEl.textContent).toContain('Second pane');
		expect(fixture.sidebarView.contentEl.textContent).not.toContain('First pane');
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
		second.view.destroy();
		second.parent.remove();
	});

	it('does not overwrite a pane activated while an older reveal is pending', async () => {
		const fixture = await createCoordinatorFixture('- First pane');
		const second = fixture.addSource('- Second pane', 'Second.md');
		let resolveOlder: ((leaf: WorkspaceLeaf) => void) | undefined;
		const olderLeaf = new Promise<WorkspaceLeaf>((resolve) => {
			resolveOlder = resolve;
		});
		fixture.ensureSideLeaf.mockReturnValueOnce(olderLeaf);
		const older = fixture.coordinator.openForEditor(fixture.editorView);
		fixture.emit('active-leaf-change', second.leaf);
		await Promise.resolve();
		resolveOlder?.(fixture.sidebarLeaf as unknown as WorkspaceLeaf);
		await expect(older).resolves.toBe('superseded');
		expect(fixture.sidebarView.contentEl.textContent).toContain('Second pane');
		expect(fixture.sidebarView.contentEl.textContent).not.toContain('First pane');
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
		second.view.destroy();
		second.parent.remove();
	});

	it('reveals the current location after switching between same-file editor panes', async () => {
		const scrollIntoView = vi.fn();
		Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
			configurable: true,
			value: scrollIntoView,
		});
		const fixture = await createCoordinatorFixture('- First pane');
		const second = fixture.addSource('- Second pane', 'Ideas.md');
		scrollIntoView.mockClear();
		await fixture.coordinator.openForEditor(second.view);
		expect(scrollIntoView).toHaveBeenCalledOnce();
		expect(fixture.sidebarView.contentEl.textContent).toContain('Second pane');
		delete (HTMLElement.prototype as { scrollIntoView?: unknown }).scrollIntoView;
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
		second.view.destroy();
		second.parent.remove();
	});

	it('uses the shared fold-aware transition for a folded sidebar target', async () => {
		const source = [
			'- Parent',
			'  - Child',
			'    - Grandchild',
			'      - Great grandchild',
		].join('\n');
		const fixture = await createCoordinatorFixture(source, false, codeFolding());
		const foldLine = (lineNumber: number): { from: number; to: number } => {
			const line = fixture.editorView.state.doc.line(lineNumber);
			const range = foldable(
				fixture.editorView.state,
				line.from,
				line.to,
			);
			expect(range).not.toBeNull();
			if (range === null) {
				throw new Error('Expected foldable test line.');
			}
			fixture.editorView.dispatch({ effects: foldEffect.of(range) });
			return range;
		};
		const descendantFold = foldLine(3);
		foldLine(2);
		foldLine(1);
		const child = fixture.editorView.state.doc.line(2).from + 2;

		fixture.sidebarView.contentEl
			.querySelector<HTMLButtonElement>('.bullet-zoom-outline-sidebar-disclosure')
			?.click();
		fixture.sidebarView.contentEl
			.querySelector<HTMLButtonElement>(`[data-anchor="${child}"] .bullet-zoom-outline-sidebar-label`)
			?.click();
		await Promise.resolve();
		const folds: Array<{ from: number; to: number }> = [];
		foldedRanges(fixture.editorView.state).between(
			0,
			fixture.editorView.state.doc.length,
			(from, to) => {
				folds.push({ from, to });
			},
		);
		expect(folds).toEqual([descendantFold]);
		expect(getFocusSession(fixture.editorView.state)?.anchor).toBe(child);
		expect(fixture.editorView.state.selection.main.head).toBe(
			fixture.editorView.state.doc.line(2).to,
		);
		expect(fixture.editorView.state.doc.toString()).toBe(source);
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('returns to the complete note through the existing exit transition', async () => {
		const fixture = await createCoordinatorFixture('- Parent\n  - Child');
		const child = fixture.editorView.state.doc.line(2).from + 2;
		expect(enterFocusAt(fixture.editorView, child)).toBe(true);
		fixture.setCurrentAnchor(child);
		fixture.coordinator.notifyEditorReady(fixture.editorView);
		await Promise.resolve();
		fixture.sidebarView.contentEl
			.querySelector<HTMLButtonElement>('.bullet-zoom-outline-sidebar-root')
			?.click();
		await Promise.resolve();
		expect(fixture.onExit).toHaveBeenCalledWith(fixture.editorView);
		expect(getFocusSession(fixture.editorView.state)).toBeNull();
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('returns to the originating Markdown leaf after a mobile selection', async () => {
		const fixture = await createCoordinatorFixture('- Parent', true);
		fixture.sidebarView.contentEl
			.querySelector<HTMLButtonElement>('.bullet-zoom-outline-sidebar-label')
			?.click();
		await Promise.resolve();
		expect(fixture.setActiveLeaf).toHaveBeenCalledWith(fixture.sourceLeaf, {
			focus: true,
		});
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('contains transition exceptions and reports one action failure', async () => {
		const fixture = await createCoordinatorFixture('- Parent', true);
		fixture.setActiveLeaf.mockImplementationOnce(() => {
			throw new Error('workspace transition failed');
		});
		fixture.sidebarView.contentEl
			.querySelector<HTMLButtonElement>('.bullet-zoom-outline-sidebar-label')
			?.click();
		await Promise.resolve();
		expect(fixture.onUnexpectedError).toHaveBeenCalledOnce();
		expect(fixture.setActiveLeaf).toHaveBeenCalledOnce();

		fixture.onUnexpectedError.mockClear();
		fixture.setFilePath('Other.md');
		fixture.sidebarView.contentEl
			.querySelector<HTMLButtonElement>('.bullet-zoom-outline-sidebar-label')
			?.click();
		await Promise.resolve();
		expect(fixture.onUnexpectedError).not.toHaveBeenCalled();
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('does not activate a source that detaches during the focus transition', async () => {
		let detachDuringTransition = false;
		let detachSource: () => void = () => undefined;
		const fixture = await createCoordinatorFixture(
			'- Parent',
			true,
			EditorView.updateListener.of(() => {
				if (detachDuringTransition) {
					detachSource();
				}
			}),
		);
		detachSource = fixture.detachSource;
		detachDuringTransition = true;
		fixture.sidebarView.contentEl
			.querySelector<HTMLButtonElement>('.bullet-zoom-outline-sidebar-label')
			?.click();
		await Promise.resolve();
		expect(fixture.setActiveLeaf).not.toHaveBeenCalled();
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('returns to the originating mobile editor when 全文 is already current', async () => {
		const fixture = await createCoordinatorFixture('- Parent', true);
		fixture.sidebarView.contentEl
			.querySelector<HTMLButtonElement>('.bullet-zoom-outline-sidebar-root')
			?.click();
		await Promise.resolve();
		expect(fixture.onExit).not.toHaveBeenCalled();
		expect(fixture.setActiveLeaf).toHaveBeenCalledWith(fixture.sourceLeaf, {
			focus: true,
		});
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('rejects a stale node after document replacement without dispatching navigation', async () => {
		const fixture = await createCoordinatorFixture('- Parent');
		const staleButton = fixture.sidebarView.contentEl.querySelector<HTMLButtonElement>(
			'.bullet-zoom-outline-sidebar-label',
		);
		fixture.editorView.dispatch({ changes: { from: 0, insert: 'Changed\n' } });
		staleButton?.click();
		await Promise.resolve();
		expect(fixture.onFocus).not.toHaveBeenCalled();
		expect(fixture.setActiveLeaf).not.toHaveBeenCalled();
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('invalidates an old label before a same-anchor replacement can dispatch', async () => {
		const fixture = await createCoordinatorFixture('- Old');
		const staleButton = fixture.sidebarView.contentEl.querySelector<HTMLButtonElement>(
			'.bullet-zoom-outline-sidebar-label',
		);
		fixture.editorView.dispatch({
			changes: { from: 0, to: fixture.editorView.state.doc.length, insert: '- New' },
		});
		staleButton?.click();
		expect(fixture.onFocus).not.toHaveBeenCalled();
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('ignores editor updates that cannot change sidebar presentation', async () => {
		const fixture = await createCoordinatorFixture('- Parent\n  - Child');
		const updateModel = vi.spyOn(fixture.sidebarView, 'updateModel');
		fixture.editorView.dispatch({ selection: { anchor: 2 } });
		await Promise.resolve();
		expect(updateModel).not.toHaveBeenCalled();
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('maps an expanded branch through a document edit and coalesces the resulting refresh', async () => {
		const fixture = await createCoordinatorFixture('- Parent\n  - Child');
		const updateModel = vi.spyOn(fixture.sidebarView, 'updateModel');
		fixture.sidebarView.contentEl
			.querySelector<HTMLButtonElement>('.bullet-zoom-outline-sidebar-disclosure')
			?.click();
		expect(fixture.sidebarView.contentEl.textContent).toContain('Child');
		updateModel.mockClear();

		fixture.editorView.dispatch({ changes: { from: 0, insert: '  ' } });
		await new Promise((resolve) => window.setTimeout(resolve, 90));
		expect(updateModel).toHaveBeenCalledOnce();
		expect(
			fixture.sidebarView.contentEl.querySelector('[data-anchor="2"]'),
		).not.toBeNull();
		expect(fixture.sidebarView.contentEl.textContent).toContain('Child');
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('debounces repeated typing before rebuilding a 1,000-row outline', async () => {
		const source = Array.from({ length: 1000 }, (_, index) => `- Item ${index}`).join(
			'\n',
		);
		const fixture = await createCoordinatorFixture(source);
		const updateModel = vi.spyOn(fixture.sidebarView, 'updateModel');
		const body = fixture.sidebarView.contentEl.querySelector<HTMLElement>(
			'.bullet-zoom-outline-sidebar-body',
		);
		if (body !== null) {
			body.scrollTop = 84;
		}
		for (const character of ['a', 'b', 'c']) {
			fixture.editorView.dispatch({
				changes: {
					from: fixture.editorView.state.doc.length,
					insert: character,
				},
			});
			fixture.emit('editor-change');
		}
		expect(updateModel).not.toHaveBeenCalled();
		await new Promise((resolve) => window.setTimeout(resolve, 90));
		expect(updateModel).toHaveBeenCalledOnce();
		expect(
			fixture.sidebarView.contentEl.querySelector<HTMLElement>(
				'.bullet-zoom-outline-sidebar-body',
			)?.scrollTop,
		).toBe(84);
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('preserves sidebar browsing when an edit maps the focused anchor', async () => {
		const scrollIntoView = vi.fn();
		Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
			configurable: true,
			value: scrollIntoView,
		});
		const fixture = await createCoordinatorFixture('- Parent\n  - Child');
		const child = fixture.editorView.state.doc.line(2).from + 2;
		fixture.setCurrentAnchor(child);
		await Promise.resolve();
		scrollIntoView.mockClear();
		fixture.setCurrentAnchor(child + 2);
		fixture.editorView.dispatch({ changes: { from: 0, insert: '  ' } });
		await new Promise((resolve) => window.setTimeout(resolve, 90));
		expect(scrollIntoView).not.toHaveBeenCalled();
		delete (HTMLElement.prototype as { scrollIntoView?: unknown }).scrollIntoView;
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('promotes a pane switch above a pending typing debounce', async () => {
		const fixture = await createCoordinatorFixture('- First');
		fixture.editorView.dispatch({
			changes: { from: fixture.editorView.state.doc.length, insert: ' edit' },
		});
		const second = fixture.addSource('- Second', 'Other.md');
		fixture.emit('active-leaf-change', second.leaf);
		await Promise.resolve();
		expect(fixture.sidebarView.contentEl.textContent).toContain('Second');
		expect(fixture.sidebarView.contentEl.textContent).not.toContain('First edit');
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
		second.view.destroy();
		second.parent.remove();
	});

	it('cancels a pending debounce through the Window that created it', async () => {
		const fixture = await createCoordinatorFixture('- First');
		const iframe = document.createElement('iframe');
		document.body.append(iframe);
		const popoutWindow = iframe.contentWindow;
		expect(popoutWindow).not.toBeNull();
		if (popoutWindow === null) {
			return;
		}
		const mainClearTimeout = vi.spyOn(window, 'clearTimeout');
		const popoutClearTimeout = vi.spyOn(popoutWindow, 'clearTimeout');
		fixture.editorView.dispatch({
			changes: { from: fixture.editorView.state.doc.length, insert: ' edit' },
		});
		const second = fixture.addSource(
			'- Second',
			'Other.md',
			popoutWindow.document,
		);
		fixture.emit('active-leaf-change', second.leaf);
		await Promise.resolve();
		expect(mainClearTimeout).toHaveBeenCalled();
		expect(popoutClearTimeout).not.toHaveBeenCalled();
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
		second.view.destroy();
		iframe.remove();
	});

	it('keeps expanded anchors while parsing is pending and restores them when ready', async () => {
		let pending = false;
		const outlineBuilder = vi.fn((state: EditorState) => {
			if (pending) {
				throw new BulletOutlineParsePendingError();
			}
			return buildBulletOutline(state);
		});
		const fixture = await createCoordinatorFixture(
			'- Parent\n  - Child',
			false,
			[],
			outlineBuilder,
		);
		fixture.sidebarView.contentEl
			.querySelector<HTMLButtonElement>('.bullet-zoom-outline-sidebar-disclosure')
			?.click();
		expect(fixture.sidebarView.contentEl.textContent).toContain('Child');
		const body = fixture.sidebarView.contentEl.querySelector<HTMLElement>(
			'.bullet-zoom-outline-sidebar-body',
		);
		if (body !== null) {
			body.scrollTop = 63;
		}
		pending = true;
		fixture.editorView.dispatch({
			changes: { from: fixture.editorView.state.doc.length, insert: ' ' },
		});
		await new Promise((resolve) => window.setTimeout(resolve, 90));
		expect(fixture.sidebarView.contentEl.textContent).toContain('筆記結構仍在解析');
		pending = false;
		fixture.sidebarView.contentEl
			.querySelector<HTMLButtonElement>('.bullet-zoom-outline-sidebar-retry')
			?.click();
		expect(fixture.sidebarView.contentEl.textContent).toContain('Child');
		expect(
			fixture.sidebarView.contentEl.querySelector<HTMLElement>(
				'.bullet-zoom-outline-sidebar-body',
			)?.scrollTop,
		).toBe(63);
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('retains an explicit reopen reveal request across a pending parse', async () => {
		const scrollIntoView = vi.fn();
		Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
			configurable: true,
			value: scrollIntoView,
		});
		let pending = false;
		const outlineBuilder = (state: EditorState) => {
			if (pending) {
				throw new BulletOutlineParsePendingError();
			}
			return buildBulletOutline(state);
		};
		const fixture = await createCoordinatorFixture(
			'- Parent',
			false,
			[],
			outlineBuilder,
		);
		scrollIntoView.mockClear();
		pending = true;
		await fixture.coordinator.openForEditor(fixture.editorView);
		expect(fixture.sidebarView.contentEl.textContent).toContain('筆記結構仍在解析');
		pending = false;
		fixture.sidebarView.contentEl
			.querySelector<HTMLButtonElement>('.bullet-zoom-outline-sidebar-retry')
			?.click();
		expect(scrollIntoView).toHaveBeenCalledOnce();
		delete (HTMLElement.prototype as { scrollIntoView?: unknown }).scrollIntoView;
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('renders a non-actionable state when outline limits are exceeded', async () => {
		const fixture = await createCoordinatorFixture(
			'- Parent',
			false,
			[],
			() => {
				throw new BulletOutlineLimitError();
			},
		);
		expect(fixture.sidebarView.contentEl.textContent).toContain('Bullet 大綱過大');
		expect(
			fixture.sidebarView.contentEl.querySelector(
				'.bullet-zoom-outline-sidebar-label',
			),
		).toBeNull();
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('clears manual expansion when the retained editor switches files', async () => {
		const fixture = await createCoordinatorFixture('- Parent\n  - Child');
		fixture.sidebarView.contentEl
			.querySelector<HTMLButtonElement>('.bullet-zoom-outline-sidebar-disclosure')
			?.click();
		expect(fixture.sidebarView.contentEl.textContent).toContain('Child');

		fixture.setFilePath('Other.md');
		fixture.editorView.dispatch({ selection: { anchor: 0 } });
		await Promise.resolve();
		expect(
			fixture.sidebarView.contentEl.querySelector(
				'.bullet-zoom-outline-sidebar-label[aria-label="聚焦「Child」"]',
			),
		).toBeNull();
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('shows an unavailable state when the source stops being eligible', async () => {
		const fixture = await createCoordinatorFixture('- Parent');
		fixture.setEligible(false);
		fixture.editorView.dispatch({ selection: { anchor: 2 } });
		expect(fixture.sidebarView.contentEl.textContent).toContain(
			'請先開啟即時預覽模式的 Markdown 筆記',
		);
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('rejects actions after the source leaf detaches', async () => {
		const fixture = await createCoordinatorFixture('- Parent');
		const label = fixture.sidebarView.contentEl.querySelector<HTMLButtonElement>(
			'.bullet-zoom-outline-sidebar-label',
		);
		fixture.detachSource();
		label?.click();
		await Promise.resolve();
		expect(fixture.onFocus).not.toHaveBeenCalled();
		expect(fixture.sidebarView.contentEl.textContent).toContain(
			'請先開啟即時預覽模式的 Markdown 筆記',
		);
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('keeps the retained source without revealing current when the sidebar becomes active', async () => {
		const scrollIntoView = vi.fn();
		Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
			configurable: true,
			value: scrollIntoView,
		});
		const fixture = await createCoordinatorFixture('- Parent\n  - Child');
		scrollIntoView.mockClear();
		fixture.emit('active-leaf-change', fixture.sidebarLeaf);
		await Promise.resolve();
		expect(fixture.sidebarView.contentEl.textContent).toContain('Ideas');
		expect(fixture.sidebarView.contentEl.textContent).toContain('Parent');
		expect(scrollIntoView).not.toHaveBeenCalled();
		fixture.sidebarView.contentEl
			.querySelector<HTMLButtonElement>(
				'.bullet-zoom-outline-sidebar-disclosure',
			)
			?.click();
		expect(scrollIntoView).not.toHaveBeenCalled();
		delete (HTMLElement.prototype as { scrollIntoView?: unknown }).scrollIntoView;
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('defers collapsed native drawer rebuilds until the sidebar is visible again', async () => {
		const outlineBuilder = vi.fn(buildBulletOutline);
		const fixture = await createCoordinatorFixture(
			'- Parent',
			false,
			[],
			outlineBuilder,
		);
		outlineBuilder.mockClear();
		fixture.setRightSidebarCollapsed(true);
		fixture.editorView.dispatch({
			changes: { from: fixture.editorView.state.doc.length, insert: ' edit' },
		});
		fixture.emit('editor-change');
		await new Promise((resolve) => window.setTimeout(resolve, 90));
		expect(outlineBuilder).not.toHaveBeenCalled();

		fixture.setRightSidebarCollapsed(false);
		fixture.emit('layout-change');
		await Promise.resolve();
		expect(outlineBuilder).toHaveBeenCalledOnce();
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('retains manual expansion when switching same-file editor panes', async () => {
		const fixture = await createCoordinatorFixture('- Parent\n  - Child');
		fixture.sidebarView.contentEl
			.querySelector<HTMLButtonElement>('.bullet-zoom-outline-sidebar-disclosure')
			?.click();
		expect(fixture.sidebarView.contentEl.textContent).toContain('Child');
		const second = fixture.addSource('- Parent\n  - Child', 'Ideas.md');
		fixture.emit('active-leaf-change', second.leaf);
		await Promise.resolve();
		expect(fixture.sidebarView.contentEl.textContent).toContain('Child');
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
		second.view.destroy();
		second.parent.remove();
	});

	it('follows the most recently active eligible Markdown pane', async () => {
		const fixture = await createCoordinatorFixture('- First root');
		const staleFirstLabel =
			fixture.sidebarView.contentEl.querySelector<HTMLButtonElement>(
				'.bullet-zoom-outline-sidebar-label',
			);
		const second = fixture.addSource('- Second root\n  - Second child', 'Other.md');
		fixture.emit('active-leaf-change', second.leaf);
		await Promise.resolve();
		expect(fixture.sidebarView.contentEl.textContent).toContain('Other');
		expect(fixture.sidebarView.contentEl.textContent).toContain('Second root');
		expect(fixture.sidebarView.contentEl.textContent).not.toContain('First root');
		staleFirstLabel?.click();
		await Promise.resolve();
		expect(fixture.onFocus).not.toHaveBeenCalled();

		fixture.emit('active-leaf-change', fixture.sidebarLeaf);
		await Promise.resolve();
		expect(fixture.sidebarView.contentEl.textContent).toContain('Second root');
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
		second.view.destroy();
		second.parent.remove();
	});

	it('detaches plugin-owned leaves and refuses later actions on destroy', async () => {
		const fixture = await createCoordinatorFixture('- Parent');
		const label = fixture.sidebarView.contentEl.querySelector<HTMLButtonElement>(
			'.bullet-zoom-outline-sidebar-label',
		);
		fixture.coordinator.destroy();
		label?.click();
		await Promise.resolve();
		expect(fixture.sidebarLeaf.detach).toHaveBeenCalledOnce();
		expect(fixture.onFocus).not.toHaveBeenCalled();
		fixture.editorView.destroy();
	});

	it('turns workspace reveal failures into a safe false result', async () => {
		const fixture = await createCoordinatorFixture('- Parent');
		fixture.ensureSideLeaf.mockRejectedValueOnce(new Error('workspace unavailable'));
		await expect(fixture.coordinator.openCurrent()).resolves.toBe('failed');
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('opens the active mobile editor when no recent root leaf is available', async () => {
		const fixture = await createCoordinatorFixture('- Current mobile note', true);
		fixture.coordinator.notifyEditorDestroyed(fixture.editorView);
		fixture.emit('active-leaf-change', null);

		await expect(fixture.coordinator.openCurrent()).resolves.toBe('opened');
		expect(fixture.sidebarView.contentEl.textContent).toContain(
			'Current mobile note',
		);
		fixture.coordinator.destroy();
		fixture.editorView.destroy();
	});

	it('clears the shared view when the owning EditorView is destroyed', async () => {
		const fixture = await createCoordinatorFixture('- Parent');
		expect(fixture.sidebarView.contentEl.textContent).toContain('Parent');
		fixture.editorView.destroy();
		expect(fixture.sidebarView.contentEl.textContent).toContain(
			'請先開啟即時預覽模式的 Markdown 筆記',
		);
		fixture.coordinator.destroy();
	});
});
