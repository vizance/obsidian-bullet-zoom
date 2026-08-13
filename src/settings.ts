import {
	PluginSettingTab,
	Setting,
	type Plugin,
	type SettingDefinitionItem,
} from 'obsidian';

export type BulletZoomSettings = Readonly<{
	alwaysShowRowControls: boolean;
}>;

export const DEFAULT_SETTINGS: BulletZoomSettings = Object.freeze({
	alwaysShowRowControls: true,
});

export function parseBulletZoomSettings(data: unknown): BulletZoomSettings {
	if (
		typeof data === 'object' &&
		data !== null &&
		!Array.isArray(data) &&
		typeof (data as { alwaysShowRowControls?: unknown })
			.alwaysShowRowControls === 'boolean'
	) {
		return Object.freeze({
			alwaysShowRowControls: (data as { alwaysShowRowControls: boolean })
				.alwaysShowRowControls,
		});
	}

	return DEFAULT_SETTINGS;
}

export type BulletZoomSettingsController = Readonly<{
	getSettings: () => BulletZoomSettings;
	setAlwaysShowRowControls: (value: boolean) => Promise<boolean>;
}>;

export async function persistAlwaysShowRowControls(
	value: boolean,
	callbacks: Readonly<{
		save: (settings: BulletZoomSettings) => Promise<void>;
		onSaved: (settings: BulletZoomSettings) => void;
		onFailure: () => void;
	}>,
): Promise<boolean> {
	const nextSettings = Object.freeze({ alwaysShowRowControls: value });
	try {
		await callbacks.save(nextSettings);
	} catch {
		callbacks.onFailure();
		return false;
	}
	callbacks.onSaved(nextSettings);
	return true;
}

export class BulletZoomSettingTab extends PluginSettingTab {
	constructor(
		plugin: Plugin,
		private readonly controller: BulletZoomSettingsController,
	) {
		super(plugin.app, plugin);
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				name: '永遠顯示行尾縮放箭頭',
				desc: '關閉後，桌面只在滑鼠移到該行或鍵盤聚焦時顯示；手機與平板仍保持可見。',
				control: {
					type: 'toggle',
					key: 'alwaysShowRowControls',
					defaultValue: true,
				},
			},
		];
	}

	getControlValue(key: string): unknown {
		return key === 'alwaysShowRowControls'
			? this.controller.getSettings().alwaysShowRowControls
			: undefined;
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		if (key !== 'alwaysShowRowControls' || typeof value !== 'boolean') {
			throw new TypeError('Invalid Bullet Zoom setting value.');
		}
		if (!(await this.controller.setAlwaysShowRowControls(value))) {
			throw new Error('Bullet Zoom setting could not be saved.');
		}
	}

	display(): void {
		this.containerEl.replaceChildren();
		new Setting(this.containerEl)
			.setName('永遠顯示行尾縮放箭頭')
			.setDesc(
				'關閉後，桌面只在滑鼠移到該行或鍵盤聚焦時顯示；手機與平板仍保持可見。',
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.controller.getSettings().alwaysShowRowControls)
					.onChange(async (value) => {
						try {
							await this.setControlValue('alwaysShowRowControls', value);
						} catch {
							toggle.setValue(
								this.controller.getSettings().alwaysShowRowControls,
							);
						}
					}),
			);
	}
}
