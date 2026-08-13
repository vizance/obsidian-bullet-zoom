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
}

export class PluginSettingTab {
	readonly containerEl = document.createElement('div');

	constructor(
		readonly app: unknown,
		readonly plugin: unknown,
	) {}
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
}

export class Notice {
	constructor(readonly message: string) {}
}
