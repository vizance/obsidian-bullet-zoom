import { describe, expect, it } from 'vitest';

import {
	filterIconIds,
	ICON_PICKER_LIMIT,
	iconLabel,
} from '../src/icon-picker';

describe('iconLabel', () => {
	it('drops the icon set prefix and reads as words', () => {
		expect(iconLabel('lucide-file-output')).toBe('file output');
		expect(iconLabel('obsidian-vault')).toBe('vault');
		expect(iconLabel('custom_icon')).toBe('custom icon');
	});
});

describe('filterIconIds', () => {
	it('puts prefix matches before substring matches', () => {
		const filtered = filterIconIds(
			['lucide-align-left', 'lucide-star-off', 'lucide-star', 'lucide-restart'],
			'star',
		);
		expect(filtered).toEqual([
			'lucide-star-off',
			'lucide-star',
			'lucide-restart',
		]);
	});

	it('keeps the source order among prefix matches', () => {
		expect(
			filterIconIds(
				['lucide-star', 'lucide-star-off', 'lucide-align-left'],
				'star',
			),
		).toEqual(['lucide-star', 'lucide-star-off']);
	});

	it('matches labels written with spaces', () => {
		expect(
			filterIconIds(['lucide-file-output', 'lucide-folder'], 'file out'),
		).toEqual(['lucide-file-output']);
	});

	it('caps the list at the limit', () => {
		const ids = Array.from({ length: 500 }, (_, index) => `lucide-icon-${index}`);
		expect(filterIconIds(ids, '')).toHaveLength(ICON_PICKER_LIMIT);
		expect(filterIconIds(ids, '', 10)).toHaveLength(10);
		expect(filterIconIds(ids, 'icon', 25)).toHaveLength(25);
	});
});
