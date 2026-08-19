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
	readonly radialSlots: readonly RadialSlot[];
	readonly markerTapAction: MarkerTapAction;
}

export type BulletCopyScope = 'text' | 'branch';

export const RADIAL_SLOT_COUNT = 8;
export const RADIAL_PRESS_MIN = 250;
export const RADIAL_PRESS_MAX = 1000;
export const DEFAULT_BULLET_PREFIX = '> [!note] ';
export type MarkerTapAction = 'menu' | 'zoom';

export interface RadialSlot {
	readonly commandId: string;
	readonly enabled: boolean;
	/** Obsidian icon id; empty means "use the command's own icon". */
	readonly icon: string;
}

function slot(commandId: string, enabled = true, icon = ''): RadialSlot {
	return Object.freeze({ commandId, enabled, icon });
}

export const DEFAULT_RADIAL_SLOTS: readonly RadialSlot[] = Object.freeze([
	slot('bullet-zoom:copy-bullet'),
	slot('bullet-zoom:delete-bullet'),
	slot('bullet-zoom:insert-bullet-prefix'),
	slot('bullet-zoom:bullet-zoom-focus-current'),
	slot('bullet-zoom:extract-bullet-to-note'),
	slot('bullet-zoom:clear-bullet'),
	slot('bullet-zoom:cut-bullet'),
	slot('', false),
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
	markerTapAction: 'menu',
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

function normalizeMarkerTapAction(value: unknown): MarkerTapAction {
	return value === 'zoom' ? 'zoom' : 'menu';
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

function normalizeSlots(value: unknown): readonly RadialSlot[] {
	if (!Array.isArray(value)) {
		return DEFAULT_RADIAL_SLOTS;
	}
	const slots: RadialSlot[] = [];
	for (let index = 0; index < RADIAL_SLOT_COUNT; index += 1) {
		const entry: unknown = value[index];
		if (typeof entry === 'string') {
			// Settings saved before slots gained an enabled flag.
			const commandId = entry.trim();
			slots.push(slot(commandId, commandId.length > 0));
			continue;
		}
		if (typeof entry === 'object' && entry !== null) {
			const record = entry as Record<string, unknown>;
			const commandId =
				typeof record['commandId'] === 'string'
					? record['commandId'].trim()
					: '';
			const enabled =
				typeof record['enabled'] === 'boolean'
					? record['enabled']
					: commandId.length > 0;
			const icon =
				typeof record['icon'] === 'string' ? record['icon'].trim() : '';
			slots.push(slot(commandId, enabled, icon));
			continue;
		}
		slots.push(slot('', false));
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
		markerTapAction: normalizeMarkerTapAction(source['markerTapAction']),
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
