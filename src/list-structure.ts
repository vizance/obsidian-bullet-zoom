import { syntaxTree } from '@codemirror/language';
import { countColumn, EditorState } from '@codemirror/state';
import type { SyntaxNode } from '@lezer/common';

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

const PLAIN_BULLET_PATTERN = /^([\t ]*)([-+*])([\t ]+)(.*)$/;
const TASK_PATTERN = /^\[(?: |x|X)\](?:\s|$)/;

function isInsideFrontmatter(state: EditorState, lineNumber: number): boolean {
	if (lineNumber <= 1 || state.doc.lines < 2) {
		return false;
	}

	if (state.doc.line(1).text.trim() !== '---') {
		return false;
	}

	for (let number = 2; number <= state.doc.lines; number += 1) {
		const text = state.doc.line(number).text.trim();
		if (text === '---' || text === '...') {
			return lineNumber < number;
		}
		if (number >= lineNumber) {
			return true;
		}
	}

	return true;
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
	const node = syntaxTree(state).resolveInner(markerFrom, 1);
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

export function buildBreadcrumbs(
	state: EditorState,
	position: number,
	noteTitle: string,
): readonly Breadcrumb[] | null {
	const target = findSupportedBullet(state, position);
	if (target === null) {
		return null;
	}

	const reversedAncestors: SupportedBullet[] = [];
	let currentIndent = target.indent;
	for (let number = target.lineNumber - 1; number >= 1; number -= 1) {
		const line = state.doc.line(number);
		const candidate = findSupportedBullet(state, line.from);
		if (candidate === null || candidate.indent >= currentIndent) {
			continue;
		}
		reversedAncestors.push(candidate);
		currentIndent = candidate.indent;
		if (currentIndent === 0) {
			break;
		}
	}

	const breadcrumbs: Breadcrumb[] = [
		Object.freeze({
			label: noteTitle.length === 0 ? '未命名筆記' : noteTitle,
			anchor: null,
		}),
	];
	for (const ancestor of reversedAncestors.reverse()) {
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
