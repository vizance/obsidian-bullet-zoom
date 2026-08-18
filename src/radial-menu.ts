export const RADIAL_SLOT_COUNT = 8;
export const PRESS_DURATION_MIN = 250;
export const PRESS_DURATION_MAX = 1000;
export const PRESS_DURATION_DEFAULT = 450;
export const PRESS_CANCEL_PX = 12;
export const RADIAL_DEAD_ZONE_PX = 32;
export const RADIAL_RADIUS_PX = 104;
export const RADIAL_HIT_RADIUS_PX = 60;
export const RADIAL_EDGE_PADDING_PX = 32;

export interface RadialSlot {
	readonly commandId: string;
	readonly enabled: boolean;
}

export interface RadialSegment {
	readonly slot: number;
	readonly commandId: string;
	readonly label: string;
}

export interface FanItem {
	readonly x: number;
	readonly y: number;
}

export interface FanLayout {
	readonly side: 'left' | 'right';
	readonly items: readonly FanItem[];
}

export function computeMenuSegments(
	slots: readonly RadialSlot[],
	resolveLabel: (commandId: string) => string = (id) => id,
): readonly RadialSegment[] {
	const segments: RadialSegment[] = [];
	for (const [slot, entry] of slots.entries()) {
		const commandId = entry.commandId.trim();
		if (!entry.enabled || commandId.length === 0) {
			continue;
		}
		segments.push(
			Object.freeze({ slot, commandId, label: resolveLabel(commandId) }),
		);
	}
	return Object.freeze(segments);
}

export function computeFanLayout(input: {
	readonly x: number;
	readonly y: number;
	readonly count: number;
	readonly viewportWidth: number;
	readonly viewportHeight: number;
	readonly viewportTop?: number;
	readonly radius?: number;
}): FanLayout {
	const radius = input.radius ?? RADIAL_RADIUS_PX;
	const top = input.viewportTop ?? 0;
	const bottom = top + input.viewportHeight;
	const side: 'left' | 'right' =
		input.x <= input.viewportWidth / 2 ? 'right' : 'left';
	const direction = side === 'right' ? 1 : -1;
	if (input.count <= 0) {
		return Object.freeze({ side, items: Object.freeze([]) });
	}

	// The fan opens as a half circle, narrowed when the press sits close to the
	// top or bottom so no item leaves the viewport.
	const roomAbove = Math.max(input.y - top - RADIAL_EDGE_PADDING_PX, 0);
	const roomBelow = Math.max(bottom - input.y - RADIAL_EDGE_PADDING_PX, 0);
	const upSpan = Math.asin(Math.min(roomAbove / radius, 1));
	const downSpan = Math.asin(Math.min(roomBelow / radius, 1));
	const items: FanItem[] = [];
	for (let index = 0; index < input.count; index += 1) {
		const ratio = input.count === 1 ? 0.5 : index / (input.count - 1);
		const angle = -upSpan + (upSpan + downSpan) * ratio;
		const rawX = input.x + direction * Math.cos(angle) * radius;
		const rawY = input.y + Math.sin(angle) * radius;
		items.push(
			Object.freeze({
				x: Math.min(
					Math.max(rawX, RADIAL_EDGE_PADDING_PX),
					Math.max(input.viewportWidth - RADIAL_EDGE_PADDING_PX, 0),
				),
				y: Math.min(
					Math.max(rawY, top + RADIAL_EDGE_PADDING_PX),
					Math.max(bottom - RADIAL_EDGE_PADDING_PX, top),
				),
			}),
		);
	}
	return Object.freeze({ side, items: Object.freeze(items) });
}

export function resolveNearestItem(input: {
	readonly x: number;
	readonly y: number;
	readonly originX: number;
	readonly originY: number;
	readonly items: readonly FanItem[];
	readonly hitRadius?: number;
	readonly deadZone?: number;
}): number | null {
	const deadZone = input.deadZone ?? RADIAL_DEAD_ZONE_PX;
	if (Math.hypot(input.x - input.originX, input.y - input.originY) < deadZone) {
		return null;
	}
	const hitRadius = input.hitRadius ?? RADIAL_HIT_RADIUS_PX;
	let bestIndex: number | null = null;
	let bestDistance = Number.POSITIVE_INFINITY;
	for (const [index, item] of input.items.entries()) {
		const distance = Math.hypot(input.x - item.x, input.y - item.y);
		if (distance <= hitRadius && distance < bestDistance) {
			bestDistance = distance;
			bestIndex = index;
		}
	}
	return bestIndex;
}

export interface RadialMenuOptions {
	readonly document: Document;
	readonly x: number;
	readonly y: number;
	readonly segments: readonly RadialSegment[];
	readonly pointerId?: number;
	readonly viewportWidth?: number;
	readonly viewportHeight?: number;
	readonly viewportTop?: number;
	readonly renderIcon?: (element: HTMLElement, segment: RadialSegment) => void;
	readonly onSelect: (segment: RadialSegment) => void;
	readonly onCancel?: () => void;
}

export function openRadialMenu(options: RadialMenuOptions): () => void {
	const { document: doc, segments } = options;
	const view = doc.defaultView;
	const viewportWidth = options.viewportWidth ?? view?.innerWidth ?? 0;
	const viewportHeight = options.viewportHeight ?? view?.innerHeight ?? 0;
	const viewportTop = options.viewportTop ?? 0;
	const layout = computeFanLayout({
		x: options.x,
		y: options.y,
		count: segments.length,
		viewportWidth,
		viewportHeight,
		viewportTop,
	});
	const bandTop = viewportTop + RADIAL_EDGE_PADDING_PX;
	const bandBottom = Math.max(
		viewportTop + viewportHeight - RADIAL_EDGE_PADDING_PX,
		bandTop,
	);
	const centreY = Math.min(Math.max(options.y, bandTop), bandBottom);
	const captionBelow = centreY + 44 <= bandBottom;

	const overlay = doc.createElement('div');
	overlay.className = 'bullet-zoom-radial-overlay';

	const centre = doc.createElement('button');
	centre.className = 'bullet-zoom-radial-cancel';
	centre.type = 'button';
	centre.setAttribute('aria-label', 'Close menu');
	centre.textContent = '×';
	centre.style.left = `${options.x}px`;
	centre.style.top = `${centreY}px`;
	overlay.append(centre);

	const caption = doc.createElement('div');
	caption.className = 'bullet-zoom-radial-caption';
	caption.style.left = `${options.x}px`;
	caption.style.top = `${captionBelow ? centreY + 44 : centreY - 60}px`;
	caption.classList.add('is-empty');
	overlay.append(caption);

	const buttons: HTMLButtonElement[] = [];
	for (const [index, segment] of segments.entries()) {
		const position = layout.items[index];
		const button = doc.createElement('button');
		button.className = 'bullet-zoom-radial-item';
		button.type = 'button';
		button.dataset.slot = String(segment.slot);
		button.dataset.commandId = segment.commandId;
		button.setAttribute('aria-label', segment.label);
		button.title = segment.label;
		button.style.left = `${position?.x ?? options.x}px`;
		button.style.top = `${position?.y ?? centreY}px`;
		button.style.setProperty(
			'--bullet-zoom-radial-delay',
			`${index * 24}ms`,
		);
		button.style.setProperty(
			'--bullet-zoom-radial-origin-x',
			`${options.x - (position?.x ?? options.x)}px`,
		);
		button.style.setProperty(
			'--bullet-zoom-radial-origin-y',
			`${centreY - (position?.y ?? centreY)}px`,
		);
		if (options.renderIcon === undefined) {
			button.textContent = segment.label.slice(0, 1);
		} else {
			options.renderIcon(button, segment);
		}
		overlay.append(button);
		buttons.push(button);
	}

	let closed = false;
	const close = (): void => {
		if (closed) {
			return;
		}
		closed = true;
		doc.removeEventListener('keydown', onKeyDown, true);
		overlay.remove();
	};
	const cancel = (): void => {
		close();
		options.onCancel?.();
	};
	const select = (segment: RadialSegment): void => {
		close();
		options.onSelect(segment);
	};
	function onKeyDown(event: KeyboardEvent): void {
		if (event.key === 'Escape') {
			event.preventDefault();
			cancel();
		}
	}

	const nearestAt = (x: number, y: number): number | null =>
		resolveNearestItem({
			x,
			y,
			originX: options.x,
			originY: options.y,
			items: layout.items,
		});

	const highlight = (index: number | null): void => {
		for (const [buttonIndex, button] of buttons.entries()) {
			button.classList.toggle('is-active', buttonIndex === index);
		}
		centre.classList.toggle('is-active', index === null);
		const label = index === null ? '' : (segments[index]?.label ?? '');
		caption.textContent = label;
		caption.classList.toggle('is-empty', label.length === 0);
	};

	overlay.addEventListener('pointermove', (event) => {
		if (
			options.pointerId !== undefined &&
			event.pointerId !== options.pointerId
		) {
			return;
		}
		highlight(nearestAt(event.clientX, event.clientY));
	});
	overlay.addEventListener('pointerup', (event) => {
		if (
			options.pointerId === undefined ||
			event.pointerId !== options.pointerId
		) {
			return;
		}
		const index = nearestAt(event.clientX, event.clientY);
		const segment = index === null ? undefined : segments[index];
		if (segment === undefined) {
			cancel();
			return;
		}
		select(segment);
	});
	overlay.addEventListener('click', (event) => {
		if (event.target === overlay) {
			cancel();
		}
	});
	centre.addEventListener('click', (event) => {
		event.preventDefault();
		cancel();
	});
	for (const [index, button] of buttons.entries()) {
		button.addEventListener('click', (event) => {
			event.preventDefault();
			const segment = segments[index];
			if (segment !== undefined) {
				select(segment);
			}
		});
	}
	doc.addEventListener('keydown', onKeyDown, true);
	doc.body.append(overlay);
	return close;
}
