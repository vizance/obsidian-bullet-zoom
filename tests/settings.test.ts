import type { Plugin } from 'obsidian';
import { describe, expect, it, vi } from 'vitest';

import {
	BulletZoomSettingTab,
	DEFAULT_SETTINGS,
	parseBulletZoomSettings,
	persistAlwaysShowRowControls,
	type BulletZoomSettings,
} from '../src/settings';

describe('Bullet Zoom settings', () => {
	it.each([
		[undefined],
		[null],
		[[]],
		['false'],
		[0],
		[{}],
		[{ alwaysShowRowControls: 'false' }],
	])('uses the enabled default for malformed data %#', (data) => {
		expect(parseBulletZoomSettings(data)).toEqual(DEFAULT_SETTINGS);
	});

	it.each([true, false])('accepts a persisted boolean value %s', (value) => {
		expect(
			parseBulletZoomSettings({ alwaysShowRowControls: value }),
		).toEqual({ alwaysShowRowControls: value });
	});

	it('defines the native searchable toggle and saves a changed value', async () => {
		let settings: BulletZoomSettings = DEFAULT_SETTINGS;
		const setAlwaysShowRowControls = vi.fn(async (value: boolean) => {
			settings = Object.freeze({ alwaysShowRowControls: value });
			return true;
		});
		const tab = new BulletZoomSettingTab({ app: {} } as Plugin, {
			getSettings: () => settings,
			setAlwaysShowRowControls,
		});

		const definitions = tab.getSettingDefinitions();
		expect(definitions).toHaveLength(1);
		expect(definitions[0]).toMatchObject({
			name: '永遠顯示行尾縮放箭頭',
			control: {
				type: 'toggle',
				key: 'alwaysShowRowControls',
				defaultValue: true,
			},
		});
		expect(tab.getControlValue('alwaysShowRowControls')).toBe(true);
		await tab.setControlValue('alwaysShowRowControls', false);
		expect(setAlwaysShowRowControls).toHaveBeenCalledWith(false);
		expect(tab.getControlValue('alwaysShowRowControls')).toBe(false);
	});

	it('rejects the native control change when saving fails', async () => {
		const tab = new BulletZoomSettingTab({ app: {} } as Plugin, {
			getSettings: () => DEFAULT_SETTINGS,
			setAlwaysShowRowControls: vi.fn(async () => false),
		});
		await expect(
			tab.setControlValue('alwaysShowRowControls', false),
		).rejects.toThrow('could not be saved');
		expect(tab.getControlValue('alwaysShowRowControls')).toBe(true);
	});

	it('applies a value only after persistence succeeds', async () => {
		const order: string[] = [];
		const result = await persistAlwaysShowRowControls(false, {
			save: async () => {
				order.push('save');
			},
			onSaved: (settings) => {
				order.push(`apply:${String(settings.alwaysShowRowControls)}`);
			},
			onFailure: () => order.push('failure'),
		});
		expect(result).toBe(true);
		expect(order).toEqual(['save', 'apply:false']);
	});

	it('reports a rejected save without applying the new value', async () => {
		const onSaved = vi.fn();
		const onFailure = vi.fn();
		const result = await persistAlwaysShowRowControls(false, {
			save: async () => Promise.reject(new Error('disk unavailable')),
			onSaved,
			onFailure,
		});
		expect(result).toBe(false);
		expect(onSaved).not.toHaveBeenCalled();
		expect(onFailure).toHaveBeenCalledOnce();
	});
});
