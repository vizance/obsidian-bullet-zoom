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
	planBulletRemovalRange,
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
	showNotice('Could not open the bullet outline. Try again.');
}

function showOutlineActionFailure(): void {
	showNotice('Could not switch bullets. Try again.');
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
		this.titleEl.textContent = 'Extract to new note';
		const input = this.contentEl.ownerDocument.createElement('input');
		input.type = 'text';
		input.className = 'bullet-zoom-extract-name-input';
		input.placeholder = 'New note name';
		input.value = this.defaultName;
		const confirm = this.contentEl.ownerDocument.createElement('button');
		confirm.className = 'bullet-zoom-extract-confirm mod-cta';
		confirm.textContent = 'Create';
		const cancel = this.contentEl.ownerDocument.createElement('button');
		cancel.className = 'bullet-zoom-extract-cancel';
		cancel.textContent = 'Cancel';
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

		new Setting(this.containerEl).setName('Zoom').setHeading();
		new Setting(this.containerEl)
			.setName('Zoom bullets')
			.setDesc('Detect bullets that start with a dash so you can zoom into them.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.zoomBullets)
					.onChange((value) => {
						void this.plugin.updateSettings({ zoomBullets: value });
					}),
			);
		new Setting(this.containerEl)
			.setName('Zoom numbered items')
			.setDesc('Detect numbered list items such as 1. or 2) as well.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.zoomNumbered)
					.onChange((value) => {
						void this.plugin.updateSettings({ zoomNumbered: value });
					}),
			);

		new Setting(this.containerEl).setName('Outline').setHeading();
		new Setting(this.containerEl)
			.setName('Outline text size')
			.setDesc('Scale the outline text. Lower values fit more lines on screen.')
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
					.setTooltip('Reset to 100%')
					.onClick(() => {
						void this.plugin
							.updateSettings({ outlineScale: 100 })
							.then(() => this.display());
					}),
			);

		new Setting(this.containerEl).setName('Focus page').setHeading();
		new Setting(this.containerEl)
			.setName('Focus title size')
			.setDesc('Scale the title shown after you zoom into a bullet.')
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
					.setTooltip('Reset to 100%')
					.onClick(() => {
						void this.plugin
							.updateSettings({ titleScale: 100 })
							.then(() => this.display());
					}),
			);

		new Setting(this.containerEl)
			.setName('Indent guides')
			.setDesc('Show vertical lines that connect nested bullets.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.focusIndentGuides)
					.onChange((value) => {
						void this.plugin.updateSettings({ focusIndentGuides: value });
					}),
			);

		new Setting(this.containerEl)
			.setName('Fix broken bullets')
			.setDesc('While zoomed, indent stray lines back into the focused bullet.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoFixStrayLines)
					.onChange((value) => {
						void this.plugin.updateSettings({ autoFixStrayLines: value });
					}),
			);

		new Setting(this.containerEl)
			.setName('Extract to new note')
			.setHeading();
		const vault = this.app.vault as unknown as {
			getAllLoadedFiles?: () => readonly unknown[];
		};
		new Setting(this.containerEl)
			.setName('Destination folder')
			.setDesc('Where new notes are created. Leave empty to use the current note\'s folder.')
			.addText((text) => {
				text
					.setPlaceholder('Same folder as the current note')
					.setValue(this.plugin.settings.extractFolder);
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
		new Setting(this.containerEl)
			.setName('Template file')
			.setDesc(
				'Markdown file used as the starting point. Placeholders: {{content}}, {{title}}, {{date}}, {{time}}, {{source}}.',
			)
			.addText((text) => {
				text
					.setPlaceholder('No template')
					.setValue(this.plugin.settings.extractTemplatePath);
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
			.setName('Replacement text')
			.setDesc('What stays in the original note after extracting.')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('link', 'Link to the new note')
					.addOption('embed', 'Embed the new note')
					.addOption('none', 'Nothing')
					.setValue(this.plugin.settings.extractReplacement)
					.onChange((value) => {
						void this.plugin.updateSettings({
							extractReplacement:
								value === 'embed' || value === 'none' ? value : 'link',
						});
					}),
			);
		new Setting(this.containerEl)
			.setName('After extracting')
			.setDesc('What to do once the new note is created.')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('stay', 'Stay in the current note')
					.addOption('current', 'Open the new note')
					.addOption('tab', 'Open the new note in a new tab')
					.addOption('split', 'Open the new note in a split')
					.setValue(this.plugin.settings.extractOpenBehavior)
					.onChange((value) => {
						void this.plugin.updateSettings({
							extractOpenBehavior:
								value === 'current' || value === 'tab' || value === 'split'
									? value
									: 'stay',
						});
					}),
			);
		new Setting(this.containerEl)
			.setName('Remove the top bullet')
			.setDesc('Keep only the child bullets in the new note.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.extractRemoveTopBullet)
					.onChange((value) => {
						void this.plugin.updateSettings({
							extractRemoveTopBullet: value,
						});
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
				state.field(editorInfoField, false)?.file?.basename ?? 'Untitled note',
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
				autoFixStrayLines: this.settings.autoFixStrayLines,
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
			previous.zoomNumbered !== this.settings.zoomNumbered ||
			previous.autoFixStrayLines !== this.settings.autoFixStrayLines
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
			name: 'Open bullet outline',
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
		this.addRibbonIcon('list-tree', 'Open bullet outline', () => {
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
			name: 'Zoom into current bullet',
			editorCallback: (editor) => {
				runFocusCommand(getEditorView(editor), showNotice);
			},
		});

		this.addCommand({
			id: 'extract-bullet-to-note',
			name: 'Extract bullet to new note',
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
			showNotice('Enter a name for the new note.');
			return;
		}
		const plan = planBulletExtract(
			view.state,
			anchor,
			this.settings.extractRemoveTopBullet,
		);
		if (plan === null) {
			showNotice('Put the cursor on a bullet to extract it.');
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
				showNotice('Could not create that folder. Check the path in settings.');
				return;
			}
		}
		const filePath =
			folderPath === '' || folderPath === '/'
				? `${name}.md`
				: `${folderPath}/${name}.md`;
		if (this.app.vault.getAbstractFileByPath(filePath) !== null) {
			showNotice('A note with that name already exists. Try another name.');
			return;
		}
		let fileContent = plan.fileContent;
		const templatePath = this.settings.extractTemplatePath;
		if (templatePath.length > 0) {
			const templateFile = this.app.vault.getAbstractFileByPath(templatePath);
			if (templateFile === null || !('extension' in templateFile)) {
				showNotice('Template file not found. Check the path in settings.');
				return;
			}
			let template: string;
			try {
				template = await this.app.vault.read(
					templateFile as Parameters<typeof this.app.vault.read>[0],
				);
			} catch {
				showNotice('Could not read the template file.');
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
			showNotice('Could not create the note. Check that the name is valid.');
			return;
		}
		const replacement = this.settings.extractReplacement;
		if (replacement === 'none') {
			const removal = planBulletRemovalRange(
				view.state,
				plan.replaceFrom,
				plan.replaceTo,
			);
			view.dispatch({
				changes: { from: removal.from, to: removal.to, insert: '' },
			});
		} else {
			const marker = replacement === 'embed' ? '![[' : '[[';
			view.dispatch({
				changes: {
					from: plan.replaceFrom,
					to: plan.replaceTo,
					insert: `${plan.linkIndentText}- ${marker}${name}]]`,
				},
			});
		}
		showNotice(`Extracted to ${name}.`);
		const behavior = this.settings.extractOpenBehavior;
		if (behavior === 'stay') {
			return;
		}
		const createdFile = this.app.vault.getAbstractFileByPath(filePath);
		if (createdFile === null || !('extension' in createdFile)) {
			return;
		}
		try {
			const leaf =
				behavior === 'current'
					? this.app.workspace.getLeaf(false)
					: this.app.workspace.getLeaf(
							behavior === 'tab' ? 'tab' : 'split',
						);
			await leaf.openFile(
				createdFile as Parameters<typeof leaf.openFile>[0],
			);
		} catch {
			showNotice('Could not open the new note.');
		}
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
