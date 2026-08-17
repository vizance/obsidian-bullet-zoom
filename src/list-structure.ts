import {
	ensureSyntaxTree,
	getIndentUnit,
	indentString,
	syntaxTree,
} from '@codemirror/language';
import {
	countColumn,
	EditorState,
	Facet,
	type ChangeSpec,
} from '@codemirror/state';
import type { SyntaxNode, Tree } from '@lezer/common';

export type SupportedBullet = Readonly<{
	lineNumber: number;
	lineFrom: number;
	lineTo: number;
	markerFrom: number;
	markerTo: number;
	contentFrom: number;
	indent: number;
	label: string;
}>;

export type BranchRange = Readonly<{
	from: number;
	to: number;
}>;

export type Breadcrumb = Readonly<{
	label: string;
	anchor: number | null;
}>;

export type AppendChildInsertionPlan = Readonly<{
	status: 'ready';
	insertAt: number;
	insertText: string;
	cursorAt: number;
}>;

export type AppendChildInsertionFailure = Readonly<{
	status: 'unsafe';
	reason: 'unsupported-target' | 'incomplete-syntax' | 'unsafe-boundary';
}>;

export type AppendChildInsertionResult =
	| AppendChildInsertionPlan
	| AppendChildInsertionFailure;

export type HyperMdInsertionEntry = Readonly<{
	lineFrom: number;
	lineTo: number;
	level: number | null;
	hasListMarker: boolean;
	nonBlank: boolean;
}>;

export type BulletOutlineNode = Readonly<{
	label: string;
	anchor: number;
	children: readonly BulletOutlineNode[];
}>;

export function findOutlinePath(
	nodes: readonly BulletOutlineNode[],
	anchor: number,
): readonly BulletOutlineNode[] | null {
	for (const node of nodes) {
		if (node.anchor === anchor) {
			return Object.freeze([node]);
		}
		const childPath = findOutlinePath(node.children, anchor);
		if (childPath !== null) {
			return Object.freeze([node, ...childPath]);
		}
	}
	return null;
}

export class BulletOutlineParsePendingError extends Error {
	constructor() {
		super('The Markdown syntax tree is not ready for a complete outline.');
		this.name = 'BulletOutlineParsePendingError';
	}
}

export class BulletOutlineLimitError extends Error {
	constructor() {
		super('The Bullet outline exceeds the supported size or depth.');
		this.name = 'BulletOutlineLimitError';
	}
}

const PLAIN_BULLET_PATTERN = /^([\t ]*)([-+*])([\t ]+)(.*)$/;
const ORDERED_ITEM_PATTERN = /^([\t ]*)(\d+[.)])([\t ]+)(.*)$/;

export interface MarkerDetection {
	readonly bullets: boolean;
	readonly numbered: boolean;
}

const DEFAULT_MARKER_DETECTION: MarkerDetection = Object.freeze({
	bullets: true,
	numbered: false,
});

export const markerDetectionFacet = Facet.define<
	MarkerDetection,
	MarkerDetection
>({
	combine: (values) => values.at(0) ?? DEFAULT_MARKER_DETECTION,
});
const ANY_LIST_MARKER_PATTERN = /^[\t ]*(?:[-+*]|\d+[.)])[\t ]+/;
const ORDERED_LIST_MARKER_PATTERN = /^[\t ]*\d+[.)][\t ]+/;
const TASK_PATTERN = /^\[(?: |x|X)\](?:\s|$)/;
const frontmatterEndLineCache = new WeakMap<EditorState, number>();
const completeSyntaxTreeCache = new WeakMap<EditorState, Tree>();
const MAX_OUTLINE_NODES = 1_000;
const MAX_OUTLINE_DEPTH = 128;

function frontmatterEndLine(state: EditorState): number {
	const cached = frontmatterEndLineCache.get(state);
	if (cached !== undefined) {
		return cached;
	}
	if (state.doc.lines < 2 || state.doc.line(1).text.trim() !== '---') {
		frontmatterEndLineCache.set(state, 0);
		return 0;
	}
	for (let number = 2; number <= state.doc.lines; number += 1) {
		const text = state.doc.line(number).text.trim();
		if (text === '---' || text === '...') {
			frontmatterEndLineCache.set(state, number);
			return number;
		}
	}
	const unclosedBoundary = state.doc.lines + 1;
	frontmatterEndLineCache.set(state, unclosedBoundary);
	return unclosedBoundary;
}

function isInsideFrontmatter(state: EditorState, lineNumber: number): boolean {
	const endLine = frontmatterEndLine(state);
	return lineNumber > 1 && endLine > 0 && lineNumber < endLine;
}

export function isSupportedBulletSyntaxNode(
	node: SyntaxNode,
	markerFrom: number,
	markerTo: number,
	detection: MarkerDetection = DEFAULT_MARKER_DETECTION,
): boolean {
	if (node.from !== markerFrom) {
		return false;
	}

	const syntaxTokens = node.name.split('_');
	if (
		syntaxTokens.includes('formatting-list-ul') ||
		syntaxTokens.includes('formatting-list-ol')
	) {
		if (node.to < markerTo) {
			return false;
		}
		if (syntaxTokens.includes('formatting-list-ul') && !detection.bullets) {
			return false;
		}
		if (syntaxTokens.includes('formatting-list-ol') && !detection.numbered) {
			return false;
		}
		const parentTokens = node.parent?.name.split('_') ?? [];
		return parentTokens.includes('HyperMD-list-line');
	}

	if (node.name !== 'ListMark' || node.to !== markerTo) {
		return false;
	}

	let current: SyntaxNode | null = node;
	let nearestListKind: 'bullet' | 'ordered' | null = null;
	let hasOrderedAncestor = false;
	while (current !== null) {
		if (current.name === 'OrderedList') {
			hasOrderedAncestor = true;
			nearestListKind ??= 'ordered';
		}
		if (current.name === 'BulletList') {
			nearestListKind ??= 'bullet';
		}
		current = current.parent;
	}
	if (nearestListKind === null) {
		return false;
	}
	if (nearestListKind === 'bullet' && !detection.bullets) {
		return false;
	}
	if (nearestListKind === 'ordered' && !detection.numbered) {
		return false;
	}
	if (hasOrderedAncestor && !detection.numbered) {
		return false;
	}
	return true;
}

function hasBulletListSyntax(
	state: EditorState,
	markerFrom: number,
	markerTo: number,
): boolean {
	const node =
		(completeSyntaxTreeCache.get(state) ?? syntaxTree(state)).resolveInner(
			markerFrom,
			1,
		);
	return isSupportedBulletSyntaxNode(
		node,
		markerFrom,
		markerTo,
		state.facet(markerDetectionFacet),
	);
}

export function findSupportedBullet(
	state: EditorState,
	position: number,
): SupportedBullet | null {
	const safePosition = Math.max(0, Math.min(position, state.doc.length));
	const line = state.doc.lineAt(safePosition);
	const detection = state.facet(markerDetectionFacet);
	const match =
		(detection.bullets ? PLAIN_BULLET_PATTERN.exec(line.text) : null) ??
		(detection.numbered ? ORDERED_ITEM_PATTERN.exec(line.text) : null);

	if (match === null || isInsideFrontmatter(state, line.number)) {
		return null;
	}

	const indentText = match[1];
	const markerText = match[2];
	const spacing = match[3];
	const content = match[4];
	if (
		indentText === undefined ||
		markerText === undefined ||
		spacing === undefined ||
		content === undefined
	) {
		return null;
	}
	if (TASK_PATTERN.test(content)) {
		return null;
	}

	const markerFrom = line.from + indentText.length;
	const markerTo = markerFrom + markerText.length;
	if (!hasBulletListSyntax(state, markerFrom, markerTo)) {
		return null;
	}

	return Object.freeze({
		lineNumber: line.number,
		lineFrom: line.from,
		lineTo: line.to,
		markerFrom,
		markerTo,
		contentFrom: markerTo + spacing.length,
		indent: countColumn(indentText, state.tabSize),
		label: content.trim(),
	});
}

function lineIndent(state: EditorState, text: string): number {
	const leadingWhitespace = /^[\t ]*/.exec(text)?.[0] ?? '';
	return countColumn(leadingWhitespace, state.tabSize);
}

export function computeBranchRange(
	state: EditorState,
	position: number,
): BranchRange | null {
	const target = findSupportedBullet(state, position);
	if (target === null) {
		return null;
	}
	const targetTree = ensureSyntaxTree(state, state.doc.length, 50);
	if (targetTree !== null) {
		completeSyntaxTreeCache.set(state, targetTree);
		let node: SyntaxNode | null = targetTree.resolveInner(target.markerFrom, 1);
		while (node !== null) {
			if (node.name === 'ListItem') {
				return Object.freeze({ from: target.lineFrom, to: node.to });
			}
			node = node.parent;
		}

		const targetLevel = hyperMdListLevel(
			targetTree.resolveInner(target.markerFrom, 1),
		);
		if (targetLevel !== null) {
			let lastLine = state.doc.line(target.lineNumber);
			for (
				let number = target.lineNumber + 1;
				number <= state.doc.lines;
				number += 1
			) {
				const line = state.doc.line(number);
				if (line.text.trim().length === 0) {
					continue;
				}
				const firstContentOffset = /^[\t ]*/.exec(line.text)?.[0].length ?? 0;
				const lineLevel = hyperMdListLevel(
					targetTree.resolveInner(
						Math.min(line.to, line.from + firstContentOffset),
						1,
					),
				);
				if (lineLevel === null || lineLevel < targetLevel) {
					break;
				}
				if (
					lineLevel === targetLevel &&
					ANY_LIST_MARKER_PATTERN.test(line.text)
				) {
					break;
				}
				lastLine = line;
			}
			return Object.freeze({ from: target.lineFrom, to: lastLine.to });
		}
	}

	let lastIncludedLine = state.doc.line(target.lineNumber);
	for (
		let number = target.lineNumber + 1;
		number <= state.doc.lines;
		number += 1
	) {
		const line = state.doc.line(number);
		if (line.text.trim().length === 0) {
			continue;
		}
		if (lineIndent(state, line.text) <= target.indent) {
			break;
		}
		lastIncludedLine = line;
	}

	return Object.freeze({
		from: target.lineFrom,
		to: lastIncludedLine.to,
	});
}

function unsafeAppendChildInsertion(
	reason: AppendChildInsertionFailure['reason'],
): AppendChildInsertionFailure {
	return Object.freeze({ status: 'unsafe', reason });
}

function childIndentText(state: EditorState, target: SupportedBullet): string {
	const contentColumn = countColumn(
		state.sliceDoc(target.lineFrom, target.contentFrom),
		state.tabSize,
	);
	return indentString(
		state,
		Math.max(contentColumn, target.indent + getIndentUnit(state)),
	);
}

function readyAppendChildInsertion(
	insertAt: number,
	indentText: string,
): AppendChildInsertionPlan {
	const newline = String.fromCharCode(10);
	const insertText = newline + indentText + '- ';
	return Object.freeze({
		status: 'ready',
		insertAt,
		insertText,
		cursorAt: insertAt + indentText.length + 3,
	});
}

function enclosingListItem(node: SyntaxNode | null): SyntaxNode | null {
	let current = node;
	while (current !== null) {
		if (current.name === 'ListItem') {
			return current;
		}
		current = current.parent;
	}
	return null;
}

function planStandardAppendChildInsertion(
	state: EditorState,
	target: SupportedBullet,
	tree: Tree,
): AppendChildInsertionResult {
	const ownListItem = enclosingListItem(
		tree.resolveInner(target.markerFrom, 1),
	);
	if (
		ownListItem === null ||
		ownListItem.to < target.lineTo ||
		ownListItem.to > state.doc.length
	) {
		return unsafeAppendChildInsertion('unsafe-boundary');
	}
	return readyAppendChildInsertion(
		ownListItem.to,
		childIndentText(state, target),
	);
}

export function planHyperMdAppendChildInsertion(
	target: SupportedBullet,
	targetLevel: number,
	entries: readonly HyperMdInsertionEntry[],
	indentText: string,
): AppendChildInsertionResult {
	let lastOwnedTo = target.lineTo;
	let hasDirectChild = false;
	for (const entry of entries) {
		if (!entry.nonBlank) {
			continue;
		}
		if (
			entry.level === null ||
			entry.level < targetLevel ||
			(entry.hasListMarker && entry.level === targetLevel)
		) {
			break;
		}
		if (entry.hasListMarker && entry.level === targetLevel + 1) {
			hasDirectChild = true;
		} else if (
			entry.hasListMarker &&
			entry.level > targetLevel + 1 &&
			!hasDirectChild
		) {
			return unsafeAppendChildInsertion('unsafe-boundary');
		}
		lastOwnedTo = entry.lineTo;
	}
	return readyAppendChildInsertion(lastOwnedTo, indentText);
}

export function planAppendChildInsertion(
	state: EditorState,
	position: number,
): AppendChildInsertionResult {
	const target = findSupportedBullet(state, position);
	if (target === null) {
		return unsafeAppendChildInsertion('unsupported-target');
	}
	const tree = ensureSyntaxTree(state, state.doc.length, 50);
	if (tree === null || tree.length < state.doc.length) {
		return unsafeAppendChildInsertion('incomplete-syntax');
	}
	completeSyntaxTreeCache.set(state, tree);

	const markerNode = tree.resolveInner(target.markerFrom, 1);
	if (enclosingListItem(markerNode) !== null) {
		return planStandardAppendChildInsertion(state, target, tree);
	}
	const targetLevel = hyperMdListLevel(markerNode);
	if (targetLevel === null) {
		return unsafeAppendChildInsertion('unsafe-boundary');
	}
	const entries: HyperMdInsertionEntry[] = [];
	for (
		let lineNumber = target.lineNumber + 1;
		lineNumber <= state.doc.lines;
		lineNumber += 1
	) {
		const line = state.doc.line(lineNumber);
		const firstContentOffset = /^[\t ]*/.exec(line.text)?.[0].length ?? 0;
		entries.push(
			Object.freeze({
				lineFrom: line.from,
				lineTo: line.to,
				level: hyperMdListLevel(
					tree.resolveInner(
						Math.min(line.to, line.from + firstContentOffset),
						1,
					),
				),
				hasListMarker: ANY_LIST_MARKER_PATTERN.test(line.text),
				nonBlank: line.text.trim().length > 0,
			}),
		);
	}
	return planHyperMdAppendChildInsertion(
		target,
		targetLevel,
		entries,
		childIndentText(state, target),
	);
}

export function displayBulletLabel(label: string): string {
	return label.length === 0 ? 'Untitled bullet' : label;
}

function plainTextFallbackLabel(label: string): string {
	const protectedEscapes: string[] = [];
	let escapeTokenPrefix = '\uE000BZE';
	while (label.includes(escapeTokenPrefix)) {
		escapeTokenPrefix += 'Z';
	}
	let result = label.replace(
		/\\([\\`*_[\]{}()#+.!~>-])/g,
		(_match, literal: string) => {
			const index = protectedEscapes.push(literal) - 1;
			return `${escapeTokenPrefix}${index}\uE001`;
		},
	);

	result = result.replace(
		/!?\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
		(_match, target: string, alias: string | undefined) => alias ?? target,
	);
	result = result.replace(
		/!\[([^\]]*)\]\((?:[^()\n]|\([^()\n]*\))*\)/g,
		'$1',
	);
	result = result.replace(
		/\[([^\]]+)\]\((?:[^()\n]|\([^()\n]*\))*\)/g,
		'$1',
	);
	result = result.replace(/\*\*(\S(?:[^\n]*?\S)?)\*\*/g, '$1');
	result = result.replace(/__(\S(?:[^\n]*?\S)?)__/g, '$1');
	result = result.replace(/~~(\S(?:[^\n]*?\S)?)~~/g, '$1');
	result = result.replace(/(`+)(\S(?:[^`\n]*?\S)?)\1/g, '$2');
	result = result.replace(
		/(^|[\s([{'">])\*(?!\*)(\S(?:[^*\n]*?\S)?)\*(?!\*)/g,
		'$1$2',
	);
	result = result.replace(
		/(^|[\s([{'">])_(?!_)(\S(?:[^_\n]*?\S)?)_(?!_)/g,
		'$1$2',
	);

	for (const [index, literal] of protectedEscapes.entries()) {
		result = result.replace(`${escapeTokenPrefix}${index}\uE001`, literal);
	}
	return displayBulletLabel(result.trim());
}

type LabelEdit = Readonly<{
	from: number;
	to: number;
	replacement: string;
}>;

function outlinePlainTextLabel(
	state: EditorState,
	bullet: SupportedBullet,
	tree: Tree,
): string {
	const raw = state.sliceDoc(bullet.contentFrom, bullet.lineTo).trim();
	if (raw.length === 0) {
		return displayBulletLabel(raw);
	}
	const contentOffset = state
		.sliceDoc(bullet.contentFrom, bullet.lineTo)
		.indexOf(raw);
	const rawFrom = bullet.contentFrom + Math.max(0, contentOffset);
	const rawTo = rawFrom + raw.length;
	const edits: LabelEdit[] = [];
	const replacementRanges: Array<Readonly<{ from: number; to: number }>> = [];

	for (const match of raw.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)) {
		if (match.index === undefined || match[1] === undefined) {
			continue;
		}
		const from = rawFrom + match.index;
		const to = from + match[0].length;
		replacementRanges.push({ from, to });
		edits.push({ from, to, replacement: match[2] ?? match[1] });
	}

	tree.iterate({
		from: rawFrom,
		to: rawTo,
		enter: (node) => {
			if (
			replacementRanges.some(
				(range) => node.from >= range.from && node.to <= range.to,
			)
		) {
			return;
		}
		if (node.name === 'Link' || node.name === 'Image') {
			const source = state.sliceDoc(node.from, node.to);
			const labelStart = source.startsWith('![') ? 2 : 1;
			const labelEnd = source.indexOf(']', labelStart);
			if (labelEnd >= labelStart) {
				replacementRanges.push({ from: node.from, to: node.to });
				edits.push({
					from: node.from,
					to: node.to,
					replacement: source.slice(labelStart, labelEnd),
				});
			}
		} else if (
			[
				'EmphasisMark',
				'StrikethroughMark',
				'CodeMark',
				'LinkMark',
				'URL',
				'LinkTitle',
			].includes(node.name)
		) {
			edits.push({ from: node.from, to: node.to, replacement: '' });
		}
	},
	});

	for (const match of raw.matchAll(/~~[^~]+~~/g)) {
		if (match.index === undefined) {
			continue;
		}
		const from = rawFrom + match.index;
		if (
			replacementRanges.some(
				(range) => from >= range.from && from < range.to,
			)
		) {
			continue;
		}
		edits.push({ from, to: from + 2, replacement: '' });
		const closingFrom = from + match[0].length - 2;
		edits.push({
			from: closingFrom,
			to: closingFrom + 2,
			replacement: '',
		});
	}

	let result = raw;
	const uniqueEdits = Array.from(
		new Map(
			edits.map((edit) => [
				`${edit.from}:${edit.to}:${edit.replacement}`,
				 edit,
			]),
		).values(),
	);
	for (const edit of uniqueEdits.sort((left, right) => right.from - left.from)) {
		const from = edit.from - rawFrom;
		const to = edit.to - rawFrom;
		result = result.slice(0, from) + edit.replacement + result.slice(to);
	}
	return plainTextFallbackLabel(result);
}

type MutableBulletOutlineNode = {
	label: string;
	anchor: number;
	children: MutableBulletOutlineNode[];
};

function freezeOutlineNodes(
	roots: readonly MutableBulletOutlineNode[],
): readonly BulletOutlineNode[] {
	const frozenNodes = new Map<MutableBulletOutlineNode, BulletOutlineNode>();
	const work: Array<Readonly<{ node: MutableBulletOutlineNode; visited: boolean }>> =
		roots.map((node) => ({ node, visited: false }));
	while (work.length > 0) {
		const current = work.pop();
		if (current === undefined) {
			break;
		}
		if (!current.visited) {
			work.push({ node: current.node, visited: true });
			for (let index = current.node.children.length - 1; index >= 0; index -= 1) {
				const child = current.node.children[index];
				if (child !== undefined) {
					work.push({ node: child, visited: false });
				}
			}
			continue;
		}
		frozenNodes.set(
			current.node,
			Object.freeze({
				label: current.node.label,
				anchor: current.node.anchor,
				children: Object.freeze(
					current.node.children.map((child) => frozenNodes.get(child)!),
				),
			}),
		);
	}
	return Object.freeze(roots.map((root) => frozenNodes.get(root)!));
}

export type HyperMdOutlineEntry = Readonly<{
	level: number | null;
	bullet: SupportedBullet | null;
	hasListMarker: boolean;
	isOrdered?: boolean;
	nonBlank: boolean;
}>;

export function collectHyperMdAncestorBullets(
	entries: readonly HyperMdOutlineEntry[],
	targetLevel: number,
): readonly SupportedBullet[] {
	const ancestors: SupportedBullet[] = [];
	let currentLevel = targetLevel;
	for (const entry of entries) {
		if (!entry.nonBlank) {
			continue;
		}
		if (entry.level === null) {
			break;
		}
		if (entry.isOrdered === true) {
			break;
		}
		if (!entry.hasListMarker || entry.level >= currentLevel) {
			continue;
		}
		currentLevel = entry.level;
		if (entry.bullet === null) {
			break;
		}
		ancestors.push(entry.bullet);
		if (currentLevel <= 1) {
			break;
		}
	}
	return Object.freeze(ancestors);
}

export function buildHyperMdBulletOutline(
	entries: readonly HyperMdOutlineEntry[],
	detection: MarkerDetection = DEFAULT_MARKER_DETECTION,
): readonly BulletOutlineNode[] {
	const roots: MutableBulletOutlineNode[] = [];
	let nodeCount = 0;
	let structuralEntryCount = 0;
	const stack: Array<{
		level: number;
		node: MutableBulletOutlineNode | null;
		isOrdered: boolean;
	}> = [];
	for (const entry of entries) {
		if (!entry.nonBlank) {
			continue;
		}
		if (entry.level === null) {
			stack.length = 0;
			continue;
		}
		const level = entry.level;
		if (!entry.hasListMarker) {
			continue;
		}
		while (stack.length > 0 && stack.at(-1)!.level >= level) {
			stack.pop();
		}
		const isOrdered = entry.isOrdered === true;
		const isInsideOrderedList = stack.some(
			(parent) => parent.isOrdered && parent.level < level,
		);
		structuralEntryCount += 1;
		if (
			structuralEntryCount > MAX_OUTLINE_NODES ||
			stack.length + 1 > MAX_OUTLINE_DEPTH
		) {
			throw new BulletOutlineLimitError();
		}
		if (
			entry.bullet === null ||
			(!detection.numbered && (isOrdered || isInsideOrderedList))
		) {
			stack.push({ level, node: null, isOrdered });
			continue;
		}
		nodeCount += 1;
		if (nodeCount > MAX_OUTLINE_NODES) {
			throw new BulletOutlineLimitError();
		}
		const node: MutableBulletOutlineNode = {
			label: plainTextFallbackLabel(entry.bullet.label),
			anchor: entry.bullet.markerFrom,
			children: [],
		};
		const parent = stack.at(-1)?.node;
		if (parent === undefined || parent === null) {
			roots.push(node);
		} else {
			parent.children.push(node);
		}
		stack.push({ level, node, isOrdered });
	}
	return freezeOutlineNodes(roots);
}

export function hyperMdListLevel(node: SyntaxNode | null): number | null {
	let current = node;
	while (current !== null) {
		const match = /(?:^|_)HyperMD-list-line-(\d+)(?:_|$)/.exec(current.name);
		const rawLevel = match?.[1];
		if (rawLevel !== undefined) {
			return Number.parseInt(rawLevel, 10);
		}
		current = current.parent;
	}
	return null;
}

function hyperMdAncestors(
	state: EditorState,
	target: SupportedBullet,
	tree: Tree,
	targetLevel: number,
): readonly SupportedBullet[] {
	const entries: HyperMdOutlineEntry[] = [];
	for (let number = target.lineNumber - 1; number >= 1; number -= 1) {
		const line = state.doc.line(number);
		const firstContentOffset = /^[\t ]*/.exec(line.text)?.[0].length ?? 0;
		const position = Math.min(line.to, line.from + firstContentOffset);
		entries.push(
			Object.freeze({
				level: hyperMdListLevel(tree.resolveInner(position, 1)),
				bullet: findSupportedBullet(state, line.from),
				hasListMarker: ANY_LIST_MARKER_PATTERN.test(line.text),
				isOrdered: ORDERED_LIST_MARKER_PATTERN.test(line.text),
				nonBlank: line.text.trim().length > 0,
			}),
		);
	}
	return collectHyperMdAncestorBullets(entries, targetLevel);
}

function supportedBulletAncestors(
	state: EditorState,
	target: SupportedBullet,
): readonly SupportedBullet[] {
	const tree = completeSyntaxTreeCache.get(state) ?? syntaxTree(state);
	const markerNode = tree.resolveInner(target.markerFrom, 1);
	let node: SyntaxNode | null = markerNode;
	let foundOwnListItem = false;
	const ancestors: SupportedBullet[] = [];
	while (node !== null) {
		if (node.name === 'ListItem') {
			if (!foundOwnListItem) {
				foundOwnListItem = true;
			} else {
				const candidate = findSupportedBullet(state, node.from);
				if (candidate !== null && candidate.markerFrom !== target.markerFrom) {
					ancestors.push(candidate);
				}
			}
		}
		node = node.parent;
	}

	// Obsidian Live Preview may provide HyperMD line tokens without standard
	// ListItem ancestors. Keep the shared content-column fallback for that tree.
	if (foundOwnListItem) {
		return Object.freeze(ancestors);
	}
	const targetLevel = hyperMdListLevel(markerNode);
	return targetLevel === null
		? Object.freeze([])
		: hyperMdAncestors(state, target, tree, targetLevel);
}

function hasListItemAncestor(node: SyntaxNode): boolean {
	let current: SyntaxNode | null = node;
	while (current !== null) {
		if (current.name === 'ListItem') {
			return true;
		}
		current = current.parent;
	}
	return false;
}

function buildHyperMdOutline(state: EditorState, tree: Tree): readonly BulletOutlineNode[] {
	const roots: MutableBulletOutlineNode[] = [];
	let nodeCount = 0;
	let structuralEntryCount = 0;
	const stack: Array<{
		level: number;
		node: MutableBulletOutlineNode | null;
		isOrdered: boolean;
	}> = [];
	for (let number = 1; number <= state.doc.lines; number += 1) {
		const line = state.doc.line(number);
		const firstContentOffset = /^[\t ]*/.exec(line.text)?.[0].length ?? 0;
		const position = Math.min(line.to, line.from + firstContentOffset);
		if (line.text.trim().length === 0) {
			continue;
		}
		const level = hyperMdListLevel(tree.resolveInner(position, 1));
		if (level === null) {
			stack.length = 0;
			continue;
		}
		if (!ANY_LIST_MARKER_PATTERN.test(line.text)) {
			continue;
		}
		while (stack.length > 0 && stack.at(-1)!.level >= level) {
			stack.pop();
		}
		const isOrdered = ORDERED_LIST_MARKER_PATTERN.test(line.text);
		const isInsideOrderedList = stack.some(
			(parent) => parent.isOrdered && parent.level < level,
		);
		structuralEntryCount += 1;
		if (
			structuralEntryCount > MAX_OUTLINE_NODES ||
			stack.length + 1 > MAX_OUTLINE_DEPTH
		) {
			throw new BulletOutlineLimitError();
		}
		const bullet = findSupportedBullet(state, line.from);
		if (
			bullet === null ||
			(!state.facet(markerDetectionFacet).numbered &&
				(isOrdered || isInsideOrderedList))
		) {
			stack.push({ level, node: null, isOrdered });
			continue;
		}
		nodeCount += 1;
		if (nodeCount > MAX_OUTLINE_NODES) {
			throw new BulletOutlineLimitError();
		}
		const node: MutableBulletOutlineNode = {
			label: outlinePlainTextLabel(state, bullet, tree),
			anchor: bullet.markerFrom,
			children: [],
		};
		const parent = stack.at(-1)?.node;
		if (parent === undefined || parent === null) {
			roots.push(node);
		} else {
			parent.children.push(node);
		}
		stack.push({ level, node, isOrdered });
	}
	return freezeOutlineNodes(roots);
}

export interface OutlineHeading {
	readonly level: number;
	readonly label: string;
	readonly from: number;
}

const ATX_HEADING_PATTERN = /^(#{1,6})\s+(.*)$/;
const CODE_FENCE_PATTERN = /^\s{0,3}(?:```|~~~)/;

export function buildOutlineHeadings(
	state: EditorState,
): readonly OutlineHeading[] {
	const headings: OutlineHeading[] = [];
	const firstContentLine = frontmatterEndLine(state) + 1;
	let insideFence = false;
	for (
		let lineNumber = firstContentLine;
		lineNumber <= state.doc.lines;
		lineNumber += 1
	) {
		const line = state.doc.line(lineNumber);
		if (CODE_FENCE_PATTERN.test(line.text)) {
			insideFence = !insideFence;
			continue;
		}
		if (insideFence) {
			continue;
		}
		const match = ATX_HEADING_PATTERN.exec(line.text);
		if (match?.[1] !== undefined && match[2] !== undefined) {
			headings.push(
				Object.freeze({
					level: match[1].length,
					label: match[2].trim(),
					from: line.from,
				}),
			);
		}
	}
	return Object.freeze(headings);
}

export function buildBulletOutline(
	state: EditorState,
): readonly BulletOutlineNode[] {
	const frontmatterEnd = frontmatterEndLine(state);
	if (frontmatterEnd === state.doc.lines + 1) {
		return Object.freeze([]);
	}
	const completeTree = ensureSyntaxTree(state, state.doc.length, 50);
	if (completeTree === null) {
		throw new BulletOutlineParsePendingError();
	}
	completeSyntaxTreeCache.set(state, completeTree);
	let firstSupportedBullet: SupportedBullet | null = null;
	for (let lineNumber = 1; lineNumber <= state.doc.lines; lineNumber += 1) {
		const line = state.doc.line(lineNumber);
		firstSupportedBullet = findSupportedBullet(state, line.from);
		if (firstSupportedBullet !== null) {
			break;
		}
	}
	if (firstSupportedBullet === null) {
		return Object.freeze([]);
	}
	const firstMarkerNode = completeTree.resolveInner(
		firstSupportedBullet.markerFrom,
		1,
	);
	if (
		!hasListItemAncestor(firstMarkerNode) &&
		hyperMdListLevel(firstMarkerNode) !== null
	) {
		return buildHyperMdOutline(state, completeTree);
	}
	const roots: MutableBulletOutlineNode[] = [];
	const parentStack: Array<MutableBulletOutlineNode | null> = [];
	let nodeCount = 0;
	let structuralEntryCount = 0;
	completeTree.iterate({
		enter: (syntaxNode) => {
			if (syntaxNode.name !== 'ListItem') {
				return;
			}
			structuralEntryCount += 1;
			if (
				structuralEntryCount > MAX_OUTLINE_NODES ||
				parentStack.length + 1 > MAX_OUTLINE_DEPTH
			) {
				throw new BulletOutlineLimitError();
			}
			const bullet = findSupportedBullet(state, syntaxNode.from);
			if (bullet === null) {
				parentStack.push(null);
				return;
			}
			nodeCount += 1;
			if (nodeCount > MAX_OUTLINE_NODES) {
				throw new BulletOutlineLimitError();
			}
			const node: MutableBulletOutlineNode = {
				label: outlinePlainTextLabel(state, bullet, completeTree),
				anchor: bullet.markerFrom,
				children: [],
			};
			const parent = parentStack.at(-1);
			if (parent === undefined || parent === null) {
				roots.push(node);
			} else {
				parent.children.push(node);
			}
			parentStack.push(node);
		},
		leave: (syntaxNode) => {
			if (syntaxNode.name === 'ListItem') {
				parentStack.pop();
			}
		},
	});

	return freezeOutlineNodes(roots);
}

export type BranchMovePlacement = 'before' | 'after';

export function planBranchMove(
	state: EditorState,
	sourceAnchor: number,
	targetAnchor: number,
	placement: BranchMovePlacement,
): readonly ChangeSpec[] | null {
	const source = findSupportedBullet(state, sourceAnchor);
	const target = findSupportedBullet(state, targetAnchor);
	if (source === null || target === null) {
		return null;
	}
	const sourceBranch = computeBranchRange(state, sourceAnchor);
	const targetBranch = computeBranchRange(state, targetAnchor);
	if (sourceBranch === null || targetBranch === null) {
		return null;
	}
	if (
		target.lineFrom >= sourceBranch.from &&
		target.lineFrom <= sourceBranch.to
	) {
		return null;
	}

	const sourceIndentText = state.doc.sliceString(
		source.lineFrom,
		source.markerFrom,
	);
	const targetIndentText = state.doc.sliceString(
		target.lineFrom,
		target.markerFrom,
	);
	const rebased = state.doc
		.sliceString(sourceBranch.from, sourceBranch.to)
		.split('\n')
		.map((line) =>
			line.startsWith(sourceIndentText)
				? targetIndentText + line.slice(sourceIndentText.length)
				: targetIndentText + line,
		)
		.join('\n');

	let deleteFrom = sourceBranch.from;
	let deleteTo = sourceBranch.to;
	if (deleteTo < state.doc.length) {
		deleteTo += 1;
	} else if (deleteFrom > 0) {
		deleteFrom -= 1;
	}

	const insertion: ChangeSpec =
		placement === 'before'
			? { from: targetBranch.from, insert: `${rebased}\n` }
			: { from: targetBranch.to, insert: `\n${rebased}` };

	return Object.freeze([{ from: deleteFrom, to: deleteTo }, insertion]);
}

export interface BulletExtractPlan {
	readonly replaceFrom: number;
	readonly replaceTo: number;
	readonly linkIndentText: string;
	readonly fileContent: string;
}

function minimalCommonIndent(lines: readonly string[]): string {
	let common: string | null = null;
	for (const line of lines) {
		if (line.trim().length === 0) {
			continue;
		}
		const indent = /^[\t ]*/.exec(line)?.[0] ?? '';
		if (common === null) {
			common = indent;
			continue;
		}
		let index = 0;
		while (
			index < common.length &&
			index < indent.length &&
			common[index] === indent[index]
		) {
			index += 1;
		}
		common = common.slice(0, index);
	}
	return common ?? '';
}

export function planBulletRemovalRange(
	state: EditorState,
	replaceFrom: number,
	replaceTo: number,
): Readonly<{ from: number; to: number }> {
	if (replaceTo < state.doc.length) {
		return Object.freeze({ from: replaceFrom, to: replaceTo + 1 });
	}
	if (replaceFrom > 0) {
		return Object.freeze({ from: replaceFrom - 1, to: replaceTo });
	}
	return Object.freeze({ from: replaceFrom, to: replaceTo });
}

export function suggestExtractFileName(label: string): string {
	return label
		.replace(/!?\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target, alias) =>
			typeof alias === 'string' && alias.length > 0 ? alias : String(target),
		)
		.replace(/!?\[([^\]]*)\]\([^)]*\)/g, (_match, text) => String(text))
		.replace(/[\\/:*?"<>|#^[\]]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

const HEADING_LINE_PATTERN = /^#{1,6}\s/;

export function scanStrayRange(
	state: EditorState,
	anchor: number,
): Readonly<{ from: number; to: number }> | null {
	const bullet = findSupportedBullet(state, anchor);
	const branch = computeBranchRange(state, anchor);
	if (bullet === null || branch === null) {
		return null;
	}
	const branchLastLine = state.doc.lineAt(branch.to).number;
	let strayLastLine: number | null = null;
	for (
		let lineNumber = branchLastLine + 1;
		lineNumber <= state.doc.lines;
		lineNumber += 1
	) {
		const line = state.doc.line(lineNumber);
		const text = line.text;
		if (CODE_FENCE_PATTERN.test(text) || HEADING_LINE_PATTERN.test(text.trimStart())) {
			break;
		}
		if (text.trim().length === 0) {
			continue;
		}
		const candidate = findSupportedBullet(state, line.from);
		if (candidate !== null && candidate.indent <= bullet.indent) {
			break;
		}
		strayLastLine = lineNumber;
	}
	if (strayLastLine === null) {
		return null;
	}
	return Object.freeze({
		from: state.doc.line(branchLastLine + 1).from,
		to: state.doc.line(strayLastLine).to,
	});
}

const LIST_MARKER_CAPTURE = /^([\t ]*)((?:[-+*]|\d+[.)])[\t ]+)/;

function childIndentOfListLine(
	state: EditorState,
	text: string,
): string | null {
	const match = LIST_MARKER_CAPTURE.exec(text);
	if (match?.[1] === undefined || match[2] === undefined) {
		return null;
	}
	const ownColumn = countColumn(match[1], state.tabSize);
	const contentColumn = countColumn(match[1] + match[2], state.tabSize);
	return indentString(
		state,
		Math.max(contentColumn, ownColumn + getIndentUnit(state)),
	);
}

export function planFocusStructureRepair(
	state: EditorState,
	anchor: number,
	visibleTo: number,
): Readonly<{ from: number; to: number; insert: string }> | null {
	const bullet = findSupportedBullet(state, anchor);
	if (bullet === null) {
		return null;
	}
	const regionEnd = Math.min(
		Math.max(visibleTo, bullet.lineTo),
		state.doc.length,
	);
	const firstLineNumber = bullet.lineNumber + 1;
	const lastLineNumber = state.doc.lineAt(regionEnd).number;
	if (firstLineNumber > lastLineNumber) {
		return null;
	}
	const repairedLines: string[] = [];
	let changed = false;
	let stoppedAtLineNumber: number | null = null;
	let baseIndent = childIndentText(state, bullet);
	let runIndent: string | null = null;
	for (
		let lineNumber = firstLineNumber;
		lineNumber <= lastLineNumber;
		lineNumber += 1
	) {
		const text = state.doc.line(lineNumber).text;
		if (CODE_FENCE_PATTERN.test(text)) {
			stoppedAtLineNumber = lineNumber;
			break;
		}
		if (text.trim().length === 0) {
			changed = true;
			continue;
		}
		const leading = /^[\t ]*/.exec(text)?.[0] ?? '';
		const column = countColumn(leading, state.tabSize);
		const isListItem = ANY_LIST_MARKER_PATTERN.test(text);
		if (isListItem && column > bullet.indent) {
			repairedLines.push(text);
			baseIndent = childIndentOfListLine(state, text) ?? baseIndent;
			runIndent = null;
			continue;
		}
		const indent: string = runIndent ?? baseIndent;
		runIndent = indent;
		const body = text.slice(leading.length);
		const repaired = isListItem ? `${indent}${body}` : `${indent}- ${body}`;
		repairedLines.push(repaired);
		if (repaired !== text) {
			changed = true;
		}
	}
	if (!changed || repairedLines.length === 0) {
		return null;
	}
	const lastRepairedLine =
		stoppedAtLineNumber === null ? lastLineNumber : stoppedAtLineNumber - 1;
	return Object.freeze({
		from: state.doc.line(firstLineNumber).from,
		to: state.doc.line(lastRepairedLine).to,
		insert: repairedLines.join('\n'),
	});
}

export function planEditedListRepair(
	state: EditorState,
	changedFrom: number,
	changedTo: number,
): Readonly<{ from: number; to: number; insert: string }> | null {
	const docLength = state.doc.length;
	const startLine = state.doc.lineAt(Math.min(Math.max(changedFrom, 0), docLength));
	const endLine = state.doc.lineAt(Math.min(Math.max(changedTo, 0), docLength));

	let anchorLineNumber: number | null = null;
	for (
		let lineNumber = startLine.number;
		lineNumber >= 1;
		lineNumber -= 1
	) {
		const text = state.doc.line(lineNumber).text;
		if (text.trim().length === 0) {
			continue;
		}
		if (ANY_LIST_MARKER_PATTERN.test(text)) {
			anchorLineNumber = lineNumber;
			break;
		}
		if (lineNumber === startLine.number) {
			// The edited line itself is newly dictated text; keep looking upward.
			continue;
		}
		break;
	}
	if (anchorLineNumber === null || anchorLineNumber >= endLine.number) {
		return null;
	}

	const firstLineNumber = anchorLineNumber + 1;
	const lastLineNumber = endLine.number;
	let baseIndent =
		childIndentOfListLine(state, state.doc.line(anchorLineNumber).text) ??
		indentString(state, getIndentUnit(state));
	let runIndent: string | null = null;
	const entries: Array<{ text: string; blank: boolean; converted: boolean }> = [];
	let stoppedAtLineNumber: number | null = null;
	for (
		let lineNumber = firstLineNumber;
		lineNumber <= lastLineNumber;
		lineNumber += 1
	) {
		const text = state.doc.line(lineNumber).text;
		if (CODE_FENCE_PATTERN.test(text)) {
			stoppedAtLineNumber = lineNumber;
			break;
		}
		if (text.trim().length === 0) {
			entries.push({ text, blank: true, converted: false });
			continue;
		}
		if (ANY_LIST_MARKER_PATTERN.test(text)) {
			entries.push({ text, blank: false, converted: false });
			baseIndent = childIndentOfListLine(state, text) ?? baseIndent;
			runIndent = null;
			continue;
		}
		const indent: string = runIndent ?? baseIndent;
		runIndent = indent;
		const leading = /^[\t ]*/.exec(text)?.[0] ?? '';
		entries.push({
			text: `${indent}- ${text.slice(leading.length)}`,
			blank: false,
			converted: true,
		});
	}

	const firstConverted = entries.findIndex((entry) => entry.converted);
	if (firstConverted === -1) {
		return null;
	}
	let lastConverted = firstConverted;
	for (const [index, entry] of entries.entries()) {
		if (entry.converted) {
			lastConverted = index;
		}
	}
	const repairedLines = entries
		.filter(
			(entry, index) =>
				!(entry.blank && index > firstConverted && index < lastConverted),
		)
		.map((entry) => entry.text);
	const lastRepairedLine =
		stoppedAtLineNumber === null ? lastLineNumber : stoppedAtLineNumber - 1;
	const from = state.doc.line(firstLineNumber).from;
	const to = state.doc.line(lastRepairedLine).to;
	const insert = repairedLines.join('\n');
	if (insert === state.doc.sliceString(from, to)) {
		return null;
	}
	return Object.freeze({ from, to, insert });
}

export function planBulletExtract(
	state: EditorState,
	anchor: number,
	removeTopBullet: boolean,
): BulletExtractPlan | null {
	const bullet = findSupportedBullet(state, anchor);
	if (bullet === null) {
		return null;
	}
	const branch = computeBranchRange(state, anchor);
	if (branch === null) {
		return null;
	}
	const linkIndentText = state.doc.sliceString(
		bullet.lineFrom,
		bullet.markerFrom,
	);
	const branchLines = state.doc
		.sliceString(branch.from, branch.to)
		.split('\n');
	let fileContent: string;
	if (removeTopBullet) {
		const childLines = branchLines.slice(1);
		if (childLines.length === 0) {
			fileContent = bullet.label;
		} else {
			const common = minimalCommonIndent(childLines);
			fileContent = childLines
				.map((line) =>
					line.startsWith(common) ? line.slice(common.length) : line.trimStart(),
				)
				.join('\n');
		}
	} else {
		fileContent = branchLines
			.map((line) =>
				line.startsWith(linkIndentText)
					? line.slice(linkIndentText.length)
					: line.trimStart(),
			)
			.join('\n');
	}
	return Object.freeze({
		replaceFrom: branch.from,
		replaceTo: branch.to,
		linkIndentText,
		fileContent,
	});
}

export function buildBreadcrumbs(
	state: EditorState,
	position: number,
	noteTitle: string,
): readonly Breadcrumb[] | null {
	const target = findSupportedBullet(state, position);
	if (target === null) {
		return null;
	}
	const targetTree = ensureSyntaxTree(state, target.lineTo, 50);
	if (targetTree !== null && targetTree.length >= state.doc.length) {
		completeSyntaxTreeCache.set(state, targetTree);
	}
	const labelTree =
		completeSyntaxTreeCache.get(state) ?? targetTree ?? syntaxTree(state);

	const reversedAncestors = supportedBulletAncestors(state, target);

	const breadcrumbs: Breadcrumb[] = [
		Object.freeze({
			label: noteTitle.length === 0 ? 'Untitled note' : noteTitle,
			anchor: null,
		}),
	];
	for (const ancestor of [...reversedAncestors].reverse()) {
		breadcrumbs.push(
			Object.freeze({
				label: outlinePlainTextLabel(state, ancestor, labelTree),
				anchor: ancestor.lineFrom,
			}),
		);
	}
	breadcrumbs.push(
		Object.freeze({
			label: outlinePlainTextLabel(state, target, labelTree),
			anchor: target.lineFrom,
		}),
	);

	return Object.freeze(breadcrumbs);
}
