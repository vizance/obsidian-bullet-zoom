import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

afterEach(() => {
	document.body.classList.remove('is-mobile', 'is-phone');
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
		expect(manifest.version).toBe('0.1.12');
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

		expect(packageManifest.version).toBe('0.1.12');
		expect(packageLock.version).toBe('0.1.12');
		expect(packageLock.packages?.['']?.version).toBe('0.1.12');
		expect(versions['0.1.1']).toBe('1.11.7');
		expect(versions['0.1.2']).toBe('1.11.7');
		expect(versions['0.1.3']).toBe('1.11.7');
		expect(versions['0.1.4']).toBe('1.11.7');
		expect(versions['0.1.5']).toBe('1.11.7');
		expect(versions['0.1.6']).toBe('1.11.7');
		expect(versions['0.1.7']).toBe('1.11.7');
		expect(versions['0.1.9']).toBe('1.11.7');
		expect(versions['0.1.10']).toBe('1.11.7');
		expect(versions['0.1.11']).toBe('1.11.7');
		expect(versions['0.1.12']).toBe('1.11.7');
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

	it('fits Bike-inspired phone navigation in one 315 CSS-pixel row', () => {
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
		): HTMLElement => {
			const item = document.createElement(
				roles.includes('is-current') ? 'span' : 'button',
			);
			item.classList.add('bullet-zoom-breadcrumb', ...roles);
			const labelElement = document.createElement('span');
			labelElement.className = 'bullet-zoom-breadcrumb-label';
			labelElement.textContent = label;
			item.append(labelElement);
			panel.append(item);
			return item;
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

	it('creates a focused writing surface on desktop and phone without changing sibling panes', () => {
		const style = document.createElement('style');
		style.dataset.bulletZoomTest = 'true';
		style.textContent = readProjectFile('styles.css');
		document.head.append(style);
		const createPane = (focused: boolean): HTMLDivElement => {
			const pane = document.createElement('div');
			pane.className =
				'markdown-source-view is-live-preview show-properties';
			pane.classList.toggle('bullet-zoom-pane-is-focused', focused);
			const editor = document.createElement('div');
			editor.className = 'cm-editor';
			const scroller = document.createElement('div');
			scroller.className = 'cm-scroller';
			const sizer = document.createElement('div');
			sizer.className = 'cm-sizer';
			const title = document.createElement('div');
			title.className = 'inline-title';
			const metadata = document.createElement('div');
			metadata.className = 'metadata-container';
			const embed = document.createElement('div');
			embed.className = 'markdown-embed';
			const embeddedTitle = title.cloneNode() as HTMLElement;
			embeddedTitle.classList.add('embedded-title-fixture');
			const embeddedMetadata = metadata.cloneNode() as HTMLElement;
			embeddedMetadata.classList.add('embedded-metadata-fixture');
			embed.append(embeddedTitle, embeddedMetadata);
			sizer.append(title, metadata, embed);
			scroller.append(sizer);
			editor.append(scroller);
			pane.append(editor);
			document.body.append(pane);
			return pane;
		};

		const focusedPane = createPane(true);
		const siblingPane = createPane(false);
		const focusedTitle = focusedPane.querySelector('.inline-title');
		const focusedMetadata = focusedPane.querySelector('.metadata-container');
		const siblingTitle = siblingPane.querySelector('.inline-title');
		const siblingMetadata = siblingPane.querySelector('.metadata-container');
		const embeddedTitle = focusedPane.querySelector('.embedded-title-fixture');
		const embeddedMetadata = focusedPane.querySelector(
			'.embedded-metadata-fixture',
		);

		for (const platformClass of [null, 'is-mobile'] as const) {
			document.body.classList.toggle('is-mobile', platformClass !== null);
			expect(getComputedStyle(focusedTitle ?? focusedPane).display).toBe('none');
			expect(getComputedStyle(focusedMetadata ?? focusedPane).display).toBe(
				'none',
			);
			expect(getComputedStyle(siblingTitle ?? siblingPane).display).not.toBe(
				'none',
			);
			expect(getComputedStyle(siblingMetadata ?? siblingPane).display).not.toBe(
				'none',
			);
			expect(getComputedStyle(embeddedTitle ?? focusedPane).display).not.toBe(
				'none',
			);
			expect(getComputedStyle(embeddedMetadata ?? focusedPane).display).not.toBe(
				'none',
			);
		}
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
		focusedPane.classList.remove('bullet-zoom-pane-is-focused');
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
		expect(styles).toContain('var(--interactive-accent)');
		expect(styles).toContain('border-bottom');
		expect(styles).not.toContain('var(--text-on-accent)');
	});

	it('reveals inline Zoom visibility from desktop row context', () => {
		const style = document.createElement('style');
		style.dataset.bulletZoomTest = 'true';
		style.textContent = readProjectFile('styles.css');
		document.head.append(style);
		const line = document.createElement('div');
		line.className = 'cm-line';
		const control = document.createElement('button');
		control.className = 'bullet-zoom-row-control bullet-zoom-enter-control';
		line.append(control);
		document.body.append(line);

		expect(getComputedStyle(control).visibility).toBe('visible');
		expect(getComputedStyle(control).opacity).toBe('0');
		expect(getComputedStyle(control).pointerEvents).toBe('none');
		line.classList.add('cm-activeLine');
		expect(getComputedStyle(control).opacity).toBe('0');
		expect(getComputedStyle(control).pointerEvents).toBe('none');
		line.classList.remove('cm-activeLine');
		control.classList.add('is-mobile-active');
		expect(getComputedStyle(control).opacity).toBe('0');
		expect(getComputedStyle(control).pointerEvents).toBe('none');

		const selectors = Array.from(style.sheet?.cssRules ?? [])
			.filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
			.map((rule) => rule.selectorText)
			.join('\n');
		expect(selectors).toContain(
			'body:not(.is-mobile):not(.is-phone)\n\t.cm-line:hover\n\t.bullet-zoom-row-control',
		);
		expect(selectors).toContain(
			'body:not(.is-mobile):not(.is-phone)\n\t.bullet-zoom-row-control:focus-visible',
		);
		expect(selectors).not.toContain('.cm-activeLine');
	});

	it('shows only the active inline Zoom phone control without expanding line geometry', () => {
		const style = document.createElement('style');
		style.dataset.bulletZoomTest = 'true';
		style.textContent = `${readProjectFile('styles.css')}\n.bullet-zoom-test-editor-line { font-size: 20px; line-height: 28px; }`;
		document.head.append(style);
		document.body.classList.add('is-mobile', 'is-phone');
		const inactiveLine = document.createElement('div');
		inactiveLine.className = 'cm-line';
		const activeLine = document.createElement('div');
		activeLine.className = 'cm-line bullet-zoom-test-editor-line';
		const inactiveControl = document.createElement('button');
		inactiveControl.className =
			'bullet-zoom-row-control bullet-zoom-enter-control';
		const icon = document.createElement('span');
		icon.className = 'bullet-zoom-row-icon';
		icon.textContent = '↘';
		inactiveControl.append(icon);
		const activeControl = inactiveControl.cloneNode() as HTMLButtonElement;
		activeControl.classList.add('is-mobile-active');
		inactiveLine.append(inactiveControl);
		activeLine.append(activeControl);
		document.body.append(inactiveLine, activeLine);

		const inactiveStyle = getComputedStyle(inactiveControl);
		const activeStyle = getComputedStyle(activeControl);
		expect(inactiveStyle.display).toBe('none');
		expect(inactiveStyle.visibility).toBe('hidden');
		expect(inactiveStyle.pointerEvents).toBe('none');
		expect(Number.parseFloat(inactiveStyle.minWidth)).toBe(0);
		expect(Number.parseFloat(inactiveStyle.minHeight)).toBe(0);
		expect(activeStyle.display).toBe('inline-flex');
		expect(activeStyle.visibility).toBe('visible');
		expect(activeStyle.pointerEvents).toBe('auto');
		expect(Number.parseFloat(activeStyle.minWidth)).toBe(0);
		expect(Number.parseFloat(activeStyle.minHeight)).toBe(0);
		expect(activeStyle.padding).toBe('0px');
		expect(Number.parseFloat(activeStyle.getPropertyValue('margin-block'))).toBe(
			0,
		);
		expect(Number.parseFloat(activeStyle.borderRadius)).toBe(0);
		expect(activeStyle.backgroundColor).toBe('rgba(0, 0, 0, 0)');
		expect(activeStyle.fontSize).toBe('inherit');
		expect(activeStyle.lineHeight).toBe('inherit');
		expect(getComputedStyle(activeLine).fontSize).toBe('20px');
		expect(getComputedStyle(activeLine).lineHeight).toBe('28px');
		expect(activeStyle.position).toBe('relative');
		const selectors = Array.from(style.sheet?.cssRules ?? [])
			.filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
			.map((rule) => rule.selectorText)
			.join('\n');
		expect(selectors).not.toContain(
			'.bullet-zoom-row-control.is-mobile-active::before',
		);
	});
});
