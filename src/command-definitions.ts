import type { Command } from 'obsidian';

type CommandMetadata = Pick<Command, 'id' | 'name'>;

export const EXIT_FOCUS_COMMAND: CommandMetadata = {
	id: 'bullet-zoom-exit',
	name: '退出 Bullet 聚焦',
};

export const PARENT_FOCUS_COMMAND: CommandMetadata = {
	id: 'bullet-zoom-focus-parent',
	name: '回到上一層 Bullet',
};
