import { describe, expect, it, vi } from 'vitest';

import {
	computeMenuSegments,
	openRadialMenu,
	RADIAL_DEAD_ZONE_PX,
	resolveSegmentAtPoint,
} from '../src/radial-menu';

describe('computeMenuSegments', () => {
	it('keeps only filled slots and preserves their order', () => {
		const segments = computeMenuSegments(['copy', '', 'delete']);
		expect(segments).toHaveLength(2);
		expect(segments[0]).toMatchObject({ slot: 0, commandId: 'copy' });
		expect(segments[1]).toMatchObject({ slot: 2, commandId: 'delete' });
	});

	it('resolves labels and trims ids', () => {
		const segments = computeMenuSegments(
			['  copy  '],
			(id) => (id === 'copy' ? 'Copy bullet' : id),
		);
		expect(segments[0]?.commandId).toBe('copy');
		expect(segments[0]?.label).toBe('Copy bullet');
	});
});

describe('resolveSegmentAtPoint', () => {
	it('maps directions to segments with the first slot at the top', () => {
		const base = { segmentCount: 4 };
		expect(resolveSegmentAtPoint({ ...base, dx: 0, dy: -80 })).toBe(0);
		expect(resolveSegmentAtPoint({ ...base, dx: 80, dy: 0 })).toBe(1);
		expect(resolveSegmentAtPoint({ ...base, dx: 0, dy: 80 })).toBe(2);
		expect(resolveSegmentAtPoint({ ...base, dx: -80, dy: 0 })).toBe(3);
	});

	it('returns null inside the dead zone or with no segments', () => {
		expect(
			resolveSegmentAtPoint({
				dx: RADIAL_DEAD_ZONE_PX - 5,
				dy: 0,
				segmentCount: 4,
			}),
		).toBeNull();
		expect(
			resolveSegmentAtPoint({ dx: 80, dy: 0, segmentCount: 0 }),
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
			segments: computeMenuSegments(['copy', 'delete']),
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
			segments: computeMenuSegments(['copy', 'delete', 'prefix', 'zoom']),
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
			segments: computeMenuSegments(['copy', 'delete']),
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
			segments: computeMenuSegments(['copy', 'delete']),
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
			segments: computeMenuSegments(['copy']),
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
