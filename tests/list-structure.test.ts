import { markdown } from '@codemirror/lang-markdown';
import { EditorState } from '@codemirror/state';
import type { SyntaxNode } from '@lezer/common';
import { describe, expect, it } from 'vitest';

import {
	buildBulletOutline,
	buildHyperMdBulletOutline,
	buildBreadcrumbs,
	collectHyperMdAncestorBullets,
	computeBranchRange,
	findSupportedBullet,
	isSupportedBulletSyntaxNode,
	hyperMdListLevel,
} from '../src/list-structure';

function createState(document: string, tabSize = 4): EditorState {
	return EditorState.create({
		doc: document,
		extensions: [markdown(), EditorState.tabSize.of(tabSize)],
	});
}

describe('findSupportedBullet', () => {
	it('accepts the unordered-list syntax nodes emitted by Obsidian Live Preview', () => {
		const lineNode = {
			name: 'HyperMD-list-line_HyperMD-list-line-1',
			from: 0,
			to: 9,
			parent: null,
		} as unknown as SyntaxNode;
		const markerNode = {
			name: 'formatting_formatting-list_formatting-list-ul_list-1',
			from: 0,
			to: 2,
			parent: lineNode,
		} as unknown as SyntaxNode;

		expect(isSupportedBulletSyntaxNode(markerNode, 0, 1)).toBe(true);
		expect(
			isSupportedBulletSyntaxNode(
				{
					...markerNode,
					name: 'formatting_formatting-list_formatting-list-ol_list-1',
				},
				0,
				1,
			),
		).toBe(false);
		expect(
			isSupportedBulletSyntaxNode(
				{
					...markerNode,
					parent: {
						...lineNode,
						name: 'HyperMD-frontmatter',
					},
				},
				0,
				1,
			),
		).toBe(false);
	});

	it.each([
		['- Alpha', true],
		['* Beta', true],
		['+ Gamma', true],
		['1. Delta', false],
		['- [ ] Epsilon', false],
		['- [x] Zeta', false],
		['- [X] Eta', false],
	])('classifies %s as supported=%s', (source, supported) => {
		const state = createState(source);
		expect(findSupportedBullet(state, state.doc.length) !== null).toBe(
			supported,
		);
	});

	it('rejects list-like text inside fenced code', () => {
		const state = createState('```text\n- Not a list\n```');
		const position = state.doc.line(2).from;
		expect(findSupportedBullet(state, position)).toBeNull();
	});

	it('rejects a YAML sequence inside frontmatter', () => {
		const state = createState('---\n- Not a list\n---\n- Real list');
		expect(findSupportedBullet(state, state.doc.line(2).from)).toBeNull();
		expect(findSupportedBullet(state, state.doc.line(4).from)?.label).toBe(
			'Real list',
		);
	});

	it('measures tab and space indentation in editor columns', () => {
		const state = createState('- Parent\n\t- Tab child\n  - Space child');
		expect(findSupportedBullet(state, state.doc.line(2).from)?.indent).toBe(4);
		expect(findSupportedBullet(state, state.doc.line(3).from)?.indent).toBe(2);
	});

	it('returns marker, content, and line positions for any cursor on the line', () => {
		const state = createState('  - Alpha');
		const bullet = findSupportedBullet(state, state.doc.length);
		expect(bullet).toMatchObject({
			lineNumber: 1,
			lineFrom: 0,
			lineTo: 9,
			markerFrom: 2,
			markerTo: 3,
			contentFrom: 4,
		indent: 2,
			label: 'Alpha',
		});
	});
});

describe('computeBranchRange', () => {
	it('returns the focused item, descendants, and indented continuation lines', () => {
		const state = createState(
			'- Parent\n  - Child A\n    - Grandchild\n      Detail\n  - Child B\nAfter list',
		);
		const target = state.doc.line(2);
		const range = computeBranchRange(state, target.from);
		expect(range).not.toBeNull();
		expect(state.sliceDoc(range?.from, range?.to)).toBe(
			'  - Child A\n    - Grandchild\n      Detail',
		);
	});

	it('keeps internal blank lines before deeper content', () => {
		const state = createState('- Parent\n  - Child\n\n    Detail\n- Sibling');
		const range = computeBranchRange(state, state.doc.line(2).from);
		expect(state.sliceDoc(range?.from, range?.to)).toBe(
			'  - Child\n\n    Detail',
		);
	});

	it('excludes trailing blank lines before a same-indent sibling', () => {
		const state = createState('- Parent\n  - Child A\n    Detail\n\n\n  - Child B');
		const range = computeBranchRange(state, state.doc.line(2).from);
		expect(state.sliceDoc(range?.from, range?.to)).toBe(
			'  - Child A\n    Detail',
		);
	});

	it('recomputes after indenting a former sibling into the branch', () => {
		const state = createState('- Parent\n  - Child A\n  - Child B');
		const before = computeBranchRange(state, state.doc.line(2).from);
		expect(state.sliceDoc(before?.from, before?.to)).toBe('  - Child A');

		const nextState = state.update({
			changes: {
				from: state.doc.line(3).from,
				insert: '  ',
			},
		}).state;
		const after = computeBranchRange(nextState, nextState.doc.line(2).from);
		expect(nextState.sliceDoc(after?.from, after?.to)).toBe(
			'  - Child A\n    - Child B',
		);
	});

	it('returns null outside a supported bullet', () => {
		const state = createState('Paragraph');
		expect(computeBranchRange(state, 0)).toBeNull();
	});

	it('keeps lazy continuation text and nested bullets in the syntax-owned branch', () => {
		const state = createState('- Parent\ncontinuation\n  - Child');
		const range = computeBranchRange(state, 0);
		expect(state.sliceDoc(range?.from, range?.to)).toBe(
			'- Parent\ncontinuation\n  - Child',
		);
	});
});

describe('buildBreadcrumbs', () => {
	it('orders the note, skipped indentation ancestors, and current item', () => {
		const state = createState(
			'- Parent\n   - Child\n      - Grandchild\n- Other',
		);
		const breadcrumbs = buildBreadcrumbs(
			state,
			state.doc.line(3).from,
			'Ideas',
		);
		expect(breadcrumbs?.map(({ label }) => label)).toEqual([
			'Ideas',
			'Parent',
			'Child',
			'Grandchild',
		]);
		expect(breadcrumbs?.map(({ anchor }) => anchor)).toEqual([
			null,
			state.doc.line(1).from,
			state.doc.line(2).from,
			state.doc.line(3).from,
		]);
	});

	it('uses the empty-item fallback label', () => {
		const state = createState('- Parent\n  - \n    - Target');
		const breadcrumbs = buildBreadcrumbs(
			state,
			state.doc.line(3).from,
			'Ideas',
		);
		expect(breadcrumbs?.map(({ label }) => label)).toEqual([
			'Ideas',
			'Parent',
			'（空白節點）',
			'Target',
		]);
	});

	it('contains only the note and item for a root bullet', () => {
		const state = createState('- Root');
		expect(buildBreadcrumbs(state, 0, 'Ideas')).toEqual([
			{ label: 'Ideas', anchor: null },
			{ label: 'Root', anchor: 0 },
		]);
	});

	it('uses a fallback for an empty note title', () => {
		const state = createState('- Root');
		expect(buildBreadcrumbs(state, 0, '')?.[0]?.label).toBe('未命名筆記');
	});

	it('does not cache a target-limited syntax tree as the complete document tree', () => {
		const state = createState(
			Array.from({ length: 3_000 }, (_, index) => `- Item ${index}`).join('\n'),
		);
		expect(buildBreadcrumbs(state, 0, 'Ideas')?.at(-1)?.label).toBe('Item 0');
		expect(buildBulletOutline(state)).toHaveLength(3_000);
		expect(findSupportedBullet(state, state.doc.line(3_000).from)?.label).toBe(
			'Item 2999',
		);
	});
});

describe('buildBulletOutline', () => {
	it('builds direct children, grandchildren, siblings, and multiple roots', () => {
		const state = createState(
			'- Parent\n  - Child\n    - Grandchild\n  - Sibling\n- Second root',
		);

		const outline = buildBulletOutline(state);
		expect(outline).toEqual([
			{
				label: 'Parent',
				anchor: state.doc.line(1).from,
				children: [
					{
						label: 'Child',
						anchor: state.doc.line(2).from + 2,
						children: [
							{
								label: 'Grandchild',
								anchor: state.doc.line(3).from + 4,
								children: [],
							},
						],
					},
					{
						label: 'Sibling',
						anchor: state.doc.line(4).from + 2,
						children: [],
					},
				],
			},
			{
				label: 'Second root',
				anchor: state.doc.line(5).from,
				children: [],
			},
		]);
		expect(Object.isFrozen(outline)).toBe(true);
		expect(Object.isFrozen(outline[0])).toBe(true);
		expect(Object.isFrozen(outline[0]?.children)).toBe(true);
	});

	it('derives the whole document independently of folds and visible ranges', () => {
		const source = [
			'- Visible root',
			'  - Folded child',
			'    - Folded grandchild',
			'- Offscreen root',
		].join('\n');
		const state = createState(source);

		expect(buildBulletOutline(state).map(({ label }) => label)).toEqual([
			'Visible root',
			'Offscreen root',
		]);
		expect(
			buildBulletOutline(state)[0]?.children[0]?.children[0]?.label,
		).toBe('Folded grandchild');
	});

	it('forces the syntax tree far beyond the initial parse window before returning', () => {
		const state = createState(
			Array.from({ length: 1_000 }, (_, index) => `- Item ${index}`).join('\n'),
		);
		const outline = buildBulletOutline(state);
		expect(outline).toHaveLength(1_000);
		expect(outline.at(-1)?.label).toBe('Item 999');
	});

	it('keeps duplicate and empty labels independently addressable by marker anchor', () => {
		const state = createState('- Idea\n- Idea\n- ');
		const outline = buildBulletOutline(state);

		expect(outline.map(({ label }) => label)).toEqual([
			'Idea',
			'Idea',
			'（空白節點）',
		]);
		expect(outline.map(({ anchor }) => anchor)).toEqual([
			state.doc.line(1).from,
			state.doc.line(2).from,
			state.doc.line(3).from,
		]);
	});

	it('excludes unsupported structures, continuation text, and linked-file content', () => {
		const source = [
			'---',
			'- Frontmatter sequence',
			'---',
			'# Heading',
			'1. Numbered',
			'- [ ] Task',
			'- Plain bullet with [[Other note]]',
			'  continuation text',
			'```md',
			'- Fenced bullet',
			'```',
		].join('\n');

		expect(buildBulletOutline(createState(source))).toEqual([
			{
				label: 'Plain bullet with [[Other note]]',
				anchor: createState(source).doc.line(7).from,
				children: [],
			},
		]);
	});

	it('treats an indented item without an open supported ancestor as a root', () => {
		const state = createState('  - Indented root');
		expect(buildBulletOutline(state)).toEqual([
			{
				label: 'Indented root',
				anchor: 2,
				children: [],
			},
		]);
	});

	it.each([
		['a heading', '- Parent\n# Heading\n  - Child'],
		['a task item', '- Parent\n- [ ] Task\n  - Child'],
		['a separate paragraph', '- Parent\n\nParagraph\n\n  - Child'],
	])('does not keep a parent open across %s', (_name, source) => {
		const state = createState(source);
		expect(buildBulletOutline(state).map(({ label }) => label)).toEqual([
			'Parent',
			'Child',
		]);
	});

	it('keeps a child under its parent across a lazy continuation paragraph', () => {
		const state = createState('- Parent\ncontinuation\n  - Child');
		const outline = buildBulletOutline(state);
		expect(outline.map(({ label }) => label)).toEqual(['Parent']);
		expect(outline[0]?.children.map(({ label }) => label)).toEqual(['Child']);
		expect(
			buildBreadcrumbs(state, state.doc.line(3).from, 'Ideas')?.map(
				({ label }) => label,
			),
		).toEqual(['Ideas', 'Parent', 'Child']);
	});

	it.each([
		['- Parent\n - Child', ['Parent', 'Child']],
		['-   Parent\n   - Child', ['Parent', 'Child']],
		['-   Parent\n    - Child', ['Parent']],
	])(
		'uses the CommonMark content column for structural ancestry in %s',
		(source, expectedRoots) => {
			const state = createState(source);
			const outline = buildBulletOutline(state);
			expect(outline.map(({ label }) => label)).toEqual(expectedRoots);
			if (expectedRoots.length === 1) {
				expect(outline[0]?.children.map(({ label }) => label)).toEqual([
					'Child',
				]);
			}
		},
	);

	it('uses the same content-column ancestry for breadcrumbs', () => {
		const siblingState = createState('- Parent\n - Child');
		expect(
			buildBreadcrumbs(siblingState, siblingState.doc.line(2).from, 'Ideas')?.map(
				({ label }) => label,
			),
		).toEqual(['Ideas', 'Child']);
		const childState = createState('-   Parent\n    - Child');
		expect(
			buildBreadcrumbs(childState, childState.doc.line(2).from, 'Ideas')?.map(
				({ label }) => label,
			),
		).toEqual(['Ideas', 'Parent', 'Child']);
		const separatedState = createState('- Parent\n\nParagraph\n\n  - Child');
		expect(
			buildBreadcrumbs(
				separatedState,
				separatedState.doc.line(5).from,
				'Ideas',
			)?.map(({ label }) => label),
		).toEqual(['Ideas', 'Child']);
	});

	it('handles large unclosed frontmatter without repeatedly rescanning it', () => {
		const source = ['---', ...Array.from({ length: 3_000 }, () => '- Hidden')].join(
			'\n',
		);
		expect(buildBulletOutline(createState(source))).toEqual([]);
	});

	it('derives HyperMD ancestry without crossing structural interruptions', () => {
		const parent = findSupportedBullet(createState('- Parent'), 0);
		expect(parent).not.toBeNull();
		if (parent === null) {
			return;
		}
		const continuation = {
			level: 1,
			bullet: null,
			hasListMarker: false,
			nonBlank: true,
		};
		const parentEntry = {
			level: 1,
			bullet: parent,
			hasListMarker: true,
			nonBlank: true,
		};
		expect(
			collectHyperMdAncestorBullets([continuation, parentEntry], 2),
		).toEqual([parent]);
		expect(
			collectHyperMdAncestorBullets(
				[
					{
						level: null,
						bullet: null,
						hasListMarker: false,
						nonBlank: true,
					},
					parentEntry,
				],
				2,
			),
		).toEqual([]);
		expect(
			collectHyperMdAncestorBullets(
				[
					{
						level: 1,
						bullet: null,
						hasListMarker: true,
						nonBlank: true,
					},
					parentEntry,
				],
				2,
			),
		).toEqual([]);
		expect(
			collectHyperMdAncestorBullets(
				[
					{
						level: 2,
						bullet: null,
						hasListMarker: true,
						nonBlank: true,
					},
					parentEntry,
				],
				3,
			),
		).toEqual([]);
	});

	it('reads the list depth from Obsidian HyperMD line tokens', () => {
		const lineNode = {
			name: 'HyperMD-list-line_HyperMD-list-line-3',
			parent: null,
		} as unknown as SyntaxNode;
		const markerNode = {
			name: 'formatting_formatting-list_formatting-list-ul_list-3',
			parent: lineNode,
		} as unknown as SyntaxNode;
		expect(hyperMdListLevel(markerNode)).toBe(3);
	});

	it('builds HyperMD hierarchy in one forward pass across continuation and boundaries', () => {
		const state = createState(
			'- Parent\ncontinuation\n  - Child\n# Heading\n- [ ] Task\n  - Root child',
		);
		const parent = findSupportedBullet(state, state.doc.line(1).from);
		const child = findSupportedBullet(state, state.doc.line(3).from);
		const rootChild = findSupportedBullet(state, state.doc.line(6).from);
		expect(parent).not.toBeNull();
		expect(child).not.toBeNull();
		expect(rootChild).not.toBeNull();
		if (parent === null || child === null || rootChild === null) {
			return;
		}
		const outline = buildHyperMdBulletOutline([
			{ level: 1, bullet: parent, hasListMarker: true, nonBlank: true },
			{ level: 1, bullet: null, hasListMarker: false, nonBlank: true },
			{ level: 2, bullet: child, hasListMarker: true, nonBlank: true },
			{ level: null, bullet: null, hasListMarker: false, nonBlank: true },
			{ level: 1, bullet: null, hasListMarker: true, nonBlank: true },
			{ level: 2, bullet: rootChild, hasListMarker: true, nonBlank: true },
		]);
		expect(outline.map(({ label }) => label)).toEqual(['Parent', 'Root child']);
		expect(outline[0]?.children.map(({ label }) => label)).toEqual(['Child']);
	});

	it('keeps a large flat HyperMD outline linear and complete', () => {
		const source = Array.from({ length: 2_000 }, (_, index) => `- Item ${index}`).join(
			'\n',
		);
		const state = createState(source);
		expect(buildBulletOutline(state)).toHaveLength(2_000);
		const entries = Array.from({ length: 2_000 }, (_, index) => {
			const bullet = findSupportedBullet(state, state.doc.line(index + 1).from);
			expect(bullet).not.toBeNull();
			return {
				level: 1,
				bullet,
				hasListMarker: true,
				nonBlank: true,
			};
		});
		expect(buildHyperMdBulletOutline(entries)).toHaveLength(2_000);
	});
});
