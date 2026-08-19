export const ICON_PICKER_LIMIT = 120;

const ICON_SET_PREFIXES = ['lucide-', 'obsidian-'];

/**
 * Icon ids carry the set they come from, which is noise when you are looking
 * for a picture. `lucide-file-output` reads as `file output`.
 */
export function iconLabel(id: string): string {
	let name = id.trim();
	for (const prefix of ICON_SET_PREFIXES) {
		if (name.startsWith(prefix)) {
			name = name.slice(prefix.length);
			break;
		}
	}
	return name.replace(/[-_]+/g, ' ').trim();
}

export function filterIconIds(
	ids: readonly string[],
	query: string,
	limit: number = ICON_PICKER_LIMIT,
): readonly string[] {
	const needle = query.trim().toLowerCase().replace(/[-_]+/g, ' ');
	if (needle.length === 0) {
		return Object.freeze(ids.slice(0, limit));
	}
	const starts: string[] = [];
	const contains: string[] = [];
	for (const id of ids) {
		const label = iconLabel(id).toLowerCase();
		if (label.startsWith(needle) || id.toLowerCase().startsWith(needle)) {
			starts.push(id);
		} else if (label.includes(needle) || id.toLowerCase().includes(needle)) {
			contains.push(id);
		}
		if (starts.length >= limit) {
			break;
		}
	}
	return Object.freeze([...starts, ...contains].slice(0, limit));
}
