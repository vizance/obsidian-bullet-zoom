import { markdown } from '@codemirror/lang-markdown';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
	closeOutlineSwitcher,
	findOutlinePath,
	openOutlineSwitcher,
	type OutlineSwitcherOptions,
} from '../src/outline-switcher';
import { buildBulletOutline } from '../src/list-structure';

type Fixture = Readonly<{
	parent: HTMLDivElement;
	view: EditorView;
	trigger: HTMLButtonElement;
}>;

afterEach(() => {
	document.body.replaceChildren();
});

function createFixture(source: string): Fixture {
	const parent = document.createElement('div');
	document.body.append(parent);
	const view = new EditorView({
		parent,
		state: EditorState.create({ doc: source, extensions: [markdown()] }),
	});
	vi.spyOn(view, 'focus').mockImplementation(() => undefined);
	const trigger = document.createElement('button');
	trigger.textContent = '切換 bullet';
	parent.prepend(trigger);
	return { parent, view, trigger };
}

function createOptions(
	fixture: Fixture,
	currentAnchor: number,
	overrides: Partial<OutlineSwitcherOptions> = {},
): OutlineSwitcherOptions {
	return {
		view: fixture.view,
		trigger: fixture.trigger,
		currentAnchor,
		noteTitle: 'Ideas',
		filePath: 'Ideas.md',
		getFilePath: () => 'Ideas.md',
		isMobile: false,
		isContextValid: () => true,
		onFocus: () => true,
		onExit: () => true,
		...overrides,
	};
}

describe('outline hierarchy utilities', () => {
	it('finds the exact active path by anchor instead of duplicate label', () => {
		const state = EditorState.create({
			doc: '- Idea\n  - Duplicate\n- Idea\n  - Duplicate',
			extensions: [markdown()],
		});
		const outline = buildBulletOutline(state);
		const target = state.doc.line(4).from + 2;
		expect(findOutlinePath(outline, target)?.map(({ anchor }) => anchor)).toEqual([
			state.doc.line(3).from,
			target,
		]);
	});
});

describe('desktop outline switcher', () => {
	it('opens the active hierarchy as clamped cascade columns without changing editor state', () => {
		const source = [
			'- Parent A',
			'  - Child A1',
			'    - Grandchild A1',
			'  - Child A2',
			'- Parent B',
		].join('\n');
		const fixture = createFixture(source);
		const currentAnchor = fixture.view.state.doc.line(3).from + 4;
		vi.spyOn(fixture.trigger, 'getBoundingClientRect').mockReturnValue({
			left: 680,
			right: 716,
			top: 20,
			bottom: 56,
			width: 36,
			height: 36,
			x: 680,
			y: 20,
			toJSON: () => ({}),
		});
		vi.spyOn(fixture.view.dom, 'getBoundingClientRect').mockReturnValue({
			left: 100,
			right: 740,
			top: 0,
			bottom: 600,
			width: 640,
			height: 600,
			x: 100,
			y: 0,
			toJSON: () => ({}),
		});
		const selectionBefore = fixture.view.state.selection;
		const docBefore = fixture.view.state.doc;
		const controller = openOutlineSwitcher(
			createOptions(fixture, currentAnchor),
		);

		const dialog = document.querySelector<HTMLElement>(
			'.bullet-zoom-outline-desktop',
		);
		const columns = Array.from(
			document.querySelectorAll('.bullet-zoom-outline-column'),
		);
		expect(controller.isOpen()).toBe(true);
		expect(dialog?.getAttribute('role')).toBe('dialog');
		expect(dialog?.getAttribute('aria-modal')).toBe('false');
		expect(columns).toHaveLength(3);
		expect(
			columns.map((column) =>
				Array.from(column.querySelectorAll('.bullet-zoom-outline-label')).map(
					(label) => label.textContent,
				),
			),
		).toEqual([
			['Parent A', 'Parent B'],
			['Child A1', 'Child A2'],
			['Grandchild A1'],
		]);
		expect(
			Array.from(document.querySelectorAll('.is-on-path')).map(
				(row) => row.textContent,
			),
		).toEqual(['Parent A›', 'Child A1›', 'Grandchild A1']);
		expect(document.querySelector('.is-current')?.textContent).toBe(
			'Grandchild A1',
		);
		expect(document.activeElement).toBe(
			document.querySelector(
				'.bullet-zoom-outline-label[aria-current="location"]',
			),
		);
		expect(dialog?.style.left).toBe('100px');
		expect(dialog?.style.maxWidth).toBe('640px');
		expect(dialog?.style.maxHeight).toBe('532px');
		expect(fixture.view.state.doc).toBe(docBefore);
		expect(fixture.view.state.selection).toBe(selectionBefore);

		controller.close(false);
		expect(document.querySelector('.bullet-zoom-outline-layer')).toBeNull();
		fixture.view.destroy();
	});

	it('keeps an already-open hover branch stable and its labels actionable', () => {
		const fixture = createFixture('- Parent\n  - Child\n    - Grandchild');
		const onFocus = vi.fn(() => true);
		openOutlineSwitcher(
			createOptions(fixture, fixture.view.state.doc.line(3).from + 4, {
				onFocus,
			}),
		);
		const dialogBefore = document.querySelector('.bullet-zoom-outline-desktop');
		const parentRow = document.querySelector<HTMLElement>('[data-anchor="0"]');
		parentRow?.dispatchEvent(new MouseEvent('pointerenter'));
		expect(document.querySelector('.bullet-zoom-outline-desktop')).toBe(
			dialogBefore,
		);
		parentRow
			?.querySelector<HTMLButtonElement>('.bullet-zoom-outline-label')
			?.click();
		expect(onFocus).toHaveBeenCalledWith(0);
		fixture.view.destroy();
	});

	it('repositions an open desktop dialog when its pane geometry changes', () => {
		const fixture = createFixture('- Parent');
		const originalResizeObserver = Object.getOwnPropertyDescriptor(
			window,
			'ResizeObserver',
		);
		const resizeHarness: {
			callback?: (entries: ResizeObserverEntry[]) => void;
		} = {};
		class TestResizeObserver {
			constructor(callback: ResizeObserverCallback) {
				resizeHarness.callback = (entries) => callback(entries, this);
			}
			observe(): void {}
			disconnect(): void {}
			unobserve(): void {}
		}
		Object.defineProperty(window, 'ResizeObserver', {
			configurable: true,
			value: TestResizeObserver,
		});
		let editorLeft = 20;
		vi.spyOn(fixture.trigger, 'getBoundingClientRect').mockImplementation(
			() =>
				({
					left: editorLeft + 20,
					right: editorLeft + 56,
					top: 20,
					bottom: 56,
					width: 36,
					height: 36,
					x: editorLeft + 20,
					y: 20,
					toJSON: () => ({}),
					}),
		);
		vi.spyOn(fixture.view.dom, 'getBoundingClientRect').mockImplementation(
			() =>
				({
					left: editorLeft,
					right: editorLeft + 500,
					top: 0,
					bottom: 500,
					width: 500,
					height: 500,
					x: editorLeft,
					y: 0,
					toJSON: () => ({}),
					}),
		);
		try {
			openOutlineSwitcher(createOptions(fixture, 0));
			const dialog = document.querySelector<HTMLElement>(
				'.bullet-zoom-outline-desktop',
			);
			expect(dialog?.style.left).toBe('20px');
			editorLeft = 120;
			resizeHarness.callback?.([]);
			expect(dialog?.style.left).toBe('120px');
		} finally {
			closeOutlineSwitcher(fixture.view);
			fixture.view.destroy();
			if (originalResizeObserver === undefined) {
				Reflect.deleteProperty(window, 'ResizeObserver');
			} else {
				Object.defineProperty(
					window,
					'ResizeObserver',
					originalResizeObserver,
				);
			}
		}
	});

	it('clamps a desktop cascade to a narrow editor pane and opens above when needed', () => {
		const fixture = createFixture('- Parent\n  - Child');
		vi.spyOn(fixture.trigger, 'getBoundingClientRect').mockReturnValue({
			left: 270,
			right: 306,
			top: 360,
			bottom: 396,
			width: 36,
			height: 36,
			x: 270,
			y: 360,
			toJSON: () => ({}),
		});
		vi.spyOn(fixture.view.dom, 'getBoundingClientRect').mockReturnValue({
			left: 120,
			right: 300,
			top: 100,
			bottom: 400,
			width: 180,
			height: 300,
			x: 120,
			y: 100,
			toJSON: () => ({}),
		});
		openOutlineSwitcher(
			createOptions(fixture, fixture.view.state.doc.line(2).from + 2),
		);
		const dialog = document.querySelector<HTMLElement>(
			'.bullet-zoom-outline-desktop',
		);
		expect(dialog?.style.left).toBe('120px');
		expect(dialog?.style.top).toBe('100px');
		expect(dialog?.style.minWidth).toBe('180px');
		expect(dialog?.style.maxWidth).toBe('180px');
		expect(dialog?.style.maxHeight).toBe('256px');
		closeOutlineSwitcher(fixture.view);
		fixture.view.destroy();
	});

	it('browses direct children separately and focuses a parent from its label', () => {
		const source = '- Parent A\n  - Child A\n- Parent B\n  - Child B';
		const fixture = createFixture(source);
		const parentBAnchor = fixture.view.state.doc.line(3).from;
		const onFocus = vi.fn(() => true);
		openOutlineSwitcher(
			createOptions(fixture, fixture.view.state.doc.line(2).from + 2, {
				onFocus,
			}),
		);

		const parentBChevron = document.querySelector<HTMLButtonElement>(
			`[data-anchor="${parentBAnchor}"] .bullet-zoom-outline-children`,
		);
		parentBChevron?.click();
		expect(onFocus).not.toHaveBeenCalled();
		expect(
			Array.from(
				document.querySelectorAll('.bullet-zoom-outline-column:last-child .bullet-zoom-outline-label'),
			).map((element) => element.textContent),
		).toEqual(['Child B']);

		document
			.querySelector<HTMLButtonElement>(
				`[data-anchor="${parentBAnchor}"] .bullet-zoom-outline-label`,
			)
			?.click();
		expect(onFocus).toHaveBeenCalledWith(parentBAnchor);
		expect(document.querySelector('.bullet-zoom-outline-layer')).toBeNull();
		fixture.view.destroy();
	});

	it('renders hostile-looking labels as text only', () => {
		const fixture = createFixture('- <img src=x onerror=alert(1)>');
		openOutlineSwitcher(createOptions(fixture, 0));
		const label = document.querySelector('.bullet-zoom-outline-label');
		expect(label?.textContent).toBe('<img src=x onerror=alert(1)>');
		expect(label?.querySelector('img')).toBeNull();
		closeOutlineSwitcher(fixture.view);
		fixture.view.destroy();
	});

	it('selects duplicate labels by their distinct document anchors and omits leaf chevrons', () => {
		const source = '- Idea\n- Idea\n- Leaf';
		const fixture = createFixture(source);
		const onFocus = vi.fn(() => true);
		openOutlineSwitcher(
			createOptions(fixture, fixture.view.state.doc.line(1).from, { onFocus }),
		);
		const labels = document.querySelectorAll<HTMLButtonElement>(
			'.bullet-zoom-outline-label',
		);
		expect(labels).toHaveLength(3);
		expect(
			document.querySelector('.bullet-zoom-outline-children'),
		).toBeNull();
		labels[1]?.click();
		expect(onFocus).toHaveBeenCalledWith(fixture.view.state.doc.line(2).from);
		fixture.view.destroy();
	});
});

describe('mobile outline switcher', () => {
	it('opens at the current sibling level and drills one level at a time', () => {
		const source = [
			'- Parent A',
			'  - Child A1',
			'  - Child A2',
			'    - Grandchild A2',
			'- Parent B',
		].join('\n');
		const fixture = createFixture(source);
		openOutlineSwitcher(
			createOptions(fixture, fixture.view.state.doc.line(3).from + 2, {
				isMobile: true,
			}),
		);

		expect(
			Array.from(document.querySelectorAll('.bullet-zoom-outline-mobile-list .bullet-zoom-outline-label')).map(
				(element) => element.textContent,
			),
		).toEqual(['Child A1', 'Child A2']);
		expect(document.querySelector('.is-current')?.textContent).toContain(
			'Child A2',
		);
		expect(
			document.querySelector('.bullet-zoom-outline-mobile')?.getAttribute(
				'aria-modal',
			),
		).toBe('true');

		document
			.querySelector<HTMLButtonElement>('.bullet-zoom-outline-back')
			?.click();
		expect(
			Array.from(document.querySelectorAll('.bullet-zoom-outline-mobile-list .bullet-zoom-outline-label')).map(
				(element) => element.textContent,
			),
		).toEqual(['Parent A', 'Parent B']);

		document
			.querySelector<HTMLButtonElement>(
				'[data-anchor="0"] .bullet-zoom-outline-children',
			)
			?.click();
		expect(
			Array.from(document.querySelectorAll('.bullet-zoom-outline-mobile-list .bullet-zoom-outline-label')).map(
				(element) => element.textContent,
			),
		).toEqual(['Child A1', 'Child A2']);
		closeOutlineSwitcher(fixture.view);
		fixture.view.destroy();
	});

	it('returns mobile focus to the parent row that was just left', () => {
		const source = '- Parent A\n  - Child A\n- Parent B\n  - Child B';
		const fixture = createFixture(source);
		openOutlineSwitcher(
			createOptions(fixture, fixture.view.state.doc.line(4).from + 2, {
				isMobile: true,
			}),
		);
		document
			.querySelector<HTMLButtonElement>('.bullet-zoom-outline-back')
			?.click();
		expect(document.activeElement).toBe(
			document.querySelector<HTMLButtonElement>(
				`[data-anchor="${fixture.view.state.doc.line(3).from}"] .bullet-zoom-outline-label`,
			),
		);
		closeOutlineSwitcher(fixture.view);
		fixture.view.destroy();
	});

	it('moves focus into the modal, traps Tab, and preserves focus after drilling', () => {
		const source = '- Parent\n  - Child\n    - Grandchild';
		const fixture = createFixture(source);
		openOutlineSwitcher(
			createOptions(fixture, fixture.view.state.doc.line(2).from + 2, {
				isMobile: true,
			}),
		);

		const current = document.querySelector<HTMLButtonElement>(
			'.bullet-zoom-outline-label[aria-current="location"]',
		);
		expect(document.activeElement).toBe(current);

		const controls = Array.from(
			document.querySelectorAll<HTMLButtonElement>(
				'.bullet-zoom-outline-mobile button',
			),
		);
		const first = controls[0];
		const last = controls.at(-1);
		last?.focus();
		document.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
		);
		expect(document.activeElement).toBe(first);

		first?.focus();
		document.dispatchEvent(
			new KeyboardEvent('keydown', {
				key: 'Tab',
				shiftKey: true,
				bubbles: true,
			}),
		);
		expect(document.activeElement).toBe(last);

		document
			.querySelector<HTMLButtonElement>('.bullet-zoom-outline-children')
			?.click();
		expect(document.activeElement).toBe(
			document.querySelector<HTMLButtonElement>(
				'.bullet-zoom-outline-mobile .bullet-zoom-outline-label',
			),
		);

		closeOutlineSwitcher(fixture.view);
		fixture.view.destroy();
	});

	it('tracks the iOS visual viewport while the software keyboard changes height', () => {
		const originalViewport = Object.getOwnPropertyDescriptor(
			window,
			'visualViewport',
		);
		const viewport = Object.assign(new EventTarget(), {
			height: 420,
			offsetTop: 18,
		});
		Object.defineProperty(window, 'visualViewport', {
			configurable: true,
			value: viewport,
		});
		const fixture = createFixture('- Parent');
		try {
			openOutlineSwitcher(
				createOptions(fixture, 0, { isMobile: true }),
			);
			const layer = document.querySelector<HTMLElement>(
				'.bullet-zoom-outline-layer',
			);
			expect(layer?.style.top).toBe('18px');
			expect(layer?.style.height).toBe('420px');
			viewport.height = 260;
			viewport.offsetTop = 42;
			viewport.dispatchEvent(new Event('resize'));
			expect(layer?.style.top).toBe('42px');
			expect(layer?.style.height).toBe('260px');
		} finally {
			closeOutlineSwitcher(fixture.view);
			fixture.view.destroy();
			if (originalViewport === undefined) {
				Reflect.deleteProperty(window, 'visualViewport');
			} else {
				Object.defineProperty(window, 'visualViewport', originalViewport);
			}
		}
	});
});

describe('outline switcher lifecycle', () => {
	it('restores trigger focus on Escape without dispatching navigation', () => {
		const fixture = createFixture('- Parent');
		const onFocus = vi.fn(() => true);
		const onExit = vi.fn(() => true);
		openOutlineSwitcher(createOptions(fixture, 0, { onFocus, onExit }));

		document.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
		);
		expect(document.querySelector('.bullet-zoom-outline-layer')).toBeNull();
		expect(document.activeElement).toBe(fixture.trigger);
		expect(onFocus).not.toHaveBeenCalled();
		expect(onExit).not.toHaveBeenCalled();
		fixture.view.destroy();
	});

	it('rejects stale document context before dispatching an anchor', () => {
		const fixture = createFixture('- Parent');
		let valid = true;
		const onFocus = vi.fn(() => true);
		openOutlineSwitcher(
			createOptions(fixture, 0, {
				isContextValid: () => valid,
				onFocus,
			}),
		);
		valid = false;
		document
			.querySelector<HTMLButtonElement>('.bullet-zoom-outline-label')
			?.click();
		expect(onFocus).not.toHaveBeenCalled();
		expect(document.querySelector('.bullet-zoom-outline-layer')).toBeNull();
		fixture.view.destroy();
	});

	it('rejects a changed file path even if a permissive callback stays true', () => {
		const fixture = createFixture('- Parent');
		let filePath = 'Ideas.md';
		const onFocus = vi.fn(() => true);
		openOutlineSwitcher(
			createOptions(fixture, 0, {
				getFilePath: () => filePath,
				onFocus,
			}),
		);
		filePath = 'Other.md';
		document
			.querySelector<HTMLButtonElement>('.bullet-zoom-outline-label')
			?.click();
		expect(onFocus).not.toHaveBeenCalled();
		expect(document.querySelector('.bullet-zoom-outline-layer')).toBeNull();
		fixture.view.destroy();
	});

	it('closes a desktop presentation after outside activation', () => {
		const fixture = createFixture('- Parent');
		openOutlineSwitcher(createOptions(fixture, 0));
		document.body.dispatchEvent(
			new MouseEvent('pointerdown', { bubbles: true }),
		);
		expect(document.querySelector('.bullet-zoom-outline-layer')).toBeNull();
		expect(document.activeElement).toBe(fixture.trigger);
		fixture.view.destroy();
	});

	it('toggles the same view closed on a second activation', () => {
		const fixture = createFixture('- Parent');
		openOutlineSwitcher(createOptions(fixture, 0));
		openOutlineSwitcher(createOptions(fixture, 0));
		expect(document.querySelector('.bullet-zoom-outline-layer')).toBeNull();
		expect(document.activeElement).toBe(fixture.trigger);
		fixture.view.destroy();
	});

	it('gives every mobile action a role-specific native-button name', () => {
		const fixture = createFixture('- Parent\n  - Child\n  - Leaf');
		openOutlineSwitcher(
			createOptions(fixture, fixture.view.state.doc.line(2).from + 2, {
				isMobile: true,
			}),
		);
		const dialog = document.querySelector('.bullet-zoom-outline-mobile');
		expect(dialog?.getAttribute('role')).toBe('dialog');
		expect(dialog?.getAttribute('aria-label')).toBe('切換 bullet');
		expect(dialog?.getAttribute('aria-modal')).toBe('true');
		expect(
			Array.from(dialog?.querySelectorAll('button') ?? []).map((button) =>
				button.getAttribute('aria-label'),
			),
		).toEqual([
			'回到上一層',
			'回到全文',
			'關閉 bullet 切換選單',
			'聚焦「Child」',
			'聚焦「Leaf」',
		]);
		document
			.querySelector<HTMLButtonElement>('.bullet-zoom-outline-back')
			?.click();
		expect(
			document
				.querySelector('.bullet-zoom-outline-children')
				?.getAttribute('aria-label'),
		).toBe('查看「Parent」的下一層');
		closeOutlineSwitcher(fixture.view);
		fixture.view.destroy();
	});

	it('keeps the presentation owned by its editor view', () => {
		const first = createFixture('- First');
		const second = createFixture('- Second');
		openOutlineSwitcher(createOptions(first, 0));
		expect(document.querySelectorAll('.bullet-zoom-outline-layer')).toHaveLength(
			1,
		);
		closeOutlineSwitcher(second.view);
		expect(document.querySelectorAll('.bullet-zoom-outline-layer')).toHaveLength(
			1,
		);
		closeOutlineSwitcher(first.view);
		expect(document.querySelector('.bullet-zoom-outline-layer')).toBeNull();
		first.view.destroy();
		second.view.destroy();
	});

	it('lets only the topmost pane handle each Escape or outside pointer event', () => {
		const first = createFixture('- First');
		const second = createFixture('- Second');
		openOutlineSwitcher(createOptions(first, 0));
		openOutlineSwitcher(createOptions(second, 0));

		document.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
		);
		expect(document.querySelectorAll('.bullet-zoom-outline-layer')).toHaveLength(
			1,
		);
		expect(document.activeElement).toBe(second.trigger);

		openOutlineSwitcher(createOptions(second, 0));
		first.parent.dispatchEvent(
			new MouseEvent('pointerdown', { bubbles: true }),
		);
		expect(document.querySelectorAll('.bullet-zoom-outline-layer')).toHaveLength(
			1,
		);
		expect(document.activeElement).toBe(second.trigger);

		document.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
		);
		expect(document.querySelector('.bullet-zoom-outline-layer')).toBeNull();
		expect(document.activeElement).toBe(first.trigger);

		first.view.destroy();
		second.view.destroy();
	});

	it('shows a non-actionable empty state', () => {
		const fixture = createFixture('Paragraph');
		openOutlineSwitcher(createOptions(fixture, 0));
		expect(document.querySelector('.bullet-zoom-outline-empty')?.textContent).toBe(
			'目前沒有可切換的 bullet',
		);
		expect(document.querySelector('.bullet-zoom-outline-label')).toBeNull();
		expect(document.querySelector('.bullet-zoom-outline-root')).toBeNull();
		closeOutlineSwitcher(fixture.view);
		fixture.view.destroy();
	});
});
