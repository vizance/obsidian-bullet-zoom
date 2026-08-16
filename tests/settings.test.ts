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
		).toEqual({
			titleScale: 100,
			outlineScale: SCALE_MAX,
			zoomBullets: true,
			zoomNumbered: true,
			extractRemoveTopBullet: true,
			extractFolder: '',
			extractTemplatePath: '',
			extractReplacement: 'link',
			extractOpenBehavior: 'stay',
		});
	});

	it('clamps out-of-range numbers and rounds fractions', () => {
		expect(
			normalizeSettings({ titleScale: -5, outlineScale: 87.6 }),
		).toEqual({
			titleScale: SCALE_MIN,
			outlineScale: 88,
			zoomBullets: true,
			zoomNumbered: true,
			extractRemoveTopBullet: true,
			extractFolder: '',
			extractTemplatePath: '',
			extractReplacement: 'link',
			extractOpenBehavior: 'stay',
		});
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
			zoomBullets: true,
			zoomNumbered: true,
			extractRemoveTopBullet: true,
			extractFolder: '',
			extractTemplatePath: '',
			extractReplacement: 'link',
			extractOpenBehavior: 'stay',
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
		expect(plugin.settings).toEqual({
			titleScale: 130,
			outlineScale: 100,
			zoomBullets: true,
			zoomNumbered: true,
			extractRemoveTopBullet: true,
			extractFolder: '',
			extractTemplatePath: '',
			extractReplacement: 'link',
			extractOpenBehavior: 'stay',
		});
		expect(
			document.body.style.getPropertyValue(TITLE_SCALE_PROPERTY),
		).toBe('1.3');
		expect(saveData).toHaveBeenCalledWith({
			titleScale: 130,
			outlineScale: 100,
			zoomBullets: true,
			zoomNumbered: true,
			extractRemoveTopBullet: true,
			extractFolder: '',
			extractTemplatePath: '',
			extractReplacement: 'link',
			extractOpenBehavior: 'stay',
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
		expect(plugin.settings).toEqual({
			titleScale: 130,
			outlineScale: 100,
			zoomBullets: true,
			zoomNumbered: true,
			extractRemoveTopBullet: true,
			extractFolder: '',
			extractTemplatePath: '',
			extractReplacement: 'link',
			extractOpenBehavior: 'stay',
		});
		expect(
			document.body.style.getPropertyValue(OUTLINE_SCALE_PROPERTY),
		).toBe('1');
		expect(
			document.body.style.getPropertyValue(TITLE_SCALE_PROPERTY),
		).toBe('1.3');
	});
});

describe('marker detection toggles', () => {
	it('persists toggle changes and normalizes non-boolean values', async () => {
		expect(normalizeSettings({ zoomNumbered: 'yes' }).zoomNumbered).toBe(
			true,
		);
		expect(normalizeSettings({ zoomNumbered: false }).zoomNumbered).toBe(
			false,
		);
		const plugin = new BulletZoomPlugin({} as never, {} as never);
		const saveData = vi
			.spyOn(plugin, 'saveData')
			.mockResolvedValue(undefined);
		await plugin.updateSettings({ zoomNumbered: false });
		expect(plugin.settings.zoomNumbered).toBe(false);
		expect(plugin.settings.zoomBullets).toBe(true);
		expect(saveData).toHaveBeenCalledWith({
			titleScale: 100,
			outlineScale: 100,
			zoomBullets: true,
			zoomNumbered: false,
			extractRemoveTopBullet: true,
			extractFolder: '',
			extractTemplatePath: '',
			extractReplacement: 'link',
			extractOpenBehavior: 'stay',
		});
	});
});

describe('extract settings', () => {
	it('defaults to removing the top bullet and normalizes non-boolean values', () => {
		expect(normalizeSettings({}).extractRemoveTopBullet).toBe(true);
		expect(
			normalizeSettings({ extractRemoveTopBullet: 'nope' })
				.extractRemoveTopBullet,
		).toBe(true);
		expect(
			normalizeSettings({ extractRemoveTopBullet: false })
				.extractRemoveTopBullet,
		).toBe(false);
	});
});

describe('extract folder setting', () => {
	it('defaults to empty and normalizes surrounding slashes and non-strings', () => {
		expect(normalizeSettings({}).extractFolder).toBe('');
		expect(normalizeSettings({ extractFolder: '/Cards/' }).extractFolder).toBe(
			'Cards',
		);
		expect(
			normalizeSettings({ extractFolder: '  Cards/Sub  ' }).extractFolder,
		).toBe('Cards/Sub');
		expect(normalizeSettings({ extractFolder: 42 }).extractFolder).toBe('');
	});
});

describe('extract template setting', () => {
	it('defaults to empty and normalizes the path', () => {
		expect(normalizeSettings({}).extractTemplatePath).toBe('');
		expect(
			normalizeSettings({ extractTemplatePath: ' /Templates/card.md ' })
				.extractTemplatePath,
		).toBe('Templates/card.md');
		expect(
			normalizeSettings({ extractTemplatePath: 7 }).extractTemplatePath,
		).toBe('');
	});
});

describe('extract replacement setting', () => {
	it('defaults to link and normalizes unknown values', () => {
		expect(normalizeSettings({}).extractReplacement).toBe('link');
		expect(
			normalizeSettings({ extractReplacement: 'embed' }).extractReplacement,
		).toBe('embed');
		expect(
			normalizeSettings({ extractReplacement: 'none' }).extractReplacement,
		).toBe('none');
		expect(
			normalizeSettings({ extractReplacement: 'whatever' })
				.extractReplacement,
		).toBe('link');
	});
});

describe('extract open behavior setting', () => {
	it('defaults to stay and normalizes unknown values', () => {
		expect(normalizeSettings({}).extractOpenBehavior).toBe('stay');
		for (const behavior of ['current', 'tab', 'split'] as const) {
			expect(
				normalizeSettings({ extractOpenBehavior: behavior })
					.extractOpenBehavior,
			).toBe(behavior);
		}
		expect(
			normalizeSettings({ extractOpenBehavior: 'popout' })
				.extractOpenBehavior,
		).toBe('stay');
		expect(
			normalizeSettings({ extractOpenBehavior: 3 }).extractOpenBehavior,
		).toBe('stay');
	});
});
