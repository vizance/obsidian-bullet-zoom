export const RADIAL_SLOT_COUNT = 8;
export const PRESS_DURATION_MIN = 250;
export const PRESS_DURATION_MAX = 1000;
export const PRESS_DURATION_DEFAULT = 450;
export const PRESS_CANCEL_PX = 12;
export const RADIAL_DEAD_ZONE_PX = 28;
export const RADIAL_RADIUS_PX = 96;

export interface RadialSegment {
	readonly slot: number;
	readonly commandId: string;
	readonly label: string;
}

export function computeMenuSegments(
	slots: readonly string[],
	resolveLabel: (commandId: string) => string = (id) => id,
): readonly RadialSegment[] {
	const segments: RadialSegment[] = [];
	for (const [slot, commandId] of slots.entries()) {
		const trimmed = commandId.trim();
		if (trimmed.length === 0) {
			continue;
		}
		segments.push(
			Object.freeze({ slot, commandId: trimmed, label: resolveLabel(trimmed) }),
		);
	}
	return Object.freeze(segments);
}

export function resolveSegmentAtPoint(input: {
	readonly dx: number;
	readonly dy: number;
	readonly segmentCount: number;
	readonly deadZone?: number;
}): number | null {
	if (input.segmentCount <= 0) {
		return null;
	}
	const deadZone = input.deadZone ?? RADIAL_DEAD_ZONE_PX;
	const distance = Math.hypot(input.dx, input.dy);
	if (distance < deadZone) {
		return null;
	}
	// Angle measured clockwise from straight up, so segment 0 sits at the top.
	const angle = Math.atan2(input.dx, -input.dy);
	const normalized = (angle + Math.PI * 2) % (Math.PI * 2);
	const step = (Math.PI * 2) / input.segmentCount;
	return Math.round(normalized / step) % input.segmentCount;
}

export function segmentOffset(
	index: number,
	segmentCount: number,
	radius: number = RADIAL_RADIUS_PX,
): Readonly<{ x: number; y: number }> {
	const step = (Math.PI * 2) / Math.max(segmentCount, 1);
	const angle = step * index;
	return Object.freeze({
		x: Math.sin(angle) * radius,
		y: -Math.cos(angle) * radius,
	});
}

export interface RadialMenuOptions {
	readonly document: Document;
	readonly x: number;
	readonly y: number;
	readonly segments: readonly RadialSegment[];
	readonly pointerId?: number;
	readonly onSelect: (segment: RadialSegment) => void;
	readonly onCancel?: () => void;
}

export function openRadialMenu(options: RadialMenuOptions): () => void {
	const { document: doc, segments } = options;
	const overlay = doc.createElement('div');
	overlay.className = 'bullet-zoom-radial-overlay';
	const menu = doc.createElement('div');
	menu.className = 'bullet-zoom-radial-menu';
	menu.style.left = `${options.x}px`;
	menu.style.top = `${options.y}px`;
	overlay.append(menu);

	const centre = doc.createElement('button');
	centre.className = 'bullet-zoom-radial-cancel';
	centre.type = 'button';
	centre.setAttribute('aria-label', 'Close menu');
	centre.textContent = '×';
	menu.append(centre);

	const buttons: HTMLButtonElement[] = [];
	for (const [index, segment] of segments.entries()) {
		const offset = segmentOffset(index, segments.length);
		const button = doc.createElement('button');
		button.className = 'bullet-zoom-radial-item';
		button.type = 'button';
		button.dataset.slot = String(segment.slot);
		button.dataset.commandId = segment.commandId;
		button.textContent = segment.label;
		button.style.transform = `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`;
		menu.append(button);
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

	const highlight = (index: number | null): void => {
		for (const [buttonIndex, button] of buttons.entries()) {
			button.classList.toggle('is-active', buttonIndex === index);
		}
		centre.classList.toggle('is-active', index === null);
	};

	overlay.addEventListener('pointermove', (event) => {
		if (
			options.pointerId !== undefined &&
			event.pointerId !== options.pointerId
		) {
			return;
		}
		highlight(
			resolveSegmentAtPoint({
				dx: event.clientX - options.x,
				dy: event.clientY - options.y,
				segmentCount: segments.length,
			}),
		);
	});
	overlay.addEventListener('pointerup', (event) => {
		if (
			options.pointerId === undefined ||
			event.pointerId !== options.pointerId
		) {
			return;
		}
		const index = resolveSegmentAtPoint({
			dx: event.clientX - options.x,
			dy: event.clientY - options.y,
			segmentCount: segments.length,
		});
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
