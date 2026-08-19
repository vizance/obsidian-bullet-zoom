export interface CommandEntry {
	readonly id: string;
	readonly name: string;
	readonly icon: string;
}

interface CommandLike {
	readonly id?: unknown;
	readonly name?: unknown;
	readonly icon?: unknown;
}

interface CommandRegistry {
	readonly commands?: unknown;
	readonly editorCommands?: unknown;
	readonly listCommands?: () => unknown;
}

function toEntry(value: unknown, fallbackId?: string): CommandEntry | null {
	if (typeof value !== 'object' || value === null) {
		return null;
	}
	const command = value as CommandLike;
	const id =
		typeof command.id === 'string' && command.id.length > 0
			? command.id
			: (fallbackId ?? '');
	if (id.length === 0) {
		return null;
	}
	const name = typeof command.name === 'string' && command.name.length > 0
		? command.name
		: id;
	const icon = typeof command.icon === 'string' ? command.icon : '';
	return Object.freeze({ id, name, icon });
}

function collect(source: unknown, into: Map<string, CommandEntry>): void {
	if (Array.isArray(source)) {
		for (const value of source) {
			const entry = toEntry(value);
			if (entry !== null && !into.has(entry.id)) {
				into.set(entry.id, entry);
			}
		}
		return;
	}
	if (typeof source !== 'object' || source === null) {
		return;
	}
	for (const [key, value] of Object.entries(source)) {
		const entry = toEntry(value, key);
		if (entry !== null && !into.has(entry.id)) {
			into.set(entry.id, entry);
		}
	}
}

/**
 * `listCommands()` answers "what can run right now", so editor commands drop out
 * whenever no editor is active — which is exactly the state the bullet menu
 * opens in, since it deliberately never focuses the editor. The registries hold
 * every registered command, so they are read first.
 */
export function readCommandEntries(
	registry: unknown,
): readonly CommandEntry[] {
	if (typeof registry !== 'object' || registry === null) {
		return Object.freeze([]);
	}
	const source = registry as CommandRegistry;
	const entries = new Map<string, CommandEntry>();
	collect(source.commands, entries);
	collect(source.editorCommands, entries);
	try {
		collect(source.listCommands?.(), entries);
	} catch {
		// A registry that refuses to list is still usable through its records.
	}
	return Object.freeze(
		[...entries.values()].sort((left, right) =>
			left.name.localeCompare(right.name),
		),
	);
}
