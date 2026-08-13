import type { Editor } from 'obsidian';
import {
	editorInfoField,
	editorLivePreviewField,
	MarkdownView,
	Notice,
	Platform,
	Plugin,
	type WorkspaceLeaf,
} from 'obsidian';
import { EditorView } from '@codemirror/view';

import {
	EXIT_FOCUS_COMMAND,
	PARENT_FOCUS_COMMAND,
} from './command-definitions';
import {
	createFocusExtension,
	enterFocusAt,
	exitFocus,
	focusFilePath,
	focusLivePreview,
	focusNoteTitle,
	getFocusSession,
	resolveCodeMirrorView,
	runExitCommand,
	runFocusCommand,
	runParentCommand,
	setRowControlsAlwaysVisibleForViews,
} from './focus-extension';
import { findSupportedBullet } from './list-structure';
import {
	BULLET_OUTLINE_VIEW_TYPE,
	BulletOutlineSidebarCoordinator,
	BulletOutlineSidebarView,
} from './outline-sidebar-view';
import {
	BulletZoomSettingTab,
	DEFAULT_SETTINGS,
	parseBulletZoomSettings,
	persistAlwaysShowRowControls,
	type BulletZoomSettings,
} from './settings';

type EditorWithCodeMirror = Editor & { cm?: unknown };

export function getEditorView(editor: Editor): EditorView | null {
	return resolveCodeMirrorView((editor as EditorWithCodeMirror).cm);
}

function showNotice(message: string): void {
	new Notice(message);
}

function showOutlineOpenFailure(): void {
	showNotice('無法開啟 Bullet 大綱，請稍後再試。');
}

function showOutlineActionFailure(): void {
	showNotice('無法切換 Bullet，請稍後再試。');
}

export default class BulletZoomPlugin extends Plugin {
	private outlineCoordinator: BulletOutlineSidebarCoordinator | null = null;
	private bulletZoomSettings: BulletZoomSettings = DEFAULT_SETTINGS;

	async onload(): Promise<void> {
		this.bulletZoomSettings = parseBulletZoomSettings(await this.loadData());
		const outlineCoordinator = new BulletOutlineSidebarCoordinator({
			workspace: this.app.workspace,
			isMobile: Platform.isMobile,
			resolveEditorView: (leaf) => this.resolveLeafEditor(leaf),
			isEditorEligible: (view) =>
				view.state.facet(focusLivePreview) &&
				view.state.facet(focusFilePath) !== null,
			getFilePath: (view) => view.state.facet(focusFilePath),
			getNoteTitle: (view) => view.state.facet(focusNoteTitle),
			getFocusAnchor: (view) => getFocusSession(view.state)?.anchor ?? null,
			getCurrentAnchor: (view) =>
				findSupportedBullet(view.state, view.state.selection.main.head)
					?.markerFrom ??
				getFocusSession(view.state)?.anchor ??
				null,
			onFocus: (view, anchor) => enterFocusAt(view, anchor, true),
			onExit: (view) => exitFocus(view),
			onUnexpectedError: showOutlineActionFailure,
		});
		this.outlineCoordinator = outlineCoordinator;
		this.registerView(
			BULLET_OUTLINE_VIEW_TYPE,
			(leaf) => new BulletOutlineSidebarView(leaf, outlineCoordinator),
		);
		outlineCoordinator.start();
		this.addSettingTab(
			new BulletZoomSettingTab(this, {
				getSettings: () => this.bulletZoomSettings,
				setAlwaysShowRowControls: (value) =>
					this.setAlwaysShowRowControls(value),
			}),
		);

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
				alwaysShowRowControls:
					this.bulletZoomSettings.alwaysShowRowControls,
				onEditorReady: (view) => outlineCoordinator.notifyEditorReady(view),
				onEditorUpdate: (update) =>
					outlineCoordinator.notifyEditorUpdate(update),
				onEditorDestroy: (view) =>
					outlineCoordinator.notifyEditorDestroyed(view),
			}),
		]);

		this.addCommand({
			id: 'open-outline',
			name: '開啟 Bullet 大綱',
			callback: () => {
				void outlineCoordinator
					.openCurrent()
					.then((result) => {
						if (result === 'failed') {
							showOutlineOpenFailure();
						}
					})
					.catch(showOutlineOpenFailure);
			},
		});
		this.addRibbonIcon('list-tree', '開啟 Bullet 大綱', () => {
			void outlineCoordinator
				.openCurrent()
				.then((result) => {
					if (result === 'failed') {
						showOutlineOpenFailure();
					}
				})
				.catch(showOutlineOpenFailure);
		});

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

	onunload(): void {
		this.outlineCoordinator?.destroy();
		this.outlineCoordinator = null;
	}

	private resolveLeafEditor(leaf: WorkspaceLeaf): EditorView | null {
		if (!(leaf.view instanceof MarkdownView) || leaf.view.getMode() !== 'source') {
			return null;
		}
		return getEditorView(leaf.view.editor);
	}

	private async setAlwaysShowRowControls(value: boolean): Promise<boolean> {
		return persistAlwaysShowRowControls(value, {
			save: (settings) => this.saveData(settings),
			onFailure: () =>
				showNotice('無法儲存 Bullet Zoom 設定，請稍後再試。'),
			onSaved: (settings) => {
				this.bulletZoomSettings = settings;
				const editorViews: Array<EditorView | null> = [];
				this.app.workspace.iterateAllLeaves((leaf) => {
					editorViews.push(this.resolveLeafEditor(leaf));
				});
				setRowControlsAlwaysVisibleForViews(editorViews, value);
			},
		});
	}
}
