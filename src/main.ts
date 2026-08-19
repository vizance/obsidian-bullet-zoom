import type { Editor } from 'obsidian';
import {
	editorInfoField,
	editorLivePreviewField,
	MarkdownView,
	getIconIds,
	Modal,
	Notice,
	setIcon,
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
	collectBulletCopyText,
	findSupportedBullet,
	planBulletClear,
	planBulletExtract,
	planBulletPrefixToggle,
	planBulletRemovalRange,
	suggestExtractFileName,
} from './list-structure';
import { filterIconIds, iconLabel } from './icon-picker';
import {
	computeMenuSegments,
	openRadialMenu,
	resolveSegmentIcon,
} from './radial-menu';
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
	RADIAL_PRESS_MAX,
	RADIAL_PRESS_MIN,
	RADIAL_SLOT_COUNT,
	applyScaleVariables,
	clearScaleVariables,
	DEFAULT_BULLET_PREFIX,
	DEFAULT_SETTINGS,
	normalizeSettings,
	SCALE_MAX,
	SCALE_MIN,
	SCALE_STEP,
	type BulletZoomSettings,
} from './settings';

type EditorWithCodeMirror = Editor & { cm?: unknown };

const MENU_OPEN_CLASS = 'bullet-zoom-menu-open';

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

function collectIconIds(): readonly string[] {
	try {
		return Object.freeze([...getIconIds()].sort());
	} catch {
		return Object.freeze([]);
	}
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

async function copyTextToClipboard(
	view: EditorView,
	text: string,
): Promise<boolean> {
	try {
		const clipboard = view.dom.ownerDocument.defaultView?.navigator?.clipboard;
		if (clipboard !== undefined) {
			await clipboard.writeText(text);
			return true;
		}
	} catch {
		// Fall through to the legacy path below.
	}
	try {
		const ownerDocument = view.dom.ownerDocument;
		const holder = ownerDocument.createElement('textarea');
		holder.value = text;
		holder.style.position = 'fixed';
		holder.style.opacity = '0';
		ownerDocument.body.append(holder);
		holder.select();
		const copied = ownerDocument.execCommand('copy');
		holder.remove();
		return copied;
	} catch {
		return false;
	}
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

class IconPickerModal extends Modal {
	private query = '';

	constructor(
		app: App,
		private readonly iconIds: readonly string[],
		private readonly current: string,
		private readonly onChoose: (icon: string) => void,
	) {
		super(app);
	}

	onOpen(): void {
		this.titleEl.textContent = 'Choose an icon';
		const doc = this.contentEl.ownerDocument;
		const search = doc.createElement('input');
		search.type = 'text';
		search.className = 'bullet-zoom-icon-search';
		search.placeholder = 'Search icons';
		const clear = doc.createElement('button');
		clear.className = 'bullet-zoom-icon-clear';
		clear.textContent = 'Use the command icon';
		const grid = doc.createElement('div');
		grid.className = 'bullet-zoom-icon-grid';

		const renderGrid = (): void => {
			grid.replaceChildren();
			for (const id of filterIconIds(this.iconIds, this.query)) {
				const item = doc.createElement('button');
				item.className = 'bullet-zoom-icon-option';
				item.type = 'button';
				item.classList.toggle('is-current', id === this.current);
				const glyph = doc.createElement('span');
				glyph.className = 'bullet-zoom-icon-glyph';
				setIcon(glyph, id);
				const label = doc.createElement('span');
				label.className = 'bullet-zoom-icon-label';
				label.textContent = iconLabel(id);
				item.append(glyph, label);
				item.setAttribute('aria-label', iconLabel(id));
				item.addEventListener('click', () => {
					this.close();
					this.onChoose(id);
				});
				grid.append(item);
			}
			if (grid.childElementCount === 0) {
				const empty = doc.createElement('div');
				empty.className = 'bullet-zoom-icon-empty';
				empty.textContent = 'No icon matches that search.';
				grid.append(empty);
			}
		};

		search.addEventListener('input', () => {
			this.query = search.value;
			renderGrid();
		});
		clear.addEventListener('click', () => {
			this.close();
			this.onChoose('');
		});

		this.contentEl.classList.add('bullet-zoom-icon-picker');
		this.contentEl.replaceChildren(search, clear, grid);
		renderGrid();
		search.focus();
	}

	onClose(): void {
		this.contentEl.replaceChildren();
	}
}

class BulletZoomSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private readonly plugin: BulletZoomPlugin,
	) {
		super(app, plugin);
	}

	private row(): Setting {
		const setting = new Setting(this.containerEl);
		setting.settingEl.classList.add('bullet-zoom-setting');
		return setting;
	}

	private section(name: string, description: string): Setting {
		const setting = new Setting(this.containerEl)
			.setName(name)
			.setDesc(description)
			.setHeading();
		setting.settingEl.classList.add('bullet-zoom-setting');
		setting.settingEl.classList.add('bullet-zoom-section');
		return setting;
	}

	private renderSlotList(
		allCommands: ReadonlyArray<{ id: string; name: string }>,
	): void {
		const doc = this.containerEl.ownerDocument;
		const commandIcons = new Map<string, string>();
		for (const command of allCommands) {
			const icon = (command as { icon?: unknown }).icon;
			if (typeof icon === 'string' && icon.length > 0) {
				commandIcons.set(command.id, icon);
			}
		}
		const iconIds = collectIconIds();
		const list = doc.createElement('div');
		list.className = 'bullet-zoom-slots';
		this.containerEl.append(list);

		for (let position = 0; position < RADIAL_SLOT_COUNT; position += 1) {
			const index = position;
			const current = this.plugin.settings.radialSlots[index];
			const row = doc.createElement('div');
			row.className = 'bullet-zoom-slot';

			const number = doc.createElement('span');
			number.className = 'bullet-zoom-slot-number';
			number.textContent = String(index + 1);

			const preview = doc.createElement('button');
			preview.className = 'bullet-zoom-slot-icon';
			preview.type = 'button';
			preview.setAttribute('aria-label', `Choose the slot ${index + 1} icon`);
			preview.title = 'Choose an icon';

			const command = doc.createElement('select');
			command.className = 'dropdown bullet-zoom-slot-command';
			command.setAttribute('aria-label', `Slot ${index + 1} command`);
			const emptyOption = doc.createElement('option');
			emptyOption.value = '';
			emptyOption.textContent = 'No command';
			command.append(emptyOption);
			for (const entry of allCommands) {
				const option = doc.createElement('option');
				option.value = entry.id;
				option.textContent = entry.name;
				command.append(option);
			}
			command.value = current?.commandId ?? '';

			const iconField = doc.createElement('input');
			iconField.type = 'text';
			iconField.className = 'bullet-zoom-slot-icon-input';
			iconField.placeholder = 'Icon — empty uses the command icon';
			iconField.setAttribute('aria-label', `Slot ${index + 1} icon`);
			iconField.value = current?.icon ?? '';

			const toggle = doc.createElement('div');
			toggle.className = 'checkbox-container bullet-zoom-slot-toggle';
			toggle.setAttribute('role', 'checkbox');
			toggle.setAttribute('aria-label', `Enable slot ${index + 1}`);
			const checkbox = doc.createElement('input');
			checkbox.type = 'checkbox';
			toggle.append(checkbox);

			const renderState = (): void => {
				const slot = this.plugin.settings.radialSlots[index];
				const enabled = slot?.enabled ?? false;
				checkbox.checked = enabled;
				toggle.classList.toggle('is-enabled', enabled);
				toggle.setAttribute('aria-checked', String(enabled));
				row.classList.toggle('is-disabled', !enabled);
				setIcon(
					preview,
					resolveSegmentIcon({
						slotIcon: slot?.icon,
						commandIcon: commandIcons.get(slot?.commandId ?? ''),
					}),
				);
			};
			const updateSlot = (patch: {
				commandId?: string;
				enabled?: boolean;
				icon?: string;
			}): void => {
				const slots = [...this.plugin.settings.radialSlots];
				const existing = slots[index];
				slots[index] = {
					commandId: patch.commandId ?? existing?.commandId ?? '',
					enabled: patch.enabled ?? existing?.enabled ?? false,
					icon: patch.icon ?? existing?.icon ?? '',
				};
				void this.plugin.updateSettings({ radialSlots: slots });
				renderState();
			};

			command.addEventListener('change', () => {
				updateSlot({
					commandId: command.value,
					enabled: command.value.length > 0,
				});
			});
			const renderSuggestions = attachPathAutocomplete(
				{
					inputEl: iconField,
					setValue: (value: string) => {
						iconField.value = value;
					},
				},
				iconIds,
				(value) => {
					updateSlot({ icon: value });
				},
			);
			iconField.addEventListener('input', () => {
				updateSlot({ icon: iconField.value.trim() });
				renderSuggestions(iconField.value);
			});
			toggle.addEventListener('click', () => {
				updateSlot({ enabled: !(checkbox.checked ?? false) });
			});
			preview.addEventListener('click', () => {
				new IconPickerModal(
					this.app,
					iconIds,
					this.plugin.settings.radialSlots[index]?.icon ?? '',
					(icon) => {
						iconField.value = icon;
						updateSlot({ icon });
					},
				).open();
			});

			row.append(number, preview, command, iconField, toggle);
			list.append(row);
			renderState();
		}
	}

	display(): void {
		this.containerEl.empty();
		this.containerEl.classList.add('bullet-zoom-settings');

		this.section('Zoom', 'Which list items you can zoom into.');
		this.row()
			.setName('Zoom bullets')
			.setDesc('Detect bullets that start with a dash so you can zoom into them.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.zoomBullets)
					.onChange((value) => {
						void this.plugin.updateSettings({ zoomBullets: value });
					}),
			);
		this.row()
			.setName('Zoom numbered items')
			.setDesc('Detect numbered list items such as 1. or 2) as well.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.zoomNumbered)
					.onChange((value) => {
						void this.plugin.updateSettings({ zoomNumbered: value });
					}),
			);

		this.section('Focus page', 'How a note looks once you have zoomed in.');
		this.row()
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
		this.row()
			.setName('Indent guides')
			.setDesc('Show vertical lines that connect nested bullets.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.focusIndentGuides)
					.onChange((value) => {
						void this.plugin.updateSettings({ focusIndentGuides: value });
					}),
			);
		this.row()
			.setName('Fix broken bullets')
			.setDesc(
				'While zoomed, tidy dictated lines into bullets under the item above them.',
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoFixStrayLines)
					.onChange((value) => {
						void this.plugin.updateSettings({ autoFixStrayLines: value });
					}),
			);

		this.section('Outline', 'The bullet outline in the sidebar.');
		this.row()
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

		this.section(
			'Bullet commands',
			'How the copy, cut, and prefix commands treat a bullet.',
		);
		this.row()
			.setName('Copy scope')
			.setDesc('What the copy command puts on the clipboard. Cut always includes children.')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('text', 'The bullet text only')
					.addOption('branch', 'The bullet and its children')
					.setValue(this.plugin.settings.bulletCopyScope)
					.onChange((value) => {
						void this.plugin.updateSettings({
							bulletCopyScope: value === 'branch' ? 'branch' : 'text',
						});
					}),
			);
		this.row()
			.setName('Prefix text')
			.setDesc('What the prefix command inserts after the bullet marker.')
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_BULLET_PREFIX)
					.setValue(this.plugin.settings.bulletPrefixText)
					.onChange((value) => {
						void this.plugin.updateSettings({ bulletPrefixText: value });
					}),
			);

		this.section(
			'Bullet menu',
			'The command menu that opens from a bullet marker on phone and tablet.',
		);
		this.row()
			.setName('Enable the menu')
			.setDesc('Turn the marker menu off to keep the marker as a plain zoom target.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.radialMenuEnabled)
					.onChange((value) => {
						void this.plugin.updateSettings({ radialMenuEnabled: value });
					}),
			);
		this.row()
			.setName('Marker tap')
			.setDesc('What tapping a bullet marker does on mobile.')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('menu', 'Open the menu')
					.addOption('zoom', 'Zoom into the bullet')
					.setValue(this.plugin.settings.markerTapAction)
					.onChange((value) => {
						void this.plugin.updateSettings({
							markerTapAction: value === 'zoom' ? 'zoom' : 'menu',
						});
					}),
			);
		this.row()
			.setName('Press duration')
			.setDesc('How long to hold before the menu opens, in milliseconds.')
			.addSlider((slider) =>
				slider
					.setLimits(RADIAL_PRESS_MIN, RADIAL_PRESS_MAX, 50)
					.setValue(this.plugin.settings.radialPressDuration)
					.setDynamicTooltip()
					.onChange((value) => {
						void this.plugin.updateSettings({ radialPressDuration: value });
					}),
			);
		this.row()
			.setName('Menu slots')
			.setDesc(
				'Each slot runs one command. Leave a slot icon empty to use the command icon.',
			);
		const allCommands = (
			(this.app as unknown as { commands?: unknown }).commands as {
				listCommands?: () => Array<{ id: string; name: string }>;
			}
		).listCommands?.() ?? [];
		this.renderSlotList(allCommands);

		this.section(
			'Extract to new note',
			'Where an extracted branch goes and what it leaves behind.',
		);
		const vault = this.app.vault as unknown as {
			getAllLoadedFiles?: () => readonly unknown[];
		};
		this.row()
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
		this.row()
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
		this.row()
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
		this.row()
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
		this.row()
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
				radialMenu: {
					enabled: Platform.isMobile && this.settings.radialMenuEnabled,
					openOnTap: this.settings.markerTapAction === 'menu',
					pressDuration: this.settings.radialPressDuration,
					onLongPress: (view, markerFrom, clientX, clientY, pointerId) => {
						this.openBulletMenu(view, markerFrom, clientX, clientY, pointerId);
					},
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
			previous.zoomNumbered !== this.settings.zoomNumbered ||
			previous.autoFixStrayLines !== this.settings.autoFixStrayLines ||
			previous.radialMenuEnabled !== this.settings.radialMenuEnabled ||
			previous.radialPressDuration !== this.settings.radialPressDuration ||
			previous.radialSlots !== this.settings.radialSlots ||
			previous.markerTapAction !== this.settings.markerTapAction
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
			icon: 'search',
			editorCallback: (editor) => {
				runFocusCommand(getEditorView(editor), showNotice);
			},
		});

		this.addCommand({
			id: 'copy-bullet',
			name: 'Copy bullet',
			icon: 'copy',
			editorCheckCallback: (checking, editor) =>
				this.runBulletCommand(editor, checking, (view, markerFrom) => {
					const text = collectBulletCopyText(
						view.state,
						markerFrom,
						this.settings.bulletCopyScope,
					);
					if (text === null || text.length === 0) {
						showNotice('Nothing to copy.');
						return;
					}
					void copyTextToClipboard(view, text)
						.then((copied) => {
							showNotice(
								copied ? 'Bullet copied.' : 'Could not copy the bullet.',
							);
						})
						.catch(() => {
							showNotice('Could not copy the bullet.');
						});
				}),
		});

		this.addCommand({
			id: 'cut-bullet',
			name: 'Cut bullet',
			icon: 'scissors',
			editorCheckCallback: (checking, editor) =>
				this.runBulletCommand(editor, checking, (view, markerFrom) => {
					// Cutting always takes the children with it, so the clipboard
					// holds a branch you can paste back whole.
					const text = collectBulletCopyText(view.state, markerFrom, 'branch');
					if (text === null || text.length === 0) {
						showNotice('Nothing to cut.');
						return;
					}
					void copyTextToClipboard(view, text)
						.then((copied) => {
							if (!copied) {
								showNotice('Could not cut the bullet. Nothing was removed.');
								return;
							}
							// Re-read the document: the clipboard write was async, so
							// the earlier offsets may no longer be valid.
							const plan = planBulletExtract(view.state, markerFrom, false);
							if (plan === null) {
								showNotice('Bullet copied, but it could not be removed.');
								return;
							}
							const removal = planBulletRemovalRange(
								view.state,
								plan.replaceFrom,
								plan.replaceTo,
							);
							view.dispatch({
								changes: { from: removal.from, to: removal.to, insert: '' },
							});
							showNotice('Bullet cut.');
						})
						.catch(() => {
							showNotice('Could not cut the bullet. Nothing was removed.');
						});
				}),
		});

		this.addCommand({
			id: 'clear-bullet',
			name: 'Clear bullet text',
			icon: 'eraser',
			editorCheckCallback: (checking, editor) =>
				this.runBulletCommand(editor, checking, (view, markerFrom) => {
					const change = planBulletClear(view.state, markerFrom);
					if (change === null) {
						return;
					}
					view.dispatch({ changes: change });
				}),
		});

		this.addCommand({
			id: 'delete-bullet',
			name: 'Delete bullet',
			icon: 'trash-2',
			editorCheckCallback: (checking, editor) =>
				this.runBulletCommand(editor, checking, (view, markerFrom) => {
					const plan = planBulletExtract(view.state, markerFrom, false);
					if (plan === null) {
						return;
					}
					const removal = planBulletRemovalRange(
						view.state,
						plan.replaceFrom,
						plan.replaceTo,
					);
					view.dispatch({
						changes: { from: removal.from, to: removal.to, insert: '' },
					});
				}),
		});

		this.addCommand({
			id: 'insert-bullet-prefix',
			name: 'Insert prefix text',
			icon: 'quote',
			editorCheckCallback: (checking, editor) =>
				this.runBulletCommand(editor, checking, (view, markerFrom) => {
					const change = planBulletPrefixToggle(
						view.state,
						markerFrom,
						this.settings.bulletPrefixText,
					);
					if (change === null) {
						return;
					}
					view.dispatch({ changes: change });
				}),
		});

		this.addCommand({
			id: 'extract-bullet-to-note',
			name: 'Extract bullet to new note',
			icon: 'file-output',
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

	private openBulletMenu(
		view: EditorView,
		markerFrom: number,
		clientX: number,
		clientY: number,
		pointerId: number,
	): void {
		const commands = (this.app as unknown as { commands?: unknown })
			.commands as {
			listCommands?: () => Array<{ id: string; name: string }>;
			executeCommandById?: (id: string) => unknown;
		};
		const names = new Map<string, string>();
		const icons = new Map<string, string>();
		for (const command of commands.listCommands?.() ?? []) {
			names.set(command.id, command.name);
			const icon = (command as { icon?: unknown }).icon;
			if (typeof icon === 'string' && icon.length > 0) {
				icons.set(command.id, icon);
			}
		}
		const segments = computeMenuSegments(
			this.settings.radialSlots,
			(id) => names.get(id) ?? id,
		);
		if (segments.length === 0) {
			return;
		}
		// Deliberately not focusing the editor: on mobile that raises the
		// keyboard, which would cover the menu we are about to open.
		view.dispatch({ selection: { anchor: markerFrom } });
		// While the menu is up the editor must not take part in the gesture,
		// otherwise the same finger keeps dragging the caret underneath it.
		const hadFocus = view.hasFocus;
		view.dom.classList.add(MENU_OPEN_CLASS);
		view.contentDOM.blur();
		const ownerWindow = view.dom.ownerDocument.defaultView;
		const visual = ownerWindow?.visualViewport ?? null;
		openRadialMenu({
			document: view.dom.ownerDocument,
			x: clientX,
			y: clientY,
			viewportWidth: visual?.width ?? ownerWindow?.innerWidth ?? 0,
			viewportHeight: visual?.height ?? ownerWindow?.innerHeight ?? 0,
			viewportTop: visual?.offsetTop ?? 0,
			size: Platform.isTablet ? 'large' : 'regular',
			segments,
			pointerId,
			renderIcon: (element, segment) => {
				setIcon(
					element,
					resolveSegmentIcon({
						slotIcon: segment.icon,
						commandIcon: icons.get(segment.commandId),
					}),
				);
			},
			onSelect: (segment) => {
				commands.executeCommandById?.(segment.commandId);
			},
			onClose: () => {
				view.dom.classList.remove(MENU_OPEN_CLASS);
				if (hadFocus) {
					view.focus();
				}
			},
		});
	}

	private runBulletCommand(
		editor: Editor,
		checking: boolean,
		run: (view: EditorView, markerFrom: number) => void,
	): boolean {
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
		run(view, bullet.markerFrom);
		return true;
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
