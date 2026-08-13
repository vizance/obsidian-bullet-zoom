import type { Editor } from 'obsidian';
import {
	editorInfoField,
	editorLivePreviewField,
	Notice,
	Platform,
	Plugin,
} from 'obsidian';
import { EditorView } from '@codemirror/view';

import {
	EXIT_FOCUS_COMMAND,
	PARENT_FOCUS_COMMAND,
} from './command-definitions';
import {
	createFocusExtension,
	focusFilePath,
	focusLivePreview,
	focusNoteTitle,
	resolveCodeMirrorView,
	runExitCommand,
	runFocusCommand,
	runParentCommand,
} from './focus-extension';

type EditorWithCodeMirror = Editor & { cm?: unknown };

export function getEditorView(editor: Editor): EditorView | null {
	return resolveCodeMirrorView((editor as EditorWithCodeMirror).cm);
}

function showNotice(message: string): void {
	new Notice(message);
}

export default class BulletZoomPlugin extends Plugin {
	onload(): void {
		this.registerEditorExtension([
			focusFilePath.compute([editorInfoField], (state) =>
				state.field(editorInfoField, false)?.file?.path ?? null,
			),
			focusNoteTitle.compute([editorInfoField], (state) =>
				state.field(editorInfoField, false)?.file?.basename ?? '未命名筆記',
			),
			focusLivePreview.compute([editorLivePreviewField], (state) =>
				state.field(editorLivePreviewField, false) ?? false,
			),
			createFocusExtension({
				isPhone: Platform.isPhone,
				isMobile: Platform.isMobile,
			}),
		]);

		this.addCommand({
			id: 'bullet-zoom-focus-current',
			name: '聚焦目前的 Bullet Point',
			editorCallback: (editor) => {
				runFocusCommand(getEditorView(editor), showNotice);
			},
		});

		this.addCommand({
			...EXIT_FOCUS_COMMAND,
			editorCallback: (editor) => {
				runExitCommand(getEditorView(editor), showNotice);
			},
		});

		this.addCommand({
			...PARENT_FOCUS_COMMAND,
			editorCallback: (editor) => {
				runParentCommand(getEditorView(editor), showNotice);
			},
		});
	}
}
