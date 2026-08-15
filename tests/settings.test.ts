import { afterEach, describe, expect, it, vi } from 'vitest';

import BulletZoomPlugin from '../src/main';
import {
	applyScaleVariables,
	clearScaleVariables,
	DEFAULT_SETTINGS,
	normalizeSettings,
	OUTLINE_SCALE_PROPERTY,
	SCALE_MAX,
	SCALE_MIN,
	TITLE_SCALE_PROPERTY,
} from '../src/settings';

afterEach(() => {
	clearScaleVariables(document.body);
});

describe('settings normalization', () => {
	it('falls back to defaults for missing or non-numeric values', () => {
		expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
		expect(normalizeSettings({})).toEqual(DEFAULT_SETTINGS);
		expect(
			normalizeSettings({ titleScale: 'abc', outlineScale: 300 }),
		).toEqual({ titleScale: 100, outlineScale: SCALE_MAX });
	});

	it('clamps out-of-range numbers and rounds fractions', () => {
		expect(
			normalizeSettings({ titleScale: -5, outlineScale: 87.6 }),
		).toEqual({ titleScale: SCALE_MIN, outlineScale: 88 });
		expect(normalizeSettings({ titleScale: Number.NaN })).toEqual(
			DEFAULT_SETTINGS,
		);
	});
});

describe('scale variable application', () => {
	it('writes and removes both custom properties on the body', () => {
		applyScaleVariables(document.body, {
			titleScale: 130,
			outlineScale: 85,
		});
		expect(
			document.body.style.getPropertyValue(TITLE_SCALE_PROPERTY),
		).toBe('1.3');
		expect(
			document.body.style.getPropertyValue(OUTLINE_SCALE_PROPERTY),
		).toBe('0.85');
		clearScaleVariables(document.body);
		expect(
			document.body.style.getPropertyValue(TITLE_SCALE_PROPERTY),
		).toBe('');
		expect(
			document.body.style.getPropertyValue(OUTLINE_SCALE_PROPERTY),
		).toBe('');
	});
});

describe('plugin settings lifecycle', () => {
	it('persists slider changes, applies variables, and cleans up on unload', async () => {
		const plugin = new BulletZoomPlugin(
			{} as never,
			{} as never,
		);
		const saveData = vi
			.spyOn(plugin, 'saveData')
			.mockResolvedValue(undefined);

		await plugin.updateSettings({ titleScale: 130 });
		expect(plugin.settings).toEqual({ titleScale: 130, outlineScale: 100 });
		expect(
			document.body.style.getPropertyValue(TITLE_SCALE_PROPERTY),
		).toBe('1.3');
		expect(saveData).toHaveBeenCalledWith({
			titleScale: 130,
			outlineScale: 100,
		});

		await plugin.updateSettings({ outlineScale: 999 });
		expect(plugin.settings.outlineScale).toBe(SCALE_MAX);
		expect(
			document.body.style.getPropertyValue(OUTLINE_SCALE_PROPERTY),
		).toBe('1.6');

		plugin.onunload();
		expect(
			document.body.style.getPropertyValue(TITLE_SCALE_PROPERTY),
		).toBe('');
		expect(
			document.body.style.getPropertyValue(OUTLINE_SCALE_PROPERTY),
		).toBe('');
	});
});

describe('slider reset buttons', () => {
	it('resets one scale to 100 without touching the other', async () => {
		const plugin = new BulletZoomPlugin({} as never, {} as never);
		vi.spyOn(plugin, 'saveData').mockResolvedValue(undefined);
		await plugin.updateSettings({ titleScale: 130, outlineScale: 85 });

		await plugin.updateSettings({ outlineScale: 100 });
		expect(plugin.settings).toEqual({ titleScale: 130, outlineScale: 100 });
		expect(
			document.body.style.getPropertyValue(OUTLINE_SCALE_PROPERTY),
		).toBe('1');
		expect(
			document.body.style.getPropertyValue(TITLE_SCALE_PROPERTY),
		).toBe('1.3');
	});
});
