import { describe, expect, it } from 'vitest';

import {
	collectFolderPaths,
	filterFolderSuggestions,
	FOLDER_SUGGESTION_LIMIT,
} from '../src/folder-suggest';

function folder(path: string): { path: string; children: unknown[] } {
	return { path, children: [] };
}

function file(path: string): { path: string } {
	return { path };
}

describe('collectFolderPaths', () => {
	it('keeps folders only, drops the root, and sorts them', () => {
		const vault = {
			getAllLoadedFiles: () => [
				folder('Notes'),
				file('Notes/a.md'),
				folder('Archive/Cards'),
				folder(''),
				folder('Cards'),
				folder('Cards'),
			],
		};
		expect(collectFolderPaths(vault)).toEqual([
			'Archive/Cards',
			'Cards',
			'Notes',
		]);
	});

	it('returns an empty list when the vault is unavailable', () => {
		expect(collectFolderPaths(null)).toEqual([]);
		expect(collectFolderPaths({})).toEqual([]);
	});
});

describe('filterFolderSuggestions', () => {
	it('orders prefix matches before other substring matches', () => {
		const paths = ['Archive/Cards', 'Cards', 'Notes'];
		expect(filterFolderSuggestions(paths, 'car')).toEqual([
			'Cards',
			'Archive/Cards',
		]);
	});

	it('returns leading suggestions for an empty query, bounded by the limit', () => {
		const paths = Array.from({ length: 20 }, (_, index) =>
			`Folder${String(index).padStart(2, '0')}`,
		);
		const suggestions = filterFolderSuggestions(paths, '');
		expect(suggestions).toHaveLength(FOLDER_SUGGESTION_LIMIT);
		expect(suggestions[0]).toBe('Folder00');
	});

	it('matches case-insensitively and respects a custom limit', () => {
		const paths = ['Cards/Inbox', 'cards/Done', 'Notes'];
		expect(filterFolderSuggestions(paths, 'CARDS', 1)).toEqual(['Cards/Inbox']);
	});
});
