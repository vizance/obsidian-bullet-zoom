import { afterEach, describe, expect, it, vi } from 'vitest';

import {
	computeFanLayout,
	computeMenuSegments,
	openRadialMenu,
	RADIAL_DEAD_ZONE_PX,
	resolveNearestItem,
} from '../src/radial-menu';

afterEach(() => {
	for (const overlay of Array.from(
		document.querySelectorAll('.bullet-zoom-radial-overlay'),
	)) {
		overlay.remove();
	}
});

function slots(...entries: Array<string | [string, boolean]>) {
	return entries.map((entry) =>
		typeof entry === 'string'
			? { commandId: entry, enabled: entry.length > 0 }
			: { commandId: entry[0], enabled: entry[1] },
	);
}

describe('computeMenuSegments', () => {
	it('keeps only filled slots and preserves their order', () => {
		const segments = computeMenuSegments(slots('copy', '', 'delete'));
		expect(segments).toHaveLength(2);
		expect(segments[0]).toMatchObject({ slot: 0, commandId: 'copy' });
		expect(segments[1]).toMatchObject({ slot: 2, commandId: 'delete' });
	});

	it('resolves labels and trims ids', () => {
		const segments = computeMenuSegments(
			slots('  copy  '),
			(id) => (id === 'copy' ? 'Copy bullet' : id),
		);
		expect(segments[0]?.commandId).toBe('copy');
		expect(segments[0]?.label).toBe('Copy bullet');
	});
});

describe('computeMenuSegments enabled flag', () => {
	it('skips disabled slots but keeps their command ids intact', () => {
		const configured = slots('copy', ['delete', false]);
		const segments = computeMenuSegments(configured);
		expect(segments).toHaveLength(1);
		expect(segments[0]?.commandId).toBe('copy');
		expect(configured[1]?.commandId).toBe('delete');
	});
});

describe('computeFanLayout', () => {
	const viewport = { viewportWidth: 400, viewportHeight: 800 };

	it('opens right and stays on screen near the left edge', () => {
		const layout = computeFanLayout({
			...viewport,
			x: 30,
			y: 400,
			count: 4,
			radius: 96,
		});
		expect(layout.side).toBe('right');
		for (const item of layout.items) {
			expect(item.x).toBeGreaterThan(30);
			expect(item.x).toBeLessThan(400);
		}
	});

	it('opens left near the right edge', () => {
		const layout = computeFanLayout({
			...viewport,
			x: 370,
			y: 400,
			count: 4,
			radius: 96,
		});
		expect(layout.side).toBe('left');
		for (const item of layout.items) {
			expect(item.x).toBeLessThan(370);
			expect(item.x).toBeGreaterThan(0);
		}
	});

	it('keeps items inside the viewport near the top', () => {
		const layout = computeFanLayout({
			...viewport,
			x: 30,
			y: 40,
			count: 4,
			radius: 96,
		});
		for (const item of layout.items) {
			expect(item.y).toBeGreaterThanOrEqual(0);
			expect(item.y).toBeLessThanOrEqual(800);
		}
	});
});

describe('resolveNearestItem', () => {
	const items = [
		{ x: 100, y: 50 },
		{ x: 100, y: 150 },
	];

	it('picks the closest item within the hit radius', () => {
		expect(
			resolveNearestItem({
				x: 105,
				y: 140,
				originX: 40,
				originY: 100,
				items,
				hitRadius: 60,
			}),
		).toBe(1);
	});

	it('returns null inside the dead zone or out of reach', () => {
		expect(
			resolveNearestItem({
				x: 42,
				y: 100,
				originX: 40,
				originY: 100,
				items,
				hitRadius: 60,
			}),
		).toBeNull();
		expect(
			resolveNearestItem({
				x: 400,
				y: 400,
				originX: 40,
				originY: 100,
				items,
				hitRadius: 60,
			}),
		).toBeNull();
	});
});

describe('openRadialMenu', () => {
	function pointer(type: string, x: number, y: number): Event {
		const event = new MouseEvent(type, {
			bubbles: true,
			cancelable: true,
			clientX: x,
			clientY: y,
		});
		Object.defineProperty(event, 'pointerId', { value: 7 });
		return event;
	}

	it('renders one button per segment plus a cancel control', () => {
		const close = openRadialMenu({
			document,
			x: 100,
			y: 100,
			segments: computeMenuSegments(slots('copy', 'delete')),
			onSelect: vi.fn(),
		});
		expect(
			document.querySelectorAll('.bullet-zoom-radial-item'),
		).toHaveLength(2);
		expect(document.querySelector('.bullet-zoom-radial-cancel')).not.toBeNull();
		close();
		expect(document.querySelector('.bullet-zoom-radial-overlay')).toBeNull();
	});

	it('selects the segment under the pointer on release', () => {
		const onSelect = vi.fn();
		openRadialMenu({
			document,
			x: 100,
			y: 100,
			segments: computeMenuSegments(slots('copy', 'delete', 'prefix', 'zoom')),
			pointerId: 7,
			onSelect,
		});
		const overlay = document.querySelector('.bullet-zoom-radial-overlay');
		overlay?.dispatchEvent(pointer('pointerup', 180, 100));
		expect(onSelect).toHaveBeenCalledTimes(1);
		expect(onSelect.mock.calls[0]?.[0]).toMatchObject({ commandId: 'delete' });
		expect(document.querySelector('.bullet-zoom-radial-overlay')).toBeNull();
	});

	it('cancels when released in the centre', () => {
		const onSelect = vi.fn();
		const onCancel = vi.fn();
		openRadialMenu({
			document,
			x: 100,
			y: 100,
			segments: computeMenuSegments(slots('copy', 'delete')),
			pointerId: 7,
			onSelect,
			onCancel,
		});
		document
			.querySelector('.bullet-zoom-radial-overlay')
			?.dispatchEvent(pointer('pointerup', 102, 101));
		expect(onSelect).not.toHaveBeenCalled();
		expect(onCancel).toHaveBeenCalledTimes(1);
	});

	it('runs a command when a button is tapped after release', () => {
		const onSelect = vi.fn();
		openRadialMenu({
			document,
			x: 100,
			y: 100,
			segments: computeMenuSegments(slots('copy', 'delete')),
			onSelect,
		});
		document
			.querySelectorAll<HTMLButtonElement>('.bullet-zoom-radial-item')[1]
			?.click();
		expect(onSelect.mock.calls[0]?.[0]).toMatchObject({ commandId: 'delete' });
	});

	it('cancels on Escape', () => {
		const onCancel = vi.fn();
		openRadialMenu({
			document,
			x: 100,
			y: 100,
			segments: computeMenuSegments(slots('copy')),
			onSelect: vi.fn(),
			onCancel,
		});
		document.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
		);
		expect(onCancel).toHaveBeenCalledTimes(1);
		expect(document.querySelector('.bullet-zoom-radial-overlay')).toBeNull();
	});
});

describe('icons and caption', () => {
	it('renders icons through the callback and keeps the name accessible', () => {
		const renderIcon = vi.fn((element: HTMLElement) => {
			element.dataset.icon = 'set';
		});
		openRadialMenu({
			document,
			x: 40,
			y: 200,
			viewportWidth: 400,
			viewportHeight: 800,
			segments: computeMenuSegments(slots('copy'), () => 'Copy bullet'),
			renderIcon,
			onSelect: vi.fn(),
		});
		const item = document.querySelector<HTMLElement>(
			'.bullet-zoom-radial-item',
		);
		expect(renderIcon).toHaveBeenCalledTimes(1);
		expect(item?.dataset.icon).toBe('set');
		expect(item?.getAttribute('aria-label')).toBe('Copy bullet');
		expect(item?.textContent).toBe('');
	});

	it('shows the highlighted name and falls back to the cancel hint', () => {
		openRadialMenu({
			document,
			x: 40,
			y: 200,
			viewportWidth: 400,
			viewportHeight: 800,
			segments: computeMenuSegments(slots('copy', 'delete'), (id) =>
				id === 'copy' ? 'Copy bullet' : 'Delete bullet',
			),
			pointerId: 7,
			cancelHint: 'Release to cancel',
			renderIcon: () => undefined,
			onSelect: vi.fn(),
		});
		const overlay = document.querySelector('.bullet-zoom-radial-overlay');
		const caption = document.querySelector('.bullet-zoom-radial-caption');
		const target = document.querySelectorAll<HTMLElement>(
			'.bullet-zoom-radial-item',
		)[0];
		expect(caption?.textContent).toBe('Release to cancel');

		const move = new MouseEvent('pointermove', {
			bubbles: true,
			clientX: Number.parseFloat(target?.style.left ?? '0'),
			clientY: Number.parseFloat(target?.style.top ?? '0'),
		});
		Object.defineProperty(move, 'pointerId', { value: 7 });
		overlay?.dispatchEvent(move);
		expect(caption?.textContent).toBe('Copy bullet');

		const back = new MouseEvent('pointermove', {
			bubbles: true,
			clientX: 40,
			clientY: 200,
		});
		Object.defineProperty(back, 'pointerId', { value: 7 });
		overlay?.dispatchEvent(back);
		expect(caption?.textContent).toBe('Release to cancel');
	});
});

describe('visible viewport handling (1.14.0)', () => {
	it('keeps items above a keyboard that covers the lower half', () => {
		const layout = computeFanLayout({
			x: 30,
			y: 380,
			count: 4,
			viewportWidth: 400,
			viewportHeight: 400,
			viewportTop: 0,
			radius: 96,
		});
		for (const item of layout.items) {
			expect(item.y).toBeGreaterThanOrEqual(0);
			expect(item.y).toBeLessThanOrEqual(400);
		}
	});

	it('respects a visible band that starts below the top', () => {
		const layout = computeFanLayout({
			x: 30,
			y: 380,
			count: 4,
			viewportWidth: 400,
			viewportHeight: 300,
			viewportTop: 100,
			radius: 96,
		});
		for (const item of layout.items) {
			expect(item.y).toBeGreaterThanOrEqual(100);
			expect(item.y).toBeLessThanOrEqual(400);
		}
	});

	it('flips the caption above a centre near the bottom', () => {
		openRadialMenu({
			document,
			x: 40,
			y: 390,
			viewportWidth: 400,
			viewportHeight: 400,
			viewportTop: 0,
			segments: computeMenuSegments(slots('copy')),
			renderIcon: () => undefined,
			onSelect: vi.fn(),
		});
		const caption = document.querySelector<HTMLElement>(
			'.bullet-zoom-radial-caption',
		);
		const centre = document.querySelector<HTMLElement>(
			'.bullet-zoom-radial-cancel',
		);
		expect(Number.parseFloat(caption?.style.top ?? '0')).toBeLessThan(
			Number.parseFloat(centre?.style.top ?? '0'),
		);
	});

	it('staggers the entrance delay per item', () => {
		openRadialMenu({
			document,
			x: 40,
			y: 200,
			viewportWidth: 400,
			viewportHeight: 800,
			segments: computeMenuSegments(slots('a', 'b', 'c')),
			renderIcon: () => undefined,
			onSelect: vi.fn(),
		});
		const delays = Array.from(
			document.querySelectorAll<HTMLElement>('.bullet-zoom-radial-item'),
		).map((item) =>
			Number.parseFloat(
				item.style.getPropertyValue('--bullet-zoom-radial-delay'),
			),
		);
		expect(delays).toHaveLength(3);
		expect(delays[1]).toBeGreaterThan(delays[0] ?? 0);
		expect(delays[2]).toBeGreaterThan(delays[1] ?? 0);
	});
});
