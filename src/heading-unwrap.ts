import { Annotation, EditorState, type Extension } from '@codemirror/state';

/** A top-level list item whose content is a heading, e.g. `- # Outline`. */
export const LIST_HEADING_LINE_PATTERN =
	/^((?:[-+*]|\d+[.)])[\t ]+)(#{1,6}[\t ].*)$/;

const headingUnwrapAnnotation = Annotation.define<boolean>();

export type HeadingUnwrapChange = Readonly<{
	from: number;
	to: number;
	insert: string;
}>;

export function planHeadingUnwraps(
	doc: { line: (n: number) => { from: number; text: string } },
	lineNumbers: Iterable<number>,
): readonly HeadingUnwrapChange[] {
	const changes: HeadingUnwrapChange[] = [];
	for (const lineNumber of lineNumbers) {
		const line = doc.line(lineNumber);
		const match = LIST_HEADING_LINE_PATTERN.exec(line.text);
		const marker = match?.[1];
		if (marker === undefined) {
			continue;
		}
		changes.push(
			Object.freeze({
				from: line.from,
				to: line.from + marker.length,
				insert: '',
			}),
		);
	}
	return Object.freeze(changes.sort((left, right) => left.from - right.from));
}

/**
 * Pressing Enter inside a list makes the editor start the next item, so a
 * heading typed there lands after the marker and stops being a heading. This
 * removes the marker as part of the same transaction, which keeps it to one
 * undo step and works whether or not a focus session is active.
 */
export function createHeadingUnwrapExtension(
	isEnabled: () => boolean,
): Extension {
	return EditorState.transactionFilter.of((transaction) => {
		if (
			!transaction.docChanged ||
			transaction.annotation(headingUnwrapAnnotation) === true ||
			!isEnabled()
		) {
			return transaction;
		}
		const lineNumbers = new Set<number>();
		transaction.changes.iterChangedRanges((_fromA, _toA, fromB, toB) => {
			const first = transaction.newDoc.lineAt(fromB).number;
			const last = transaction.newDoc.lineAt(toB).number;
			for (let line = first; line <= last; line += 1) {
				lineNumbers.add(line);
			}
		});
		const changes = planHeadingUnwraps(transaction.newDoc, lineNumbers);
		if (changes.length === 0) {
			return transaction;
		}
		return [
			transaction,
			{
				changes,
				sequential: true,
				annotations: headingUnwrapAnnotation.of(true),
			},
		];
	});
}
