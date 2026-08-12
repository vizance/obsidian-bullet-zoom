import { markdown } from '@codemirror/lang-markdown';
import { EditorState } from '@codemirror/state';
import type { SyntaxNode } from '@lezer/common';
import { describe, expect, it } from 'vitest';

import {
	buildBreadcrumbs,
	buildBulletNavigationTree,
	computeBranchRange,
	findSupportedBullet,
	isSupportedBulletSyntaxNode,
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
});

describe('buildBulletNavigationTree', () => {
	it('builds immutable supported children in document order from a synthetic note root', () => {
		const state = createState(
			[
				'- Parent A',
				'  - Child A1',
				'      - Grandchild A1',
				'  - [ ] Ignored task',
				'  1. Ignored ordered item',
				'  - Child A2',
				'- Parent B',
				'- ',
			].join('\n'),
		);

		const tree = buildBulletNavigationTree(state, 'Ideas');

		expect(tree).toMatchObject({ label: 'Ideas', anchor: null });
		expect(tree.children.map(({ label }) => label)).toEqual([
			'Parent A',
			'Parent B',
			'（空白節點）',
		]);
		expect(tree.children[0]?.children.map(({ label }) => label)).toEqual([
			'Child A1',
			'Child A2',
		]);
		expect(tree.children[0]?.children[0]?.children).toEqual([
			{
				label: 'Grandchild A1',
				anchor: state.doc.line(3).from,
				children: [],
			},
		]);
		expect(Object.isFrozen(tree)).toBe(true);
		expect(Object.isFrozen(tree.children)).toBe(true);
		expect(Object.isFrozen(tree.children[0])).toBe(true);
	});

	it('uses editor columns so indentation gaps and tabs form the same hierarchy as breadcrumbs', () => {
		const state = createState(
			'- Parent\n\t- Tab child\n        - Deep child\n  - Space sibling\n- Other',
		);

		const tree = buildBulletNavigationTree(state, 'Ideas');

		expect(tree.children.map(({ label }) => label)).toEqual([
			'Parent',
			'Other',
		]);
		expect(tree.children[0]?.children.map(({ label }) => label)).toEqual([
			'Tab child',
			'Space sibling',
		]);
		expect(tree.children[0]?.children[0]?.children.map(({ label }) => label)).toEqual([
			'Deep child',
		]);
	});

	it('uses the note-title fallback and returns an empty immutable child list when no Bullet is supported', () => {
		const state = createState('Paragraph\n1. Ordered\n- [ ] Task');

		const tree = buildBulletNavigationTree(state, '');

		expect(tree).toEqual({
			label: '未命名筆記',
			anchor: null,
			children: [],
		});
		expect(Object.isFrozen(tree.children)).toBe(true);
	});
});
