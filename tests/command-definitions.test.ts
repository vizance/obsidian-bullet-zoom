import { describe, expect, it } from 'vitest';

import {
	EXIT_FOCUS_COMMAND,
	PARENT_FOCUS_COMMAND,
} from '../src/command-definitions';

describe('parent focus command definition', () => {
	it('registers a stable command without claiming a default hotkey', () => {
		expect(PARENT_FOCUS_COMMAND).toEqual({
			id: 'bullet-zoom-focus-parent',
			name: 'Go to parent bullet',
		});
		expect(PARENT_FOCUS_COMMAND).not.toHaveProperty('hotkeys');
	});

	it('keeps the direct exit command available without changing its identity', () => {
		expect(EXIT_FOCUS_COMMAND).toEqual({
			id: 'bullet-zoom-exit',
			name: 'Exit bullet focus',
		});
	});
});
