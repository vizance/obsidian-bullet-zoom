import { getIndentUnit, indentString } from '@codemirror/language';
import {
	EditorState,
	type ChangeSpec,
	type TransactionSpec,
} from '@codemirror/state';

import {
	computeBranchRange,
	findSupportedBullet,
	readListMarkerStyle,
	rewriteBranchToTarget,
	type SupportedBullet,
} from './list-structure';

/**
 * Where the pointer sits inside the hovered line. The upper half aims at the
 * gap above the line, the lower half at the gap below it, so a drop is always
 * placed between two items rather than "on" one of them.
 */
export type LineHalf = 'upper' | 'lower';

export type DropGap = Readonly<{
	above: SupportedBullet | null;
	below: SupportedBullet | null;
	insertAt: number;
}>;

export function indentTextOf(
	state: EditorState,
	bullet: SupportedBullet,
): string {
	return state.doc.sliceString(bullet.lineFrom, bullet.markerFrom);
}

function bulletOnLine(
	state: EditorState,
	lineNumber: number,
): SupportedBullet | null {
	if (lineNumber < 1 || lineNumber > state.doc.lines) {
		return null;
	}
	return findSupportedBullet(state, state.doc.line(lineNumber).from);
}

export function previousSupportedBullet(
	state: EditorState,
	fromLineNumber: number,
): SupportedBullet | null {
	for (let line = fromLineNumber; line >= 1; line -= 1) {
		const bullet = bulletOnLine(state, line);
		if (bullet !== null) {
			return bullet;
		}
	}
	return null;
}

export function nextSupportedBullet(
	state: EditorState,
	fromLineNumber: number,
): SupportedBullet | null {
	for (let line = fromLineNumber; line <= state.doc.lines; line += 1) {
		const bullet = bulletOnLine(state, line);
		if (bullet !== null) {
			return bullet;
		}
	}
	return null;
}

/**
 * The end of the branch rooted at `bullet`, found by indentation rather than
 * by the syntax tree, so Live Preview and the test environment agree.
 */
function branchEndPosition(state: EditorState, bullet: SupportedBullet): number {
	let end = bullet.lineTo;
	for (let line = bullet.lineNumber + 1; line <= state.doc.lines; line += 1) {
		const candidate = bulletOnLine(state, line);
		if (candidate !== null && candidate.indent <= bullet.indent) {
			break;
		}
		const text = state.doc.line(line);
		if (candidate === null && text.text.trim().length === 0) {
			break;
		}
		end = text.to;
	}
	return end;
}

export function resolveDropGap(
	state: EditorState,
	position: number,
	half: LineHalf,
): DropGap | null {
	const hovered = findSupportedBullet(state, position);
	if (hovered === null) {
		return null;
	}
	const above =
		half === 'upper'
			? previousSupportedBullet(state, hovered.lineNumber - 1)
			: hovered;
	const below =
		half === 'upper'
			? hovered
			: nextSupportedBullet(state, hovered.lineNumber + 1);
	if (above === null && below === null) {
		return null;
	}
	const insertAt =
		below !== null
			? below.lineFrom
			: branchEndPosition(state, above as SupportedBullet);
	return Object.freeze({ above, below, insertAt });
}

/**
 * The indent step the target document already uses, measured from its own
 * nesting rather than from the editor's indentUnit setting, so a file indented
 * with tabs keeps its tabs even when the editor is configured for spaces.
 */
export function detectIndentUnitText(state: EditorState): string {
	let previous: string | null = null;
	let shortest: string | null = null;
	for (let line = 1; line <= state.doc.lines; line += 1) {
		const bullet = bulletOnLine(state, line);
		if (bullet === null) {
			continue;
		}
		const indent = indentTextOf(state, bullet);
		if (
			previous !== null &&
			indent.length > previous.length &&
			indent.startsWith(previous)
		) {
			const step = indent.slice(previous.length);
			if (shortest === null || step.length < shortest.length) {
				shortest = step;
			}
		}
		previous = indent;
	}
	return shortest ?? indentString(state, getIndentUnit(state));
}

/**
 * Every indent a branch is allowed to take in this gap, shallowest first.
 *
 * The deepest option makes the branch the first child of the item above. The
 * shallowest option is the indent of the item below: going shallower than that
 * would pull the item below into the dropped branch, changing a part of the
 * document the user never touched.
 */
/** How many lines the branch rooted at `anchor` occupies, minimum one. */
export function countBranchLines(state: EditorState, anchor: number): number {
	const branch = computeBranchRange(state, anchor);
	if (branch === null) {
		return 1;
	}
	const first = state.doc.lineAt(branch.from).number;
	const last = state.doc.lineAt(branch.to).number;
	return Math.max(1, last - first + 1);
}

/** The first supported item drawn at exactly this indent, if the document has one. */
export function findBulletWithIndent(
	state: EditorState,
	indent: string,
): SupportedBullet | null {
	for (let line = 1; line <= state.doc.lines; line += 1) {
		const bullet = bulletOnLine(state, line);
		if (bullet !== null && indentTextOf(state, bullet) === indent) {
			return bullet;
		}
	}
	return null;
}

export function candidateIndents(
	state: EditorState,
	gap: DropGap,
): readonly string[] {
	const { above, below } = gap;
	if (above === null) {
		return below === null
			? Object.freeze([])
			: Object.freeze([indentTextOf(state, below)]);
	}
	const aboveIndent = indentTextOf(state, above);
	const chain: string[] = [aboveIndent];
	let shallowest = aboveIndent;
	for (let line = above.lineNumber - 1; line >= 1; line -= 1) {
		const candidate = bulletOnLine(state, line);
		if (candidate === null) {
			continue;
		}
		const indent = indentTextOf(state, candidate);
		if (indent.length < shallowest.length && shallowest.startsWith(indent)) {
			chain.push(indent);
			shallowest = indent;
		}
	}
	chain.push(aboveIndent + detectIndentUnitText(state));
	const floor = below === null ? '' : indentTextOf(state, below);
	const allowed = chain
		.filter((indent) => indent.length >= floor.length)
		.sort((left, right) => left.length - right.length);
	return Object.freeze([...new Set(allowed)]);
}

export type SameDocumentDrop = Readonly<{
	kind: 'same-document';
	changes: readonly ChangeSpec[];
	insertAt: number;
	/** The inserted text opens with a newline when it lands at the very end. */
	leadingNewline: boolean;
}>;

export type CrossDocumentDrop = Readonly<{
	kind: 'cross-document';
	removal: ChangeSpec;
	insertAt: number;
	insertText: string;
	leadingNewline: boolean;
}>;

export type BranchDropPlan = SameDocumentDrop | CrossDocumentDrop;

export type BranchDropRequest = Readonly<{
	sourceState: EditorState;
	sourceAnchor: number;
	targetState: EditorState;
	gap: DropGap;
	indent: string;
	/**
	 * Two panes can show the same file, so identity of the state object is not
	 * enough to tell "same document" apart. The caller compares the files.
	 */
	sameDocument: boolean;
	/**
	 * The visible range of an active focus session in the target editor, or
	 * null when the target is not zoomed in.
	 */
	targetFocusRange?: Readonly<{ from: number; to: number }> | null;
}>;

function styleSourceLine(
	state: EditorState,
	gap: DropGap,
	indent: string,
): SupportedBullet | null {
	const { above, below } = gap;
	for (const candidate of [below, above]) {
		if (candidate !== null && indentTextOf(state, candidate) === indent) {
			return candidate;
		}
	}
	return below ?? above;
}

export function planBranchDrop(request: BranchDropRequest): BranchDropPlan | null {
	const {
		sourceState,
		sourceAnchor,
		targetState,
		gap,
		indent,
		sameDocument,
		targetFocusRange = null,
	} = request;
	const source = findSupportedBullet(sourceState, sourceAnchor);
	if (source === null) {
		return null;
	}
	const branch = computeBranchRange(sourceState, sourceAnchor);
	if (branch === null) {
		return null;
	}
	if (!candidateIndents(targetState, gap).includes(indent)) {
		return null;
	}
	if (
		sameDocument &&
		gap.insertAt > branch.from &&
		gap.insertAt <= branch.to
	) {
		return null;
	}
	if (
		targetFocusRange !== null &&
		(gap.insertAt < targetFocusRange.from ||
			gap.insertAt > targetFocusRange.to)
	) {
		return null;
	}
	const styleLine = styleSourceLine(targetState, gap, indent);
	if (styleLine === null) {
		return null;
	}
	const targetStyle = readListMarkerStyle(
		targetState.doc.lineAt(styleLine.lineFrom).text,
	);
	if (targetStyle === null) {
		return null;
	}
	const rewritten = rewriteBranchToTarget(
		sourceState.doc.sliceString(branch.from, branch.to),
		indentTextOf(sourceState, source),
		indent,
		targetStyle,
	);
	const insertText =
		gap.below !== null ? `${rewritten}\n` : `\n${rewritten}`;

	let deleteFrom = branch.from;
	let deleteTo = branch.to;
	if (deleteTo < sourceState.doc.length) {
		deleteTo += 1;
	} else if (deleteFrom > 0) {
		deleteFrom -= 1;
	}
	const removal: ChangeSpec = { from: deleteFrom, to: deleteTo };

	const leadingNewline = gap.below === null;
	if (!sameDocument) {
		return Object.freeze({
			kind: 'cross-document',
			removal,
			insertAt: gap.insertAt,
			insertText,
			leadingNewline,
		});
	}
	return Object.freeze({
		kind: 'same-document',
		changes: Object.freeze([
			removal,
			{ from: gap.insertAt, insert: insertText },
		]),
		insertAt: gap.insertAt,
		leadingNewline,
	});
}

/**
 * The single transaction a same-document drop needs: the move itself plus a
 * cursor on the first line of the branch where it landed, so one undo takes
 * the whole thing back.
 */
export function sameDocumentDropTransaction(
	state: EditorState,
	plan: SameDocumentDrop,
): TransactionSpec {
	const changes = state.changes([...plan.changes]);
	const landed = changes.mapPos(plan.insertAt, -1);
	return {
		changes,
		selection: {
			anchor: landed + (plan.leadingNewline ? 1 : 0),
		},
		scrollIntoView: true,
	};
}

/** The insertion half of a cross-document drop, cursor included. */
export function crossDocumentInsertTransaction(
	plan: CrossDocumentDrop,
): TransactionSpec {
	return {
		changes: { from: plan.insertAt, insert: plan.insertText },
		selection: {
			anchor: plan.insertAt + (plan.leadingNewline ? 1 : 0),
		},
		scrollIntoView: true,
	};
}

export const CROSS_DOCUMENT_REMOVAL_FAILED_NOTICE =
	'Bullet Zoom moved the branch but could not remove it from the original note.';

export type CrossDocumentDropOutcome =
	| 'moved'
	| 'insert-failed'
	| 'removal-failed';

/**
 * Inserts first and removes second. If the insertion fails nothing was written,
 * so the source keeps the branch. If the removal fails the user is left with a
 * duplicate and a notice, because duplicated text can be deleted by hand while
 * lost text cannot be recovered.
 */
export function applyCrossDocumentDrop(
	plan: CrossDocumentDrop,
	actions: Readonly<{
		insert: (transaction: TransactionSpec) => void;
		remove: (changes: ChangeSpec) => void;
		notify: (message: string) => void;
	}>,
): CrossDocumentDropOutcome {
	try {
		actions.insert(crossDocumentInsertTransaction(plan));
	} catch {
		return 'insert-failed';
	}
	try {
		actions.remove(plan.removal);
	} catch {
		actions.notify(CROSS_DOCUMENT_REMOVAL_FAILED_NOTICE);
		return 'removal-failed';
	}
	return 'moved';
}
