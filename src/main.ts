import type { Editor } from 'obsidian';
import {
	editorInfoField,
	editorLivePreviewField,
	MarkdownView,
	Notice,
	Platform,
	Plugin,
	PluginSettingTab,
	Setting,
	type App,
	type WorkspaceLeaf,
} from 'obsidian';
import { EditorView } from '@codemirror/view';
import type { Extension } from '@codemirror/state';

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
} from './focus-extension';
import { findSupportedBullet } from './list-structure';
import {
	BULLET_OUTLINE_VIEW_TYPE,
	BulletOutlineSidebarCoordinator,
	BulletOutlineSidebarView,
} from './outline-sidebar-view';
import {
	applyScaleVariables,
	clearScaleVariables,
	DEFAULT_SETTINGS,
	normalizeSettings,
	SCALE_MAX,
	SCALE_MIN,
	SCALE_STEP,
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

class BulletZoomSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private readonly plugin: BulletZoomPlugin,
	) {
		super(app, plugin);
	}

	display(): void {
		this.containerEl.empty();
		new Setting(this.containerEl)
			.setName('Zoom 一般 Bullet')
			.setDesc('偵測 - 開頭的無序清單項目，點圓點即可 Zoom。')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.zoomBullets)
					.onChange((value) => {
						void this.plugin.updateSettings({ zoomBullets: value });
					}),
			);
		new Setting(this.containerEl)
			.setName('Zoom 編號清單')
			.setDesc('偵測 1.、2) 這類編號清單項目，讓編號也能 Zoom 並進入大綱。')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.zoomNumbered)
					.onChange((value) => {
						void this.plugin.updateSettings({ zoomNumbered: value });
					}),
			);
		new Setting(this.containerEl)
			.setName('聚焦頁標題大小')
			.setDesc('Zoom 進 Bullet 後，頁面標題的字級縮放比例（%）。')
			.addSlider((slider) =>
				slider
					.setLimits(SCALE_MIN, SCALE_MAX, SCALE_STEP)
					.setValue(this.plugin.settings.titleScale)
					.setDynamicTooltip()
					.onChange((value) => {
						void this.plugin.updateSettings({ titleScale: value });
					}),
			)
			.addExtraButton((button) =>
				button
					.setIcon('rotate-ccw')
					.setTooltip('恢復預設 100%')
					.onClick(() => {
						void this.plugin
							.updateSettings({ titleScale: 100 })
							.then(() => this.display());
					}),
			);
		new Setting(this.containerEl)
			.setName('Bullet 大綱文字大小')
			.setDesc('Bullet 大綱清單的字級縮放比例（%），調小可一次看到更多文字。')
			.addSlider((slider) =>
				slider
					.setLimits(SCALE_MIN, SCALE_MAX, SCALE_STEP)
					.setValue(this.plugin.settings.outlineScale)
					.setDynamicTooltip()
					.onChange((value) => {
						void this.plugin.updateSettings({ outlineScale: value });
					}),
			)
			.addExtraButton((button) =>
				button
					.setIcon('rotate-ccw')
					.setTooltip('恢復預設 100%')
					.onClick(() => {
						void this.plugin
							.updateSettings({ outlineScale: 100 })
							.then(() => this.display());
					}),
			);
	}
}

export default class BulletZoomPlugin extends Plugin {
	private outlineCoordinator: BulletOutlineSidebarCoordinator | null = null;
	private readonly editorExtensions: Extension[] = [];
	settings: BulletZoomSettings = DEFAULT_SETTINGS;

	private buildEditorExtensions(
		outlineCoordinator: BulletOutlineSidebarCoordinator,
	): Extension[] {
		return [
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
				markerDetection: {
					bullets: this.settings.zoomBullets,
					numbered: this.settings.zoomNumbered,
				},
				notify: showNotice,
				onEditorReady: (view) => outlineCoordinator.notifyEditorReady(view),
				onEditorUpdate: (update) =>
					outlineCoordinator.notifyEditorUpdate(update),
				onEditorDestroy: (view) =>
					outlineCoordinator.notifyEditorDestroyed(view),
			}),
		];
	}

	private rebuildEditorExtensions(): void {
		if (this.outlineCoordinator === null) {
			return;
		}
		this.editorExtensions.length = 0;
		this.editorExtensions.push(
			...this.buildEditorExtensions(this.outlineCoordinator),
		);
		this.app.workspace.updateOptions();
	}

	async updateSettings(
		partial: Partial<BulletZoomSettings>,
	): Promise<void> {
		const previous = this.settings;
		this.settings = normalizeSettings({ ...this.settings, ...partial });
		applyScaleVariables(document.body, this.settings);
		if (
			previous.zoomBullets !== this.settings.zoomBullets ||
			previous.zoomNumbered !== this.settings.zoomNumbered
		) {
			this.rebuildEditorExtensions();
		}
		await this.saveData(this.settings);
	}

	async onload(): Promise<void> {
		this.settings = normalizeSettings(await this.loadData());
		applyScaleVariables(document.body, this.settings);
		this.addSettingTab(new BulletZoomSettingTab(this.app, this));
		const outlineCoordinator = new BulletOutlineSidebarCoordinator({
			workspace: this.app.workspace,
			isMobile: Platform.isMobile,
			getActiveEditorView: () => {
				const editor = this.app.workspace.activeEditor?.editor;
				return editor === undefined ? null : getEditorView(editor);
			},
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
		this.editorExtensions.length = 0;
		this.editorExtensions.push(...this.buildEditorExtensions(outlineCoordinator));
		this.registerEditorExtension(this.editorExtensions);

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
		clearScaleVariables(document.body);
		this.outlineCoordinator?.destroy();
		this.outlineCoordinator = null;
	}

	private resolveLeafEditor(leaf: WorkspaceLeaf): EditorView | null {
		if (!(leaf.view instanceof MarkdownView) || leaf.view.getMode() !== 'source') {
			return null;
		}
		return getEditorView(leaf.view.editor);
	}
}
