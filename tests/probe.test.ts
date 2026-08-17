import { markdown } from '@codemirror/lang-markdown';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { describe, expect, it } from 'vitest';
import {
	createFocusExtension,
	enterFocusAt,
	focusFilePath,
	focusLivePreview,
	focusNoteTitle,
	getFocusSession,
} from '../src/focus-extension';

describe('probe real order', () => {
	it('focus first, then insert stray text', () => {
		const parent = document.createElement('div');
		document.body.append(parent);
		const view = new EditorView({
			parent,
			state: EditorState.create({
				doc: '- Topic\n  - A\n- Later\n  - B',
				extensions: [
					markdown(),
					focusFilePath.of('Ideas.md'),
					focusNoteTitle.of('Ideas'),
					focusLivePreview.of(true),
					createFocusExtension({ isPhone: false, isMobile: false }),
				],
			}),
		});
		enterFocusAt(view, 0);
		const branchEnd = getFocusSession(view.state)?.branch.to ?? 0;
		console.log('branch end before insert:', branchEnd);
		view.dispatch({ changes: { from: branchEnd, insert: '\n\ndictated text' } });
		const session = getFocusSession(view.state);
		console.log('doc:', JSON.stringify(view.state.doc.toString()));
		console.log('session branch:', JSON.stringify(session?.branch));
		const ranges: Array<{from:number;to:number}> = [];
		for (const source of view.state.facet(EditorView.decorations)) {
			if (typeof source === 'function') continue;
			const it2 = source.iter();
			while (it2.value !== null) { if (it2.from !== it2.to) ranges.push({from: it2.from, to: it2.to}); it2.next(); }
		}
		console.log('decoration ranges:', JSON.stringify(ranges));
		const strayLine = view.state.doc.line(4);
		console.log('stray line:', strayLine.number, strayLine.from, strayLine.to, JSON.stringify(strayLine.text));
		expect(true).toBe(true);
		view.destroy(); parent.remove();
	});
});
