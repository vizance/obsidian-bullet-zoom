import { EditorState } from '@codemirror/state';
import { describe, expect, it } from 'vitest';

import {
	createHeadingUnwrapExtension,
	planHeadingUnwraps,
} from '../src/heading-unwrap';

function createState(doc: string, enabled = true): EditorState {
	return EditorState.create({
		doc,
		extensions: [createHeadingUnwrapExtension(() => enabled)],
	});
}

describe('planHeadingUnwraps', () => {
	it('drops the marker of a top-level list item holding a heading', () => {
		const state = createState('- # Outline\n- keep');
		expect(planHeadingUnwraps(state.doc, [1, 2])).toEqual([
			{ from: 0, to: 2, insert: '' },
		]);
	});

	it('ignores indented items and ordinary bullets', () => {
		const state = createState('\t- # Outline\n- plain\n1. # Numbered');
		expect(planHeadingUnwraps(state.doc, [1, 2])).toEqual([]);
		expect(planHeadingUnwraps(state.doc, [3])).toHaveLength(1);
	});

	it('ignores a hash without a space', () => {
		const state = createState('- #tag');
		expect(planHeadingUnwraps(state.doc, [1])).toEqual([]);
	});
});

describe('createHeadingUnwrapExtension', () => {
	function type(doc: string, at: number, insert: string, enabled = true) {
		const state = createState(doc, enabled);
		return state.update({ changes: { from: at, insert } }).state.doc.toString();
	}

	it('removes the marker as the heading is typed', () => {
		expect(type('- #Outline', 3, ' ')).toBe('# Outline');
	});

	it('cleans a list continuation that swallowed a heading', () => {
		expect(type('- Topic\n- ', 10, '# Outline')).toBe('- Topic\n# Outline');
	});

	it('leaves untouched lines alone', () => {
		expect(type('- # Kept\n- Topic', 16, '!')).toBe('- # Kept\n- Topic!');
	});

	it('does nothing when the guard is off', () => {
		expect(type('- Topic\n- ', 10, '# Outline', false)).toBe(
			'- Topic\n- # Outline',
		);
	});

	it('keeps the fix in the same transaction so one undo reverts both', () => {
		const state = createState('- Topic\n- ');
		const update = state.update({ changes: { from: 10, insert: '# Outline' } });
		expect(update.state.doc.toString()).toBe('- Topic\n# Outline');
	});
});
