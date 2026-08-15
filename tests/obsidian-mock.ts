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

	addToggle(callback: (toggle: ToggleComponent) => unknown): this {
		callback(new ToggleComponent(this.controlEl));
		return this;
	}

	addSlider(callback: (slider: SliderComponent) => unknown): this {
		callback(new SliderComponent(this.controlEl));
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
