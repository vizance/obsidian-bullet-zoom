export interface BulletZoomSettings {
	readonly titleScale: number;
	readonly outlineScale: number;
	readonly zoomBullets: boolean;
	readonly zoomNumbered: boolean;
	readonly extractRemoveTopBullet: boolean;
	readonly extractFolder: string;
	readonly extractTemplatePath: string;
	readonly extractReplacement: ExtractReplacement;
}

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
});

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

function normalizeReplacement(value: unknown): ExtractReplacement {
	return value === 'embed' || value === 'none' ? value : 'link';
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
	});
}

export function applyScaleVariables(
	body: HTMLElement,
	settings: BulletZoomSettings,
): void {
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
	body.style.removeProperty(TITLE_SCALE_PROPERTY);
	body.style.removeProperty(OUTLINE_SCALE_PROPERTY);
}
