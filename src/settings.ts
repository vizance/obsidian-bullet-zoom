export interface BulletZoomSettings {
	readonly titleScale: number;
	readonly outlineScale: number;
	readonly zoomBullets: boolean;
	readonly zoomNumbered: boolean;
	readonly extractRemoveTopBullet: boolean;
	readonly extractFolder: string;
	readonly extractTemplatePath: string;
	readonly extractReplacement: ExtractReplacement;
	readonly extractOpenBehavior: ExtractOpenBehavior;
	readonly focusIndentGuides: boolean;
	readonly autoFixStrayLines: boolean;
	readonly bulletCopyScope: BulletCopyScope;
	readonly bulletPrefixText: string;
	readonly radialMenuEnabled: boolean;
	readonly radialPressDuration: number;
	readonly radialSlots: readonly string[];
}

export type BulletCopyScope = 'text' | 'branch';

export const RADIAL_SLOT_COUNT = 8;
export const RADIAL_PRESS_MIN = 250;
export const RADIAL_PRESS_MAX = 1000;
export const DEFAULT_BULLET_PREFIX = '> [!note] ';
export const DEFAULT_RADIAL_SLOTS: readonly string[] = Object.freeze([
	'bullet-zoom:copy-bullet',
	'bullet-zoom:delete-bullet',
	'bullet-zoom:insert-bullet-prefix',
	'bullet-zoom:bullet-zoom-focus-current',
	'bullet-zoom:extract-bullet-to-note',
	'',
	'',
	'',
]);

export type ExtractOpenBehavior = 'stay' | 'current' | 'tab' | 'split';

export type ExtractReplacement = 'link' | 'embed' | 'none';

export const EXTRACT_REPLACEMENTS: readonly ExtractReplacement[] = Object.freeze(
	['link', 'embed', 'none'],
);

export const SCALE_MIN = 60;
export const SCALE_MAX = 160;
export const SCALE_STEP = 5;

export const DEFAULT_SETTINGS: BulletZoomSettings = Object.freeze({
	titleScale: 100,
	outlineScale: 100,
	zoomBullets: true,
	zoomNumbered: true,
	extractRemoveTopBullet: true,
	extractFolder: '',
	extractTemplatePath: '',
	extractReplacement: 'link',
	extractOpenBehavior: 'stay',
	focusIndentGuides: true,
	autoFixStrayLines: true,
	bulletCopyScope: 'text',
	bulletPrefixText: DEFAULT_BULLET_PREFIX,
	radialMenuEnabled: true,
	radialPressDuration: 450,
	radialSlots: DEFAULT_RADIAL_SLOTS,
});

export const INDENT_GUIDES_CLASS = 'bullet-zoom-indent-guides';
export const TITLE_SCALE_PROPERTY = '--bullet-zoom-title-scale';
export const OUTLINE_SCALE_PROPERTY = '--bullet-zoom-outline-scale';

function normalizeScale(value: unknown, fallback: number): number {
	if (typeof value !== 'number' || Number.isNaN(value)) {
		return fallback;
	}
	const rounded = Math.round(value);
	if (rounded < SCALE_MIN) {
		return SCALE_MIN;
	}
	if (rounded > SCALE_MAX) {
		return SCALE_MAX;
	}
	return rounded;
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
	return typeof value === 'boolean' ? value : fallback;
}

function normalizeCopyScope(value: unknown): BulletCopyScope {
	return value === 'branch' ? 'branch' : 'text';
}

function normalizePressDuration(value: unknown): number {
	if (typeof value !== 'number' || Number.isNaN(value)) {
		return DEFAULT_SETTINGS.radialPressDuration;
	}
	const rounded = Math.round(value);
	if (rounded < RADIAL_PRESS_MIN) {
		return RADIAL_PRESS_MIN;
	}
	if (rounded > RADIAL_PRESS_MAX) {
		return RADIAL_PRESS_MAX;
	}
	return rounded;
}

function normalizeSlots(value: unknown): readonly string[] {
	if (!Array.isArray(value)) {
		return DEFAULT_RADIAL_SLOTS;
	}
	const slots: string[] = [];
	for (let index = 0; index < RADIAL_SLOT_COUNT; index += 1) {
		const entry: unknown = value[index];
		slots.push(typeof entry === 'string' ? entry.trim() : '');
	}
	return Object.freeze(slots);
}

function normalizeReplacement(value: unknown): ExtractReplacement {
	return value === 'embed' || value === 'none' ? value : 'link';
}

function normalizeOpenBehavior(value: unknown): ExtractOpenBehavior {
	return value === 'current' || value === 'tab' || value === 'split'
		? value
		: 'stay';
}

function normalizeFolder(value: unknown): string {
	if (typeof value !== 'string') {
		return '';
	}
	return value.trim().replace(/^\/+/, '').replace(/\/+$/, '');
}

export function normalizeSettings(raw: unknown): BulletZoomSettings {
	const source =
		typeof raw === 'object' && raw !== null
			? (raw as Record<string, unknown>)
			: {};
	return Object.freeze({
		titleScale: normalizeScale(
			source['titleScale'],
			DEFAULT_SETTINGS.titleScale,
		),
		outlineScale: normalizeScale(
			source['outlineScale'],
			DEFAULT_SETTINGS.outlineScale,
		),
		zoomBullets: normalizeBoolean(
			source['zoomBullets'],
			DEFAULT_SETTINGS.zoomBullets,
		),
		zoomNumbered: normalizeBoolean(
			source['zoomNumbered'],
			DEFAULT_SETTINGS.zoomNumbered,
		),
		extractRemoveTopBullet: normalizeBoolean(
			source['extractRemoveTopBullet'],
			DEFAULT_SETTINGS.extractRemoveTopBullet,
		),
		extractFolder: normalizeFolder(source['extractFolder']),
		extractTemplatePath: normalizeFolder(source['extractTemplatePath']),
		extractReplacement: normalizeReplacement(source['extractReplacement']),
		extractOpenBehavior: normalizeOpenBehavior(
			source['extractOpenBehavior'],
		),
		focusIndentGuides: normalizeBoolean(
			source['focusIndentGuides'],
			DEFAULT_SETTINGS.focusIndentGuides,
		),
		autoFixStrayLines: normalizeBoolean(
			source['autoFixStrayLines'],
			DEFAULT_SETTINGS.autoFixStrayLines,
		),
		bulletCopyScope: normalizeCopyScope(source['bulletCopyScope']),
		bulletPrefixText:
			typeof source['bulletPrefixText'] === 'string'
				? source['bulletPrefixText']
				: DEFAULT_BULLET_PREFIX,
		radialMenuEnabled: normalizeBoolean(
			source['radialMenuEnabled'],
			DEFAULT_SETTINGS.radialMenuEnabled,
		),
		radialPressDuration: normalizePressDuration(source['radialPressDuration']),
		radialSlots: normalizeSlots(source['radialSlots']),
	});
}

export function applyScaleVariables(
	body: HTMLElement,
	settings: BulletZoomSettings,
): void {
	body.classList.toggle(INDENT_GUIDES_CLASS, settings.focusIndentGuides);
	body.style.setProperty(
		TITLE_SCALE_PROPERTY,
		String(settings.titleScale / 100),
	);
	body.style.setProperty(
		OUTLINE_SCALE_PROPERTY,
		String(settings.outlineScale / 100),
	);
}

export function clearScaleVariables(body: HTMLElement): void {
	body.classList.remove(INDENT_GUIDES_CLASS);
	body.style.removeProperty(TITLE_SCALE_PROPERTY);
	body.style.removeProperty(OUTLINE_SCALE_PROPERTY);
}
