import type { Command } from 'obsidian';

type CommandMetadata = Pick<Command, 'id' | 'name'>;

export const EXIT_FOCUS_COMMAND: CommandMetadata = {
	id: 'bullet-zoom-exit',
	name: 'Exit bullet focus',
};

export const PARENT_FOCUS_COMMAND: CommandMetadata = {
	id: 'bullet-zoom-focus-parent',
	name: 'Go to parent bullet',
};
