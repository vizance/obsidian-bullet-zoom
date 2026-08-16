import { markdown } from '@codemirror/lang-markdown';
import { indentUnit } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import type { SyntaxNode } from '@lezer/common';
import { describe, expect, it } from 'vitest';

import {
	buildBulletOutline,
	buildOutlineHeadings,
	markerDetectionFacet,
	planBranchMove,
	planBulletExtract,
	suggestExtractFileName,
	buildHyperMdBulletOutline,
	buildBreadcrumbs,
	BulletOutlineLimitError,
	collectHyperMdAncestorBullets,
	computeBranchRange,
	findSupportedBullet,
	isSupportedBulletSyntaxNode,
	hyperMdListLevel,
	planAppendChildInsertion,
	planHyperMdAppendChildInsertion,
} from '../src/list-structure';

function createState(
	document: string,
	tabSize = 4,
	configuredIndent = '  ',
): EditorState {
	return EditorState.create({
		doc: document,
		extensions: [
			markdown(),
			EditorState.tabSize.of(tabSize),
			indentUnit.of(configuredIndent),
		],
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

describe('outlinePlainTextLabel', () => {
	it('keeps semantic text while removing supported inline Markdown marks', () => {
		const source =
			'- **粗體** *斜體* ~~刪除~~ `程式碼` [連結文字](https://example.com "標題") ![圖片說明](image.png) [[目標筆記|顯示名稱]] \\*星號';
		const state = createState(source);
		expect(buildBulletOutline(state)[0]?.label).toBe(
			'粗體 斜體 刪除 程式碼 連結文字 圖片說明 顯示名稱 *星號',
		);
	});

	it('uses the wiki-link target when no alias is present', () => {
		const state = createState('- 參考 [[Reference Note]]');
		expect(buildBulletOutline(state)[0]?.label).toBe(
			'參考 Reference Note',
		);
	});

	it('preserves intentional spaces inside inline code', () => {
		const state = createState('- 執行 `npm  test`');
		expect(buildBulletOutline(state)[0]?.label).toBe('執行 npm  test');
	});

	it('uses the empty fallback when formatting has no visible content', () => {
		const state = createState('- [ ](https://example.com)');
		expect(buildBulletOutline(state)[0]?.label).toBe('Untitled bullet');
	});

	it('keeps duplicate plain labels independently addressable by anchor', () => {
		const state = createState('- **Same**\n- Same');
		const outline = buildBulletOutline(state);
		expect(outline.map(({ label }) => label)).toEqual(['Same', 'Same']);
		expect(outline.map(({ anchor }) => anchor)).toEqual([
			state.doc.line(1).from,
			state.doc.line(2).from,
		]);
	});

	it('uses the same semantic plain text for breadcrumbs', () => {
		const source =
			'- **粗體** *斜體* ~~刪除~~ `程式碼` [連結](https://example.com) ![圖片](image.png) [[目標|別名]]';
		const state = createState(source);
		expect(buildBreadcrumbs(state, 0, 'Ideas')?.map(({ label }) => label)).toEqual([
			'Ideas',
			'粗體 斜體 刪除 程式碼 連結 圖片 別名',
		]);
	});

	it('removes balanced HyperMD formatting fallback marks without stripping literal punctuation', () => {
		const state = createState(
			'- **粗體含 *斜體*** ~~刪除~~ `程式碼` [連結](https://example.com/a_(b)) ![圖片](image.png) ![[附件|別名]] \\*星號 2 * 3 unmatched **',
		);
		const bullet = findSupportedBullet(state, 0);
		expect(bullet).not.toBeNull();
		if (bullet === null) {
			return;
		}
		const outline = buildHyperMdBulletOutline([
			{ level: 1, bullet, hasListMarker: true, nonBlank: true },
		]);
		expect(outline[0]?.label).toBe(
			'粗體含 斜體 刪除 程式碼 連結 圖片 別名 *星號 2 * 3 unmatched **',
		);
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

describe('planAppendChildInsertion', () => {
	it.each([
		{
			name: 'dash marker',
			source: '- Parent\n  - Child A\n    - Grandchild\n  - Child B',
			expected: '- Parent\n  - Child A\n    - Grandchild\n  - Child B\n  - ',
		},
		{
			name: 'wide marker spacing',
			source: '-   Parent\n    - Child',
			expected: '-   Parent\n    - Child\n    - ',
		},
		{
			name: 'plus marker',
			source: '+ Parent\n  + Child',
			expected: '+ Parent\n  + Child\n  - ',
		},
	])('appends a direct child after existing descendants for $name', ({ source, expected }) => {
		const state = createState(source);
		const plan = planAppendChildInsertion(state, 0);
		expect(plan.status).toBe('ready');
		if (plan.status !== 'ready') {
			return;
		}
		const next = state.update({
			changes: { from: plan.insertAt, insert: plan.insertText },
			selection: { anchor: plan.cursorAt },
		}).state;
		expect(next.doc.toString()).toBe(expected);
		expect(next.selection.main.empty).toBe(true);
		expect(next.selection.main.head).toBe(plan.cursorAt);
	});

	it('uses one configured four-space indentation unit below a root marker', () => {
		const state = createState('- Fundraising video', 4, '    ');
		const plan = planAppendChildInsertion(state, 0);
		expect(plan).toEqual({
			status: 'ready',
			insertAt: state.doc.length,
			insertText: '\n    - ',
			cursorAt: state.doc.length + 7,
		});
		if (plan.status !== 'ready') {
			return;
		}
		const next = state.update({
			changes: { from: plan.insertAt, insert: plan.insertText },
		}).state;
		expect(findSupportedBullet(next, next.doc.line(2).from)?.indent).toBe(4);
		expect(
			buildBreadcrumbs(next, next.doc.line(2).from, 'Ideas')?.map(
				({ label }) => label,
			),
		).toEqual(['Ideas', 'Fundraising video', 'Untitled bullet']);
	});

	it('uses one configured tab indentation unit below a nested marker', () => {
		const state = createState('- Parent\n\t- Child', 4, '\t');
		const target = state.doc.line(2);
		const plan = planAppendChildInsertion(state, target.from);
		expect(plan.status).toBe('ready');
		if (plan.status !== 'ready') {
			return;
		}
		expect(plan.insertText).toBe('\n\t\t- ');
		const next = state.update({
			changes: { from: plan.insertAt, insert: plan.insertText },
		}).state;
		expect(findSupportedBullet(next, next.doc.line(3).from)?.indent).toBe(8);
		expect(
			buildBreadcrumbs(next, next.doc.line(3).from, 'Ideas')?.map(
				({ label }) => label,
			),
		).toEqual(['Ideas', 'Parent', 'Child', 'Untitled bullet']);
	});

	it.each([
		'- Parent',
		'- Parent\n  continuation',
		'- Parent\ncontinuation',
	])('inserts after syntax-owned parent content in %s', (source) => {
		const state = createState(source);
		const plan = planAppendChildInsertion(state, 0);
		expect(plan.status).toBe('ready');
		if (plan.status !== 'ready') {
			return;
		}
		const next = state.update({
			changes: { from: plan.insertAt, insert: plan.insertText },
		}).state;
		expect(next.doc.toString()).toBe(`${source}\n  - `);
	});

	it('appends after an unsupported direct list child', () => {
		const source = '- Parent\n  - [ ] Task\n  - Child';
		const state = createState(source);
		const plan = planAppendChildInsertion(state, 0);
		expect(plan.status).toBe('ready');
		if (plan.status !== 'ready') {
			return;
		}
		expect(
			state.update({
				changes: { from: plan.insertAt, insert: plan.insertText },
			}).state.doc.toString(),
		).toBe('- Parent\n  - [ ] Task\n  - Child\n  - ');
	});

	it('fails closed outside a supported Bullet', () => {
		const state = createState('Paragraph');
		expect(planAppendChildInsertion(state, 0)).toEqual({
			status: 'unsafe',
			reason: 'unsupported-target',
		});
	});

	it('plans a HyperMD child after the complete descendant branch', () => {
		const state = createState('- Parent\n  - Child');
		const target = findSupportedBullet(state, 0);
		expect(target).not.toBeNull();
		if (target === null) {
			return;
		}
		expect(
			planHyperMdAppendChildInsertion(
				target,
				1,
				[
					{
						lineFrom: state.doc.line(2).from,
						lineTo: state.doc.line(2).to,
						level: 2,
						hasListMarker: true,
						nonBlank: true,
					},
				],
				'  ',
			),
		).toEqual({
			status: 'ready',
			insertAt: state.doc.line(2).to,
			insertText: '\n  - ',
			cursorAt: state.doc.line(2).to + 5,
		});
	});

	it('fails closed for a HyperMD level gap before a direct child', () => {
		const state = createState('- Parent\n    - Too deep');
		const target = findSupportedBullet(state, 0);
		expect(target).not.toBeNull();
		if (target === null) {
			return;
		}
		expect(
			planHyperMdAppendChildInsertion(
				target,
				1,
				[
					{
						lineFrom: state.doc.line(2).from,
						lineTo: state.doc.line(2).to,
						level: 3,
						hasListMarker: true,
						nonBlank: true,
					},
				],
				'  ',
			),
		).toEqual({ status: 'unsafe', reason: 'unsafe-boundary' });
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
			'Untitled bullet',
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
		expect(buildBreadcrumbs(state, 0, '')?.[0]?.label).toBe('Untitled note');
	});

	it('does not cache a target-limited syntax tree as the complete document tree', () => {
		const state = createState(
			Array.from({ length: 900 }, (_, index) => `- Item ${index}`).join('\n'),
		);
		expect(buildBreadcrumbs(state, 0, 'Ideas')?.at(-1)?.label).toBe('Item 0');
		expect(buildBulletOutline(state)).toHaveLength(900);
		expect(findSupportedBullet(state, state.doc.line(900).from)?.label).toBe(
			'Item 899',
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
			'Untitled bullet',
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
				label: 'Plain bullet with Other note',
				anchor: createState(source).doc.line(7).from,
				children: [],
			},
		]);
	});

	it('excludes unordered bullets nested under ordered lists', () => {
		const source = [
			'1. Ordered parent',
			'   - Misleading child',
			'- Root bullet',
			'  - Root child',
		].join('\n');
		const state = createState(source);
		expect(findSupportedBullet(state, state.doc.line(2).from)).toBeNull();
		const outline = buildBulletOutline(state);

		expect(outline.map(({ label }) => label)).toEqual(['Root bullet']);
		expect(outline[0]?.children.map(({ label }) => label)).toEqual([
			'Root child',
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

	it('excludes HyperMD unordered bullets nested under ordered lists', () => {
		const state = createState('- Placeholder');
		const bullet = findSupportedBullet(state, state.doc.line(1).from);
		expect(bullet).not.toBeNull();
		if (bullet === null) {
			return;
		}
		const makeBullet = (label: string, markerFrom: number) =>
			Object.freeze({ ...bullet, label, markerFrom, lineFrom: markerFrom });

		const outline = buildHyperMdBulletOutline([
			{
				level: 1,
				bullet: null,
				hasListMarker: true,
				isOrdered: true,
				nonBlank: true,
			},
			{
				level: 2,
				bullet: makeBullet('Misleading child', 10),
				hasListMarker: true,
				nonBlank: true,
			},
			{
				level: 1,
				bullet: makeBullet('Root bullet', 20),
				hasListMarker: true,
				nonBlank: true,
			},
			{
				level: 2,
				bullet: makeBullet('Root child', 30),
				hasListMarker: true,
				nonBlank: true,
			},
		]);

		expect(outline.map(({ label }) => label)).toEqual(['Root bullet']);
		expect(outline[0]?.children.map(({ label }) => label)).toEqual([
			'Root child',
		]);
	});

	it('keeps a large flat HyperMD outline linear and complete', () => {
		const source = Array.from({ length: 1_000 }, (_, index) => `- Item ${index}`).join(
			'\n',
		);
		const state = createState(source);
		expect(buildBulletOutline(state)).toHaveLength(1_000);
		const entries = Array.from({ length: 1_000 }, (_, index) => {
			const bullet = findSupportedBullet(state, state.doc.line(index + 1).from);
			expect(bullet).not.toBeNull();
			return {
				level: 1,
				bullet,
				hasListMarker: true,
				nonBlank: true,
			};
		});
		expect(buildHyperMdBulletOutline(entries)).toHaveLength(1_000);
	});

	it('builds a deeply nested standard outline in one bounded tree walk', () => {
		const source = Array.from(
			{ length: 100 },
			(_, index) => `${'  '.repeat(index)}- Level ${index + 1}`,
		).join('\n');
		const outline = buildBulletOutline(createState(source));
		let nodes = outline;
		let depth = 0;
		while (nodes.length > 0) {
			depth += 1;
			nodes = nodes[0]?.children ?? [];
		}
		expect(depth).toBe(100);
	});

	it('fails closed before an outline can exceed the nesting budget', () => {
		const bullet = findSupportedBullet(createState('- Item'), 0);
		expect(bullet).not.toBeNull();
		if (bullet === null) {
			return;
		}
		const entries = Array.from({ length: 129 }, (_, index) => ({
			level: index + 1,
			bullet: Object.freeze({ ...bullet, markerFrom: index, lineFrom: index }),
			hasListMarker: true,
			nonBlank: true,
		}));
		expect(() => buildHyperMdBulletOutline(entries)).toThrow(
			BulletOutlineLimitError,
		);
		const unsupportedEntries = [
			{
				level: 1,
				bullet,
				hasListMarker: true,
				nonBlank: true,
			},
			...Array.from({ length: 128 }, (_, index) => ({
				level: index + 2,
				bullet: null,
				hasListMarker: true,
				nonBlank: true,
			})),
		];
		expect(() => buildHyperMdBulletOutline(unsupportedEntries)).toThrow(
			BulletOutlineLimitError,
		);
		const unsupportedStandardSource = [
			'- Valid',
			...Array.from({ length: 5_000 }, (_, index) => `- [ ] Task ${index}`),
		].join('\n');
		expect(() =>
			buildBulletOutline(createState(unsupportedStandardSource)),
		).toThrow(BulletOutlineLimitError);
		const excessiveSupportedSource = Array.from(
			{ length: 1_001 },
			(_, index) => `- Item ${index}`,
		).join('\n');
		expect(() =>
			buildBulletOutline(createState(excessiveSupportedSource)),
		).toThrow(BulletOutlineLimitError);
	});
});

describe('buildOutlineHeadings', () => {
	function stateOf(document: string): EditorState {
		return EditorState.create({ doc: document, extensions: [markdown()] });
	}

	it('collects ATX headings with level, label, and position', () => {
		const state = stateOf('# Raw Ideas\n- A\n## Outline\n- B');
		const headings = buildOutlineHeadings(state);
		expect(headings).toHaveLength(2);
		expect(headings[0]).toMatchObject({ level: 1, label: 'Raw Ideas', from: 0 });
		expect(headings[1]?.level).toBe(2);
		expect(headings[1]?.label).toBe('Outline');
	});

	it('returns an empty list for notes without headings', () => {
		expect(buildOutlineHeadings(stateOf('- A\n- B'))).toHaveLength(0);
	});

	it('ignores hash lines inside frontmatter and fenced code blocks', () => {
		const state = stateOf(
			'---\n# not: heading\n---\n- A\n```\n# not a heading\n```\n# Real\n- B',
		);
		const headings = buildOutlineHeadings(state);
		expect(headings).toHaveLength(1);
		expect(headings[0]?.label).toBe('Real');
	});
});

describe('marker detection (0.1.42)', () => {
	function stateWith(
		document: string,
		bullets: boolean,
		numbered: boolean,
	): EditorState {
		return EditorState.create({
			doc: document,
			extensions: [
				markdown(),
				markerDetectionFacet.of({ bullets, numbered }),
			],
		});
	}

	it('resolves an ordered item when numbered detection is enabled', () => {
		const state = stateWith('1. First\n2. Second', true, true);
		const line2 = state.doc.line(2);
		const bullet = findSupportedBullet(state, line2.from);
		expect(bullet).not.toBeNull();
		expect(bullet?.markerFrom).toBe(line2.from);
		expect(bullet?.markerTo).toBe(line2.from + 2);
		expect(bullet?.label).toBe('Second');
	});

	it('ignores plain bullets when bullets detection is disabled', () => {
		const state = stateWith('- A\n1. B', false, true);
		expect(findSupportedBullet(state, state.doc.line(1).from)).toBeNull();
		const ordered = findSupportedBullet(state, state.doc.line(2).from);
		expect(ordered?.label).toBe('B');
	});

	it('keeps the legacy ordered exclusion when numbered detection is disabled', () => {
		const state = stateWith('1. First\n   - Nested', true, false);
		expect(findSupportedBullet(state, state.doc.line(1).from)).toBeNull();
		expect(findSupportedBullet(state, state.doc.line(2).from)).toBeNull();
	});

	it('includes ordered items in the outline when numbered detection is enabled', () => {
		const state = stateWith('1. First\n2. Second\n- C', true, true);
		const outline = buildBulletOutline(state);
		expect(outline.map((node) => node.label)).toEqual([
			'First',
			'Second',
			'C',
		]);
	});
});

describe('planBranchMove (0.1.43)', () => {
	function stateOf(document: string): EditorState {
		return EditorState.create({ doc: document, extensions: [markdown()] });
	}

	function apply(
		document: string,
		sourceLine: number,
		targetLine: number,
		placement: 'before' | 'after',
	): string | null {
		const state = stateOf(document);
		const source = state.doc.line(sourceLine);
		const target = state.doc.line(targetLine);
		const changes = planBranchMove(
			state,
			source.from,
			target.from,
			placement,
		);
		if (changes === null) {
			return null;
		}
		return state.update({ changes: [...changes] }).state.doc.toString();
	}

	it('moves a branch after a target sibling', () => {
		expect(apply('- A\n  - A1\n- B\n- C', 1, 4, 'after')).toBe(
			'- B\n- C\n- A\n  - A1',
		);
	});

	it('reindents a branch dropped before a nested target', () => {
		expect(apply('- A\n  - A1\n- B\n  - B1', 1, 4, 'before')).toBe(
			'- B\n  - A\n    - A1\n  - B1',
		);
	});

	it('rejects dropping into the dragged subtree', () => {
		expect(apply('- A\n  - A1\n- B', 1, 2, 'after')).toBeNull();
		expect(apply('- A\n  - A1\n- B', 1, 1, 'before')).toBeNull();
	});

	it('handles a document without a trailing newline when moving the last branch', () => {
		expect(apply('- A\n- B\n  - B1', 2, 1, 'before')).toBe(
			'- B\n  - B1\n- A',
		);
	});
});

describe('planBulletExtract (0.1.44)', () => {
	function stateOf(document: string): EditorState {
		return EditorState.create({ doc: document, extensions: [markdown()] });
	}

	function extract(
		document: string,
		line: number,
		removeTop: boolean,
	): { content: string; source: string } | null {
		const state = stateOf(document);
		const anchorLine = state.doc.line(line);
		const plan = planBulletExtract(state, anchorLine.from, removeTop);
		if (plan === null) {
			return null;
		}
		const source = state.update({
			changes: {
				from: plan.replaceFrom,
				to: plan.replaceTo,
				insert: `${plan.linkIndentText}- [[N]]`,
			},
		}).state.doc.toString();
		return { content: plan.fileContent, source };
	}

	it('drops the top bullet and dedents children by default', () => {
		const result = extract('- Topic\n  - P1\n    - P1a\n  - P2', 1, true);
		expect(result?.content).toBe('- P1\n  - P1a\n- P2');
		expect(result?.source).toBe('- [[N]]');
	});

	it('keeps the whole branch rebased to zero indent when configured', () => {
		const result = extract('- A\n  - Topic\n    - P1', 2, false);
		expect(result?.content).toBe('- Topic\n  - P1');
		expect(result?.source).toBe('- A\n  - [[N]]');
	});

	it('extracts the label text for a leaf bullet', () => {
		const result = extract('- Only text', 1, true);
		expect(result?.content).toBe('Only text');
		expect(result?.source).toBe('- [[N]]');
	});

	it('returns null when the position is not a supported bullet', () => {
		const state = stateOf('Plain paragraph');
		expect(planBulletExtract(state, 0, true)).toBeNull();
	});
});

describe('suggestExtractFileName (0.1.45)', () => {
	it('unwraps link syntax and strips illegal file-name characters', () => {
		expect(suggestExtractFileName('關於 [[卡片盒]] / 筆記: 方法')).toBe(
			'關於 卡片盒 筆記 方法',
		);
		expect(suggestExtractFileName('看 [文件](https://example.com) 說明')).toBe(
			'看 文件 說明',
		);
		expect(suggestExtractFileName('[[別名|顯示文字]]')).toBe('顯示文字');
	});

	it('keeps plain text and handles blank labels', () => {
		expect(suggestExtractFileName('  一般標題  ')).toBe('一般標題');
		expect(suggestExtractFileName('')).toBe('');
	});
});
