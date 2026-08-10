import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

afterEach(() => {
	document.body.classList.remove('is-mobile');
	document.body.replaceChildren();
	document.head
		.querySelectorAll('style[data-bullet-zoom-test]')
		.forEach((style) => style.remove());
});

function readProjectFile(relativePath: string): string {
	return readFileSync(join(projectRoot, relativePath), 'utf8');
}

describe('mobile-compatible plugin bundle contract', () => {
	it('declares desktop and mobile support in the manifest', () => {
		const manifest = JSON.parse(readProjectFile('manifest.json')) as {
			id?: unknown;
			isDesktopOnly?: unknown;
			version?: unknown;
		};

		expect(manifest.id).toBe('bullet-zoom');
		expect(manifest.isDesktopOnly).toBe(false);
		expect(manifest.version).toBe('0.1.2');
	});

	it('keeps patch-version metadata aligned', () => {
		const packageManifest = JSON.parse(readProjectFile('package.json')) as {
			version?: unknown;
		};
		const packageLock = JSON.parse(readProjectFile('package-lock.json')) as {
			version?: unknown;
			packages?: { ''?: { version?: unknown } };
		};
		const versions = JSON.parse(readProjectFile('versions.json')) as Record<
			string,
			unknown
		>;

		expect(packageManifest.version).toBe('0.1.2');
		expect(packageLock.version).toBe('0.1.2');
		expect(packageLock.packages?.['']?.version).toBe('0.1.2');
		expect(versions['0.1.1']).toBe('1.11.7');
		expect(versions['0.1.2']).toBe('1.11.7');
	});

	it('keeps Node.js and Electron imports out of runtime source', () => {
		const sourceDirectory = join(projectRoot, 'src');
		const runtimeSource = readdirSync(sourceDirectory)
			.filter((fileName) => fileName.endsWith('.ts'))
			.map((fileName) => readFileSync(join(sourceDirectory, fileName), 'utf8'))
			.join('\n');
		const forbiddenRuntimeImport =
			/\b(?:from\s+|require\(\s*)['"](?:node:|electron(?:\/|['"]))/;

		expect(runtimeSource).not.toMatch(forbiddenRuntimeImport);
	});

	it('fits a long focused path in one 315 CSS-pixel mobile row', () => {
		const style = document.createElement('style');
		style.dataset.bulletZoomTest = 'true';
		style.textContent = `${readProjectFile('styles.css')}\n.bullet-zoom-test-mobile-width { width: 315px; }`;
		document.head.append(style);
		document.body.classList.add('is-mobile');
		const panel = document.createElement('nav');
		panel.className =
			'bullet-zoom-breadcrumbs bullet-zoom-test-mobile-width';

		const addBreadcrumb = (
			label: string,
			...roles: readonly string[]
		): HTMLButtonElement => {
			const button = document.createElement('button');
			button.classList.add('bullet-zoom-breadcrumb', ...roles);
			const labelElement = document.createElement('span');
			labelElement.className = 'bullet-zoom-breadcrumb-label';
			labelElement.textContent = label;
			button.append(labelElement);
			panel.append(button);
			return button;
		};

		const note = addBreadcrumb('2026-08-10 daily note', 'is-note');
		const hiddenAncestor = addBreadcrumb(
			'10:06 ～ 10:41 寫免費文章',
			'is-ancestor',
		);
		const parent = addBreadcrumb('Newsletter-2026-W35', 'is-ancestor', 'is-parent');
		const current = addBreadcrumb(
			'這是一個非常長而且必須在剩餘寬度內截斷的目前節點',
			'is-current',
		);
		document.body.append(panel);

		const panelStyle = getComputedStyle(panel);
		const noteStyle = getComputedStyle(note);
		const hiddenAncestorStyle = getComputedStyle(hiddenAncestor);
		const parentStyle = getComputedStyle(parent);
		const currentStyle = getComputedStyle(current);
		const currentLabelStyle = getComputedStyle(
			current.querySelector('.bullet-zoom-breadcrumb-label') ?? current,
		);
		expect(panelStyle.display).toBe('flex');
		expect(panelStyle.maxWidth).toBe('100%');
		expect(panelStyle.overflowX).toBe('hidden');
		expect(panelStyle.overflowY).toBe('hidden');
		expect(panelStyle.whiteSpace).toBe('nowrap');
		expect(noteStyle.display).toBe('inline-flex');
		expect(hiddenAncestorStyle.display).toBe('none');
		expect(parentStyle.display).toBe('inline-flex');
		expect(currentStyle.display).toBe('inline-flex');
		expect(noteStyle.minWidth).toBe('44px');
		expect(noteStyle.minHeight).toBe('44px');
		expect(parentStyle.minWidth).toBe('44px');
		expect(parentStyle.minHeight).toBe('44px');
		expect(currentStyle.minHeight).toBe('44px');
		expect(currentStyle.flexShrink).toBe('1');
		expect(Number.parseFloat(currentStyle.minWidth)).toBe(0);
		expect(currentLabelStyle.overflow).toBe('hidden');
		expect(currentLabelStyle.textOverflow).toBe('ellipsis');
	});

	it('hides title and Properties only in the focused mobile pane', () => {
		const style = document.createElement('style');
		style.dataset.bulletZoomTest = 'true';
		style.textContent = readProjectFile('styles.css');
		document.head.append(style);
		document.body.classList.add('is-mobile');

		const createPane = (focused: boolean): HTMLDivElement => {
			const pane = document.createElement('div');
			pane.className =
				'markdown-source-view is-live-preview show-properties';
			pane.classList.toggle('bullet-zoom-pane-is-focused', focused);
			const title = document.createElement('div');
			title.className = 'inline-title';
			const metadata = document.createElement('div');
			metadata.className = 'metadata-container';
			pane.append(title, metadata);
			document.body.append(pane);
			return pane;
		};

		const focusedPane = createPane(true);
		const siblingPane = createPane(false);
		const focusedTitle = focusedPane.querySelector('.inline-title');
		const focusedMetadata = focusedPane.querySelector('.metadata-container');
		const siblingTitle = siblingPane.querySelector('.inline-title');
		const siblingMetadata = siblingPane.querySelector('.metadata-container');

		expect(getComputedStyle(focusedTitle ?? focusedPane).display).toBe('none');
		expect(getComputedStyle(focusedMetadata ?? focusedPane).display).toBe('none');
		const metadataRule = Array.from(style.sheet?.cssRules ?? []).find(
			(rule): rule is CSSStyleRule =>
				rule instanceof CSSStyleRule &&
				rule.selectorText.includes(
					'.metadata-container:not(.mod-error)',
				),
		);
		expect(metadataRule?.style.getPropertyPriority('display')).toBe(
			'important',
		);
		expect(getComputedStyle(siblingTitle ?? siblingPane).display).not.toBe('none');
		expect(getComputedStyle(siblingMetadata ?? siblingPane).display).not.toBe(
			'none',
		);

		document.body.classList.remove('is-mobile');
		expect(getComputedStyle(focusedTitle ?? focusedPane).display).not.toBe('none');
		expect(getComputedStyle(focusedMetadata ?? focusedPane).display).not.toBe(
			'none',
		);
	});

	it('uses Obsidian theme variables for panel and control colors', () => {
		const styles = readProjectFile('styles.css');
		expect(styles).toContain('var(--background-primary)');
		expect(styles).toContain('var(--background-modifier-border)');
		expect(styles).toContain('var(--background-modifier-hover)');
		expect(styles).toContain('var(--text-muted)');
		expect(styles).toContain('var(--text-normal)');
		expect(styles).toContain('.bullet-zoom-breadcrumb.is-current');
		expect(styles).toContain(
			'background-color: var(--interactive-accent)',
		);
		expect(styles).toContain('var(--interactive-accent-hover)');
		expect(styles).toContain(
			'box-shadow: inset 0 0 0 2px var(--color-accent-2)',
		);
		expect(styles).toContain('var(--text-on-accent)');
	});
});
