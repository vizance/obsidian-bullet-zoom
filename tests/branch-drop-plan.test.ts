import { markdown } from '@codemirror/lang-markdown';
import { indentUnit } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { describe, expect, it } from 'vitest';

import { markerDetectionFacet } from '../src/list-structure';

import {
	candidateIndents,
	detectIndentUnitText,
	indentTextOf,
	applyCrossDocumentDrop,
	CROSS_DOCUMENT_REMOVAL_FAILED_NOTICE,
	crossDocumentInsertTransaction,
	planBranchDrop,
	sameDocumentDropTransaction,
	resolveDropGap,
	type BranchDropPlan,
} from '../src/branch-drop-plan';

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

const NESTED = '- A\n\t- A1\n\t\t- A1a\n- B';

function lineStart(state: EditorState, lineNumber: number): number {
	return state.doc.line(lineNumber).from;
}

describe('resolveDropGap', () => {
	it('takes the gap above the line when the pointer is in its upper half', () => {
		const state = createState(NESTED);
		const gap = resolveDropGap(state, lineStart(state, 2), 'upper');
		expect(gap?.above?.label).toBe('A');
		expect(gap?.below?.label).toBe('A1');
		expect(gap?.insertAt).toBe(lineStart(state, 2));
	});

	it('takes the gap below the line when the pointer is in its lower half', () => {
		const state = createState(NESTED);
		const gap = resolveDropGap(state, lineStart(state, 3), 'lower');
		expect(gap?.above?.label).toBe('A1a');
		expect(gap?.below?.label).toBe('B');
		expect(gap?.insertAt).toBe(lineStart(state, 4));
	});

	it('has no item above the first line', () => {
		const state = createState(NESTED);
		const gap = resolveDropGap(state, lineStart(state, 1), 'upper');
		expect(gap?.above).toBeNull();
		expect(gap?.below?.label).toBe('A');
	});

	it('has no item below the last item and inserts after its branch', () => {
		const state = createState(NESTED);
		const gap = resolveDropGap(state, lineStart(state, 4), 'lower');
		expect(gap?.above?.label).toBe('B');
		expect(gap?.below).toBeNull();
		expect(gap?.insertAt).toBe(state.doc.line(4).to);
	});

	it('resolves nothing on a line that is not a supported list item', () => {
		const state = createState('- A\n\nJust a paragraph');
		expect(resolveDropGap(state, lineStart(state, 3), 'upper')).toBeNull();
		expect(resolveDropGap(state, lineStart(state, 3), 'lower')).toBeNull();
	});

	it('resolves nothing on a numbered item while numbered detection is off', () => {
		const state = createState('- A\n1. Numbered');
		expect(resolveDropGap(state, lineStart(state, 2), 'lower')).toBeNull();
	});
});

describe('detectIndentUnitText', () => {
	it('reads the step the document already uses instead of the editor setting', () => {
		expect(detectIndentUnitText(createState(NESTED))).toBe('\t');
		expect(detectIndentUnitText(createState('- A\n    - A1'))).toBe('    ');
	});

	it('falls back to the configured indent when the document is flat', () => {
		expect(detectIndentUnitText(createState('- A\n- B'))).toBe('  ');
	});
});

describe('indentTextOf', () => {
	it('returns the literal indent characters of the item', () => {
		const state = createState(NESTED);
		const bullet = resolveDropGap(state, lineStart(state, 3), 'upper')?.below;
		expect(bullet).not.toBeUndefined();
		expect(indentTextOf(state, bullet!)).toBe('\t\t');
	});
});

describe('candidateIndents', () => {
	const state = createState(NESTED);

	it.each([
		['before the first item', 1, 'upper' as const, ['']],
		['between A and A1', 2, 'upper' as const, ['\t']],
		['between A1a and B', 4, 'upper' as const, ['', '\t', '\t\t', '\t\t\t']],
		['after the last item', 4, 'lower' as const, ['', '\t']],
	])('lists the legal indents %s', (_name, line, half, expected) => {
		const gap = resolveDropGap(state, lineStart(state, line), half);
		expect(gap).not.toBeNull();
		expect(candidateIndents(state, gap!)).toEqual(expected);
	});

	it('keeps the indent characters the document already uses', () => {
		const spaces = createState('- A\n    - A1\n- B');
		const gap = resolveDropGap(spaces, lineStart(spaces, 3), 'upper');
		expect(candidateIndents(spaces, gap!)).toEqual(['', '    ', '        ']);
	});
});

function applySame(state: EditorState, plan: BranchDropPlan | null): string {
	expect(plan?.kind).toBe('same-document');
	if (plan?.kind !== 'same-document') {
		throw new Error('expected a same-document plan');
	}
	return state.update({ changes: plan.changes }).state.doc.toString();
}

function anchorOf(state: EditorState, lineNumber: number): number {
	return state.doc.line(lineNumber).from;
}

describe('planBranchDrop', () => {
	const base = {
		sameDocument: true,
	};

	function request(
		state: EditorState,
		sourceLine: number,
		targetLine: number,
		half: 'upper' | 'lower',
		indent: string,
	) {
		const gap = resolveDropGap(state, anchorOf(state, targetLine), half);
		expect(gap).not.toBeNull();
		return {
			...base,
			sourceState: state,
			sourceAnchor: anchorOf(state, sourceLine),
			targetState: state,
			gap: gap!,
			indent,
		};
	}

	it('moves a branch to a sibling position in the same document', () => {
		const state = createState('- A\n\t- A1\n- B');
		const plan = planBranchDrop(request(state, 3, 1, 'upper', ''));
		expect(applySame(state, plan)).toBe('- B\n- A\n\t- A1');
	});

	it('makes the branch the first child of the item above', () => {
		const state = createState('- A\n- B\n\t- B1');
		const plan = planBranchDrop(request(state, 1, 2, 'lower', '\t'));
		expect(applySame(state, plan)).toBe('- B\n\t- A\n\t- B1');
	});

	it('pulls a child back out to the outermost level at the end of the list', () => {
		const state = createState('- A\n\t- A1\n\t\t- A1a\n- B');
		const plan = planBranchDrop(request(state, 2, 4, 'lower', ''));
		expect(applySame(state, plan)).toBe('- A\n- B\n- A1\n\t- A1a');
	});

	it('renumbers the branch when it lands in a numbered list', () => {
		const state = EditorState.create({
			doc: '- Alpha\n\t- Beta\n\t- Gamma\n1. One\n2. Two',
			extensions: [
				markdown(),
				EditorState.tabSize.of(4),
				indentUnit.of('  '),
				markerDetectionFacet.of({ bullets: true, numbered: true }),
			],
		});
		const gap = resolveDropGap(state, anchorOf(state, 5), 'lower');
		const plan = planBranchDrop({
			sameDocument: true,
			sourceState: state,
			sourceAnchor: anchorOf(state, 1),
			targetState: state,
			gap: gap!,
			indent: '',
		});
		expect(applySame(state, plan)).toBe(
			'1. One\n2. Two\n1. Alpha\n\t1. Beta\n\t2. Gamma',
		);
	});

	it('returns a cross-document plan when the target is another file', () => {
		const source = createState('- A\n\t- A1\n- B');
		const target = createState('- X\n- Y');
		const gap = resolveDropGap(target, anchorOf(target, 1), 'lower');
		const plan = planBranchDrop({
			sourceState: source,
			sourceAnchor: anchorOf(source, 1),
			targetState: target,
			gap: gap!,
			indent: '',
			sameDocument: false,
		});
		expect(plan?.kind).toBe('cross-document');
		if (plan?.kind !== 'cross-document') {
			throw new Error('expected a cross-document plan');
		}
		expect(plan.insertText).toBe('- A\n\t- A1\n');
		expect(
			target.update({
				changes: { from: plan.insertAt, insert: plan.insertText },
			}).state.doc.toString(),
		).toBe('- X\n- A\n\t- A1\n- Y');
		expect(
			source.update({ changes: plan.removal }).state.doc.toString(),
		).toBe('- B');
	});

	it('rejects a gap that sits inside the dragged branch', () => {
		const state = createState('- A\n\t- A1\n\t- A2\n- B');
		expect(planBranchDrop(request(state, 1, 2, 'lower', '\t'))).toBeNull();
	});

	it('rejects an indent that is not legal for the gap', () => {
		const state = createState('- A\n\t- A1\n- B');
		expect(planBranchDrop(request(state, 3, 2, 'upper', ''))).toBeNull();
	});

	it('rejects a source line that is not a supported list item', () => {
		const state = createState('Plain text\n- A\n- B');
		expect(planBranchDrop(request(state, 1, 3, 'lower', ''))).toBeNull();
	});

	it('rejects a gap outside an active focus session in the target', () => {
		const state = createState('- A\n- B\n- C');
		expect(
			planBranchDrop({
				...request(state, 1, 3, 'lower', ''),
				targetFocusRange: { from: 0, to: state.doc.line(2).to },
			}),
		).toBeNull();
	});
});

describe('sameDocumentDropTransaction', () => {
	it('moves the branch and leaves the cursor on its first line', () => {
		const state = createState('- A\n\t- A1\n- B');
		const gap = resolveDropGap(state, anchorOf(state, 1), 'upper');
		const plan = planBranchDrop({
			sameDocument: true,
			sourceState: state,
			sourceAnchor: anchorOf(state, 3),
			targetState: state,
			gap: gap!,
			indent: '',
		});
		expect(plan?.kind).toBe('same-document');
		if (plan?.kind !== 'same-document') {
			throw new Error('expected a same-document plan');
		}
		const next = state.update(
			sameDocumentDropTransaction(state, plan),
		).state;
		expect(next.doc.toString()).toBe('- B\n- A\n\t- A1');
		expect(next.selection.main.head).toBe(next.doc.line(1).from);
	});

	it('is a single undo step', () => {
		const state = createState('- A\n- B');
		const gap = resolveDropGap(state, anchorOf(state, 1), 'upper');
		const plan = planBranchDrop({
			sameDocument: true,
			sourceState: state,
			sourceAnchor: anchorOf(state, 2),
			targetState: state,
			gap: gap!,
			indent: '',
		});
		if (plan?.kind !== 'same-document') {
			throw new Error('expected a same-document plan');
		}
		const transaction = state.update(
			sameDocumentDropTransaction(state, plan),
		);
		expect(transaction.state.doc.toString()).toBe('- B\n- A');
		expect(
			transaction.changes.invert(state.doc).apply(transaction.newDoc).toString(),
		).toBe('- A\n- B');
	});

	it('puts the cursor after the newline when the branch lands last', () => {
		const state = createState('- A\n- B');
		const gap = resolveDropGap(state, anchorOf(state, 2), 'lower');
		const plan = planBranchDrop({
			sameDocument: true,
			sourceState: state,
			sourceAnchor: anchorOf(state, 1),
			targetState: state,
			gap: gap!,
			indent: '',
		});
		if (plan?.kind !== 'same-document') {
			throw new Error('expected a same-document plan');
		}
		const next = state.update(
			sameDocumentDropTransaction(state, plan),
		).state;
		expect(next.doc.toString()).toBe('- B\n- A');
		expect(next.selection.main.head).toBe(next.doc.line(2).from);
	});
});

describe('crossDocumentInsertTransaction', () => {
	it('inserts into the target and puts the cursor on the branch', () => {
		const source = createState('- A\n\t- A1\n- B');
		const target = createState('- X\n- Y');
		const gap = resolveDropGap(target, anchorOf(target, 2), 'lower');
		const plan = planBranchDrop({
			sourceState: source,
			sourceAnchor: anchorOf(source, 1),
			targetState: target,
			gap: gap!,
			indent: '',
			sameDocument: false,
		});
		if (plan?.kind !== 'cross-document') {
			throw new Error('expected a cross-document plan');
		}
		const next = target.update(crossDocumentInsertTransaction(plan)).state;
		expect(next.doc.toString()).toBe('- X\n- Y\n- A\n\t- A1');
		expect(next.selection.main.head).toBe(next.doc.line(3).from);
	});
});

describe('applyCrossDocumentDrop', () => {
	function crossPlan() {
		const source = createState('- A\n\t- A1\n- B');
		const target = createState('- X\n- Y');
		const gap = resolveDropGap(target, anchorOf(target, 1), 'lower');
		const plan = planBranchDrop({
			sourceState: source,
			sourceAnchor: anchorOf(source, 1),
			targetState: target,
			gap: gap!,
			indent: '',
			sameDocument: false,
		});
		if (plan?.kind !== 'cross-document') {
			throw new Error('expected a cross-document plan');
		}
		return plan;
	}

	it('inserts into the target before removing from the source', () => {
		const order: string[] = [];
		const outcome = applyCrossDocumentDrop(crossPlan(), {
			insert: () => order.push('insert'),
			remove: () => order.push('remove'),
			notify: () => order.push('notify'),
		});
		expect(outcome).toBe('moved');
		expect(order).toEqual(['insert', 'remove']);
	});

	it('leaves the source untouched when the insertion fails', () => {
		const order: string[] = [];
		const outcome = applyCrossDocumentDrop(crossPlan(), {
			insert: () => {
				throw new Error('target is gone');
			},
			remove: () => order.push('remove'),
			notify: () => order.push('notify'),
		});
		expect(outcome).toBe('insert-failed');
		expect(order).toEqual([]);
	});

	it('keeps the inserted branch and warns when the removal fails', () => {
		const messages: string[] = [];
		const outcome = applyCrossDocumentDrop(crossPlan(), {
			insert: () => undefined,
			remove: () => {
				throw new Error('source is read-only');
			},
			notify: (message) => messages.push(message),
		});
		expect(outcome).toBe('removal-failed');
		expect(messages).toEqual([CROSS_DOCUMENT_REMOVAL_FAILED_NOTICE]);
	});
});
