import { describe, expect, it } from 'vitest';

import {
	COMMAND_PICKER_LIMIT,
	filterCommandEntries,
	readCommandEntries,
} from '../src/command-catalog';

describe('readCommandEntries', () => {
	it('reads the full registry rather than only what can run now', () => {
		const entries = readCommandEntries({
			commands: {
				'app:go-back': { id: 'app:go-back', name: 'Go back', icon: 'arrow-left' },
			},
			editorCommands: {
				'bullet-zoom:copy-bullet': {
					id: 'bullet-zoom:copy-bullet',
					name: 'Copy bullet',
					icon: 'copy',
				},
			},
			listCommands: () => [],
		});
		expect(entries.map((entry) => entry.id)).toEqual([
			'bullet-zoom:copy-bullet',
			'app:go-back',
		]);
		expect(entries[0]?.icon).toBe('copy');
	});

	it('falls back to the listing when the registries are missing', () => {
		const entries = readCommandEntries({
			listCommands: () => [{ id: 'x:one', name: 'One', icon: 'star' }],
		});
		expect(entries).toEqual([{ id: 'x:one', name: 'One', icon: 'star' }]);
	});

	it('keeps the first entry for an id and fills missing fields', () => {
		const entries = readCommandEntries({
			commands: { 'x:one': { name: 'From record' } },
			listCommands: () => [{ id: 'x:one', name: 'From listing', icon: 'star' }],
		});
		expect(entries).toEqual([{ id: 'x:one', name: 'From record', icon: '' }]);
	});

	it('survives a hostile or absent registry', () => {
		expect(readCommandEntries(null)).toEqual([]);
		expect(readCommandEntries({ commands: 42 })).toEqual([]);
		expect(
			readCommandEntries({
				listCommands: () => {
					throw new Error('nope');
				},
			}),
		).toEqual([]);
		expect(readCommandEntries({ commands: { 'x:one': null } })).toEqual([]);
	});
});

describe('filterCommandEntries', () => {
	const entries = [
		{ id: 'bullet-zoom:copy-bullet', name: 'Bullet Zoom: Copy bullet', icon: '' },
		{ id: 'bullet-zoom:cut-bullet', name: 'Bullet Zoom: Cut bullet', icon: '' },
		{ id: 'editor:toggle-bold', name: 'Toggle bold', icon: '' },
	];

	it('matches every term against the name and the id', () => {
		expect(filterCommandEntries(entries, 'cut bul').map((e) => e.id)).toEqual([
			'bullet-zoom:cut-bullet',
		]);
		expect(filterCommandEntries(entries, 'toggle-bold').map((e) => e.id)).toEqual([
			'editor:toggle-bold',
		]);
	});

	it('puts name-prefix matches first', () => {
		const filtered = filterCommandEntries(
			[
				{ id: 'a', name: 'Zoom out', icon: '' },
				{ id: 'b', name: 'Bullet Zoom: Zoom in', icon: '' },
			],
			'zoom',
		);
		expect(filtered.map((entry) => entry.id)).toEqual(['a', 'b']);
	});

	it('returns everything up to the limit for an empty query', () => {
		const many = Array.from({ length: 200 }, (_, index) => ({
			id: `x:${index}`,
			name: `Command ${index}`,
			icon: '',
		}));
		expect(filterCommandEntries(many, '  ')).toHaveLength(COMMAND_PICKER_LIMIT);
		expect(filterCommandEntries(many, 'command', 5)).toHaveLength(5);
	});

	it('returns nothing when no command matches', () => {
		expect(filterCommandEntries(entries, 'nonsense')).toEqual([]);
	});
});
