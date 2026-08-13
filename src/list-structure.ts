import { ensureSyntaxTree, syntaxTree } from '@codemirror/language';
import { countColumn, EditorState } from '@codemirror/state';
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

export type BulletOutlineNode = Readonly<{
	label: string;
	anchor: number;
	children: readonly BulletOutlineNode[];
}>;

export class BulletOutlineParsePendingError extends Error {
	constructor() {
		super('The Markdown syntax tree is not ready for a complete outline.');
		this.name = 'BulletOutlineParsePendingError';
	}
}

const PLAIN_BULLET_PATTERN = /^([\t ]*)([-+*])([\t ]+)(.*)$/;
const ANY_LIST_MARKER_PATTERN = /^[\t ]*(?:[-+*]|\d+[.)])[\t ]+/;
const TASK_PATTERN = /^\[(?: |x|X)\](?:\s|$)/;
const frontmatterEndLineCache = new WeakMap<EditorState, number>();
const completeSyntaxTreeCache = new WeakMap<EditorState, Tree>();

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
): boolean {
	if (node.from !== markerFrom) {
		return false;
	}

	const syntaxTokens = node.name.split('_');
	if (syntaxTokens.includes('formatting-list-ul')) {
		if (node.to < markerTo) {
			return false;
		}
		const parentTokens = node.parent?.name.split('_') ?? [];
		return parentTokens.includes('HyperMD-list-line');
	}

	if (node.name !== 'ListMark' || node.to !== markerTo) {
		return false;
	}

	let current: SyntaxNode | null = node;
	while (current !== null) {
		if (current.name === 'OrderedList') {
			return false;
		}
		if (current.name === 'BulletList') {
			return true;
		}
		current = current.parent;
	}

	return false;
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
	return isSupportedBulletSyntaxNode(node, markerFrom, markerTo);
}

export function findSupportedBullet(
	state: EditorState,
	position: number,
): SupportedBullet | null {
	const safePosition = Math.max(0, Math.min(position, state.doc.length));
	const line = state.doc.lineAt(safePosition);
	const match = PLAIN_BULLET_PATTERN.exec(line.text);

	if (match === null || isInsideFrontmatter(state, line.number)) {
		return null;
	}

	const indentText = match[1];
	const spacing = match[3];
	const content = match[4];
	if (indentText === undefined || spacing === undefined || content === undefined) {
		return null;
	}
	if (TASK_PATTERN.test(content)) {
		return null;
	}

	const markerFrom = line.from + indentText.length;
	const markerTo = markerFrom + 1;
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

export function displayBulletLabel(label: string): string {
	return label.length === 0 ? '（空白節點）' : label;
}

type MutableBulletOutlineNode = {
	label: string;
	anchor: number;
	children: MutableBulletOutlineNode[];
};

function freezeOutlineNode(node: MutableBulletOutlineNode): BulletOutlineNode {
	return Object.freeze({
		label: node.label,
		anchor: node.anchor,
		children: Object.freeze(node.children.map(freezeOutlineNode)),
	});
}

export type HyperMdOutlineEntry = Readonly<{
	level: number | null;
	bullet: SupportedBullet | null;
	hasListMarker: boolean;
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
): readonly BulletOutlineNode[] {
	const roots: MutableBulletOutlineNode[] = [];
	const stack: Array<{
		level: number;
		node: MutableBulletOutlineNode | null;
	}> = [];
	for (const entry of entries) {
		if (!entry.nonBlank) {
			continue;
		}
		if (entry.level === null) {
			stack.length = 0;
			continue;
		}
		if (!entry.hasListMarker) {
			continue;
		}
		while (stack.length > 0 && stack.at(-1)!.level >= entry.level) {
			stack.pop();
		}
		if (entry.bullet === null) {
			stack.push({ level: entry.level, node: null });
			continue;
		}
		const node: MutableBulletOutlineNode = {
			label: displayBulletLabel(entry.bullet.label),
			anchor: entry.bullet.markerFrom,
			children: [],
		};
		const parent = stack.at(-1)?.node;
		if (parent === undefined || parent === null) {
			roots.push(node);
		} else {
			parent.children.push(node);
		}
		stack.push({ level: entry.level, node });
	}
	return Object.freeze(roots.map(freezeOutlineNode));
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
	const entries: HyperMdOutlineEntry[] = [];
	for (let number = 1; number <= state.doc.lines; number += 1) {
		const line = state.doc.line(number);
		const firstContentOffset = /^[\t ]*/.exec(line.text)?.[0].length ?? 0;
		const position = Math.min(line.to, line.from + firstContentOffset);
		entries.push(
			Object.freeze({
				level: hyperMdListLevel(tree.resolveInner(position, 1)),
				bullet: findSupportedBullet(state, line.from),
				hasListMarker: ANY_LIST_MARKER_PATTERN.test(line.text),
				nonBlank: line.text.trim().length > 0,
			}),
		);
	}
	return buildHyperMdBulletOutline(entries);
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
	const nodesByAnchor = new Map<number, MutableBulletOutlineNode>();

	for (let lineNumber = 1; lineNumber <= state.doc.lines; lineNumber += 1) {
		const line = state.doc.line(lineNumber);
		const bullet = findSupportedBullet(state, line.from);
		if (bullet === null) {
			continue;
		}

		const node: MutableBulletOutlineNode = {
			label: displayBulletLabel(bullet.label),
			anchor: bullet.markerFrom,
			children: [],
		};
		const parent = supportedBulletAncestors(state, bullet)
			.map(({ markerFrom }) => nodesByAnchor.get(markerFrom))
			.find((candidate) => candidate !== undefined);
		if (parent === undefined) {
			roots.push(node);
		} else {
			parent.children.push(node);
		}
		nodesByAnchor.set(bullet.markerFrom, node);
	}

	return Object.freeze(roots.map(freezeOutlineNode));
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

	const reversedAncestors = supportedBulletAncestors(state, target);

	const breadcrumbs: Breadcrumb[] = [
		Object.freeze({
			label: noteTitle.length === 0 ? '未命名筆記' : noteTitle,
			anchor: null,
		}),
	];
	for (const ancestor of [...reversedAncestors].reverse()) {
		breadcrumbs.push(
			Object.freeze({
				label: displayBulletLabel(ancestor.label),
				anchor: ancestor.lineFrom,
			}),
		);
	}
	breadcrumbs.push(
		Object.freeze({
			label: displayBulletLabel(target.label),
			anchor: target.lineFrom,
		}),
	);

	return Object.freeze(breadcrumbs);
}
