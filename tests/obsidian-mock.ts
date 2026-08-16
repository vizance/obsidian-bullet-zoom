export class ItemView {
	readonly contentEl = document.createElement('div');
	readonly app = {};

	constructor(readonly leaf: unknown) {}
}

export class Modal {
	readonly containerEl = document.createElement('div');
	readonly modalEl = document.createElement('div');
	readonly titleEl = document.createElement('div');
	readonly contentEl = document.createElement('div');

	constructor(readonly app: unknown) {
		this.modalEl.append(this.titleEl, this.contentEl);
		this.containerEl.append(this.modalEl);
	}

	open(): void {
		document.body.append(this.containerEl);
		void this.onOpen();
	}

	close(): void {
		this.onClose();
		this.containerEl.remove();
	}

	onOpen(): void | Promise<void> {}

	onClose(): void {}
}

export class Plugin {
	constructor(readonly app: unknown = {}) {}

	async loadData(): Promise<unknown> {
		return null;
	}

	async saveData(_data: unknown): Promise<void> {}

	addSettingTab(_tab: unknown): void {}
}

type EmptyableElement = HTMLDivElement & { empty?: () => void };

export class PluginSettingTab {
	readonly containerEl: EmptyableElement =
		document.createElement('div');

	constructor(
		readonly app: unknown,
		readonly plugin: unknown,
	) {
		this.containerEl.empty = () => {
			this.containerEl.replaceChildren();
		};
	}
}

export class ToggleComponent {
	readonly toggleEl = document.createElement('input');
	private value = false;
	private changeHandler: ((value: boolean) => unknown) | null = null;

	constructor(containerEl: HTMLElement) {
		this.toggleEl.type = 'checkbox';
		this.toggleEl.addEventListener('change', () => {
			this.value = this.toggleEl.checked;
			void this.changeHandler?.(this.value);
		});
		containerEl.append(this.toggleEl);
	}

	setValue(value: boolean): this {
		this.value = value;
		this.toggleEl.checked = value;
		return this;
	}

	getValue(): boolean {
		return this.value;
	}

	onChange(handler: (value: boolean) => unknown): this {
		this.changeHandler = handler;
		return this;
	}
}

export class Setting {
	readonly settingEl = document.createElement('div');
	readonly nameEl = document.createElement('div');
	readonly descEl = document.createElement('div');
	readonly controlEl = document.createElement('div');

	constructor(containerEl: HTMLElement) {
		this.settingEl.append(this.nameEl, this.descEl, this.controlEl);
		containerEl.append(this.settingEl);
	}

	setName(name: string): this {
		this.nameEl.textContent = name;
		return this;
	}

	setDesc(description: string): this {
		this.descEl.textContent = description;
		return this;
	}

	setHeading(): this {
		this.settingEl.classList.add('setting-item-heading');
		return this;
	}

	addToggle(callback: (toggle: ToggleComponent) => unknown): this {
		callback(new ToggleComponent(this.controlEl));
		return this;
	}

	addSlider(callback: (slider: SliderComponent) => unknown): this {
		callback(new SliderComponent(this.controlEl));
		return this;
	}

	addExtraButton(
		callback: (button: ExtraButtonComponent) => unknown,
	): this {
		callback(new ExtraButtonComponent(this.controlEl));
		return this;
	}

	addText(callback: (text: TextComponent) => unknown): this {
		callback(new TextComponent(this.controlEl));
		return this;
	}
}

export class TextComponent {
	readonly inputEl = document.createElement('input');
	private changeHandler: ((value: string) => unknown) | null = null;

	constructor(containerEl: HTMLElement) {
		this.inputEl.type = 'text';
		this.inputEl.addEventListener('input', () => {
			void this.changeHandler?.(this.inputEl.value);
		});
		containerEl.append(this.inputEl);
	}

	setPlaceholder(placeholder: string): this {
		this.inputEl.placeholder = placeholder;
		return this;
	}

	setValue(value: string): this {
		this.inputEl.value = value;
		return this;
	}

	getValue(): string {
		return this.inputEl.value;
	}

	onChange(handler: (value: string) => unknown): this {
		this.changeHandler = handler;
		return this;
	}
}

export class ExtraButtonComponent {
	readonly extraSettingsEl = document.createElement('button');
	private clickHandler: (() => unknown) | null = null;

	constructor(containerEl: HTMLElement) {
		this.extraSettingsEl.addEventListener('click', () => {
			void this.clickHandler?.();
		});
		containerEl.append(this.extraSettingsEl);
	}

	setIcon(icon: string): this {
		this.extraSettingsEl.dataset.icon = icon;
		return this;
	}

	setTooltip(tooltip: string): this {
		this.extraSettingsEl.title = tooltip;
		return this;
	}

	onClick(handler: () => unknown): this {
		this.clickHandler = handler;
		return this;
	}
}

export class SliderComponent {
	readonly sliderEl = document.createElement('input');
	private value = 0;
	private changeHandler: ((value: number) => unknown) | null = null;

	constructor(containerEl: HTMLElement) {
		this.sliderEl.type = 'range';
		this.sliderEl.addEventListener('input', () => {
			this.value = Number(this.sliderEl.value);
			void this.changeHandler?.(this.value);
		});
		containerEl.append(this.sliderEl);
	}

	setLimits(min: number, max: number, step: number): this {
		this.sliderEl.min = String(min);
		this.sliderEl.max = String(max);
		this.sliderEl.step = String(step);
		return this;
	}

	setValue(value: number): this {
		this.value = value;
		this.sliderEl.value = String(value);
		return this;
	}

	getValue(): number {
		return this.value;
	}

	setDynamicTooltip(): this {
		return this;
	}

	onChange(handler: (value: number) => unknown): this {
		this.changeHandler = handler;
		return this;
	}
}

export class Notice {
	constructor(readonly message: string) {}
}
