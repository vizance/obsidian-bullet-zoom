import { describe, expect, it } from 'vitest';

import { readCommandEntries } from '../src/command-catalog';

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
