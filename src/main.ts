import type { Editor } from 'obsidian';
import {
	editorInfoField,
	editorLivePreviewField,
	MarkdownView,
	Modal,
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
import {
	findSupportedBullet,
	planBulletExtract,
	suggestExtractFileName,
} from './list-structure';
import {
	collectFolderPaths,
	collectMarkdownPaths,
	filterFolderSuggestions,
} from './folder-suggest';
import {
	formatTemplateDate,
	formatTemplateTime,
	renderExtractTemplate,
} from './extract-template';
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

function attachPathAutocomplete(
	text: {
		inputEl: HTMLInputElement;
		setValue: (value: string) => unknown;
	},
	paths: readonly string[],
	onPick: (value: string) => void,
): (query: string) => void {
	const input = text.inputEl;
	input.autocomplete = 'off';
	const wrapper = input.ownerDocument.createElement('div');
	wrapper.className = 'bullet-zoom-folder-suggest';
	input.replaceWith(wrapper);
	wrapper.append(input);
	const list = input.ownerDocument.createElement('div');
	list.className = 'bullet-zoom-folder-suggestions';
	list.hidden = true;
	wrapper.append(list);

	let activeIndex = -1;
	const items = (): readonly Element[] =>
		Array.from(list.querySelectorAll('.bullet-zoom-folder-suggestion'));
	const highlight = (): void => {
		for (const [index, child] of items().entries()) {
			child.classList.toggle('is-active', index === activeIndex);
		}
	};
	const apply = (value: string): void => {
		text.setValue(value);
		onPick(value);
		list.hidden = true;
		list.replaceChildren();
		activeIndex = -1;
	};
	const render = (query: string): void => {
		const matches = filterFolderSuggestions(paths, query);
		list.replaceChildren();
		activeIndex = matches.length > 0 ? 0 : -1;
		for (const match of matches) {
			const item = input.ownerDocument.createElement('div');
			item.className = 'bullet-zoom-folder-suggestion';
			item.textContent = match;
			item.addEventListener('mousedown', (event) => {
				event.preventDefault();
				apply(match);
			});
			list.append(item);
		}
		list.hidden = matches.length === 0;
		highlight();
	};

	input.addEventListener('focus', () => render(input.value));
	input.addEventListener('blur', () => {
		input.ownerDocument.defaultView?.setTimeout(() => {
			list.hidden = true;
		}, 120);
	});
	input.addEventListener('keydown', (event) => {
		const current = items();
		if (list.hidden || current.length === 0) {
			return;
		}
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			const delta = event.key === 'ArrowDown' ? 1 : -1;
			activeIndex = (activeIndex + delta + current.length) % current.length;
			highlight();
			return;
		}
		if (event.key === 'Enter' && activeIndex >= 0) {
			event.preventDefault();
			const value = current[activeIndex]?.textContent ?? '';
			if (value.length > 0) {
				apply(value);
			}
			return;
		}
		if (event.key === 'Escape') {
			list.hidden = true;
		}
	});
	return render;
}

class ExtractNameModal extends Modal {
	private submitted = false;

	constructor(
		app: App,
		private readonly defaultName: string,
		private readonly onSubmit: (name: string) => void,
	) {
		super(app);
	}

	onOpen(): void {
		this.titleEl.textContent = '拆分 Bullet 成新筆記';
		const input = this.contentEl.ownerDocument.createElement('input');
		input.type = 'text';
		input.className = 'bullet-zoom-extract-name-input';
		input.placeholder = '輸入新筆記名稱';
		input.value = this.defaultName;
		const confirm = this.contentEl.ownerDocument.createElement('button');
		confirm.className = 'bullet-zoom-extract-confirm mod-cta';
		confirm.textContent = '建立';
		const cancel = this.contentEl.ownerDocument.createElement('button');
		cancel.className = 'bullet-zoom-extract-cancel';
		cancel.textContent = '取消';
		const submit = (): void => {
			const name = input.value.trim();
			this.submitted = true;
			this.close();
			this.onSubmit(name);
		};
		confirm.addEventListener('click', submit);
		cancel.addEventListener('click', () => this.close());
		input.addEventListener('keydown', (event) => {
			if (event.key === 'Enter') {
				event.preventDefault();
				submit();
			}
		});
		const actions = this.contentEl.ownerDocument.createElement('div');
		actions.className = 'bullet-zoom-extract-actions';
		actions.append(cancel, confirm);
		this.contentEl.replaceChildren(input, actions);
		input.focus();
		input.select();
	}

	onClose(): void {
		this.contentEl.replaceChildren();
		if (!this.submitted) {
			this.submitted = true;
		}
	}
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
		const folderSetting = new Setting(this.containerEl)
			.setName('拆分後的新筆記位置')
			.setDesc('輸入或選擇資料夾（例如 Cards）；留空表示與目前筆記同資料夾。');
		folderSetting.addText((text) => {
			text
				.setPlaceholder('留空＝與目前筆記同資料夾')
				.setValue(this.plugin.settings.extractFolder);
			const vault = this.app.vault as unknown as {
				getAllLoadedFiles?: () => readonly unknown[];
			};
			const render = attachPathAutocomplete(
				text,
				collectFolderPaths(vault),
				(value) => {
					void this.plugin.updateSettings({ extractFolder: value });
				},
			);
			text.onChange((value) => {
				void this.plugin.updateSettings({ extractFolder: value });
				render(value);
			});
		});

		const templateSetting = new Setting(this.containerEl)
			.setName('拆分筆記模板')
			.setDesc(
				'選擇模板檔（.md）；可用 {{content}}、{{title}}、{{date}}、{{time}}、{{source}}，留空表示不套模板。',
			);
		templateSetting.addText((text) => {
			text
				.setPlaceholder('留空＝不套用模板')
				.setValue(this.plugin.settings.extractTemplatePath);
			const vault = this.app.vault as unknown as {
				getAllLoadedFiles?: () => readonly unknown[];
			};
			const render = attachPathAutocomplete(
				text,
				collectMarkdownPaths(vault),
				(value) => {
					void this.plugin.updateSettings({ extractTemplatePath: value });
				},
			);
			text.onChange((value) => {
				void this.plugin.updateSettings({ extractTemplatePath: value });
				render(value);
			});
		});

		new Setting(this.containerEl)
			.setName('拆分時移除最上層 Bullet')
			.setDesc(
				'拆分 Bullet 成新筆記時，新筆記只保留子項目內容；關閉則連最上層 Bullet 一起搬過去。',
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.extractRemoveTopBullet)
					.onChange((value) => {
						void this.plugin.updateSettings({
							extractRemoveTopBullet: value,
						});
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
			id: 'extract-bullet-to-note',
			name: '拆分 Bullet 成新筆記',
			editorCheckCallback: (checking, editor) => {
				const view = getEditorView(editor);
				if (view === null) {
					return false;
				}
				const bullet = findSupportedBullet(
					view.state,
					view.state.selection.main.head,
				);
				if (bullet === null) {
					return false;
				}
				if (checking) {
					return true;
				}
				new ExtractNameModal(
					this.app,
					suggestExtractFileName(bullet.label),
					(name) => {
						void this.extractBulletToNote(view, bullet.markerFrom, name);
					},
				).open();
				return true;
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

	private async extractBulletToNote(
		view: EditorView,
		anchor: number,
		rawName: string,
	): Promise<void> {
		const name = rawName.trim();
		if (name.length === 0) {
			showNotice('請輸入新筆記名稱。');
			return;
		}
		const plan = planBulletExtract(
			view.state,
			anchor,
			this.settings.extractRemoveTopBullet,
		);
		if (plan === null) {
			showNotice('請先把游標移到可拆分的 Bullet 上。');
			return;
		}
		const configuredFolder = this.settings.extractFolder;
		const activeFile = this.app.workspace.getActiveFile();
		const folderPath =
			configuredFolder.length > 0
				? configuredFolder
				: (activeFile?.parent?.path ?? '');
		if (
			configuredFolder.length > 0 &&
			this.app.vault.getAbstractFileByPath(configuredFolder) === null
		) {
			try {
				await this.app.vault.createFolder(configuredFolder);
			} catch {
				showNotice('無法建立指定的資料夾，請確認路徑是否正確。');
				return;
			}
		}
		const filePath =
			folderPath === '' || folderPath === '/'
				? `${name}.md`
				: `${folderPath}/${name}.md`;
		if (this.app.vault.getAbstractFileByPath(filePath) !== null) {
			showNotice('已有同名筆記，請換一個名稱。');
			return;
		}
		let fileContent = plan.fileContent;
		const templatePath = this.settings.extractTemplatePath;
		if (templatePath.length > 0) {
			const templateFile = this.app.vault.getAbstractFileByPath(templatePath);
			if (templateFile === null || !('extension' in templateFile)) {
				showNotice('找不到指定的模板檔，請確認設定中的路徑。');
				return;
			}
			let template: string;
			try {
				template = await this.app.vault.read(
					templateFile as Parameters<typeof this.app.vault.read>[0],
				);
			} catch {
				showNotice('無法讀取模板檔，請確認檔案是否正常。');
				return;
			}
			const now = new Date();
			fileContent = renderExtractTemplate(template, {
				content: plan.fileContent,
				title: name,
				date: formatTemplateDate(now),
				time: formatTemplateTime(now),
				source:
					activeFile?.basename === undefined
						? ''
						: `[[${activeFile.basename}]]`,
			});
		}
		try {
			await this.app.vault.create(filePath, fileContent);
		} catch {
			showNotice('無法建立新筆記，請確認名稱是否合法。');
			return;
		}
		view.dispatch({
			changes: {
				from: plan.replaceFrom,
				to: plan.replaceTo,
				insert: `${plan.linkIndentText}- [[${name}]]`,
			},
		});
		showNotice(`已拆分到「${name}」。`);
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
