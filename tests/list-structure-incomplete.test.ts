import { markdown } from '@codemirror/lang-markdown';
import { EditorState } from '@codemirror/state';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@codemirror/language', async (importOriginal) => {
	const original = await importOriginal<typeof import('@codemirror/language')>();
	return {
		...original,
		ensureSyntaxTree: vi.fn(() => null),
	};
});

import { planAppendChildInsertion } from '../src/list-structure';

describe('planAppendChildInsertion with an incomplete syntax tree', () => {
	it('fails closed without changing the document', () => {
		const state = EditorState.create({
			doc: '- Parent',
			extensions: [markdown()],
		});

		expect(planAppendChildInsertion(state, 0)).toEqual({
			status: 'unsafe',
			reason: 'incomplete-syntax',
		});
		expect(state.doc.toString()).toBe('- Parent');
	});
});
