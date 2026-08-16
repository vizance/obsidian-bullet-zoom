export const FOLDER_SUGGESTION_LIMIT = 8;

interface FolderLikeFile {
	readonly path?: unknown;
	readonly children?: unknown;
}

interface VaultLike {
	getAllLoadedFiles?: () => readonly unknown[];
}

export function collectFolderPaths(vault: VaultLike | null): readonly string[] {
	const files = vault?.getAllLoadedFiles?.() ?? [];
	const paths = new Set<string>();
	for (const file of files) {
		const candidate = file as FolderLikeFile;
		if (!Array.isArray(candidate.children)) {
			continue;
		}
		const path = typeof candidate.path === 'string' ? candidate.path.trim() : '';
		if (path.length === 0 || path === '/') {
			continue;
		}
		paths.add(path);
	}
	return Object.freeze([...paths].sort((left, right) => left.localeCompare(right)));
}

export function filterFolderSuggestions(
	paths: readonly string[],
	query: string,
	limit: number = FOLDER_SUGGESTION_LIMIT,
): readonly string[] {
	const normalizedQuery = query.trim().toLowerCase();
	if (normalizedQuery.length === 0) {
		return Object.freeze(paths.slice(0, limit));
	}
	const prefixMatches: string[] = [];
	const otherMatches: string[] = [];
	for (const path of paths) {
		const normalizedPath = path.toLowerCase();
		if (normalizedPath.startsWith(normalizedQuery)) {
			prefixMatches.push(path);
		} else if (normalizedPath.includes(normalizedQuery)) {
			otherMatches.push(path);
		}
	}
	return Object.freeze([...prefixMatches, ...otherMatches].slice(0, limit));
}
