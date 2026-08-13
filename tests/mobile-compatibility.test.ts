import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

afterEach(() => {
	document.body.classList.remove('is-mobile', 'is-phone');
	document.documentElement.classList.remove('theme-light', 'theme-dark');
		document.documentElement.style.removeProperty('--text-faint');
		document.documentElement.style.removeProperty('--text-muted');
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
		expect(manifest.version).toBe('0.1.15');
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

		expect(packageManifest.version).toBe('0.1.15');
		expect(packageLock.version).toBe('0.1.15');
		expect(packageLock.packages?.['']?.version).toBe('0.1.15');
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
		expect(versions['0.1.13']).toBe('1.11.7');
		expect(versions['0.1.14']).toBe('1.11.7');
		expect(versions['0.1.15']).toBe('1.11.7');
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
		const switcher = document.createElement('button');
		switcher.className = 'bullet-zoom-outline-trigger';
		switcher.setAttribute('aria-label', '切換 bullet');
		panel.append(switcher);
		document.body.append(panel);

		const panelStyle = getComputedStyle(panel);
		const noteStyle = getComputedStyle(note);
		const hiddenAncestorStyle = getComputedStyle(hiddenAncestor);
		const parentStyle = getComputedStyle(parent);
		const currentStyle = getComputedStyle(current);
		const switcherStyle = getComputedStyle(switcher);
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
		expect(switcherStyle.width).toBe('44px');
		expect(switcherStyle.minWidth).toBe('44px');
		expect(switcherStyle.minHeight).toBe('44px');
		expect(switcherStyle.flexShrink).toBe('0');
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

	it('keeps the mobile outline sheet inside the visible viewport with 44px actions', () => {
		const style = document.createElement('style');
		style.dataset.bulletZoomTest = 'true';
		style.textContent = readProjectFile('styles.css');
		document.head.append(style);
		const layer = document.createElement('div');
		layer.className =
			'bullet-zoom-outline-layer is-mobile-presentation';
		const dialog = document.createElement('div');
		dialog.className =
			'bullet-zoom-outline-dialog bullet-zoom-outline-mobile';
		const header = document.createElement('header');
		header.className = 'bullet-zoom-outline-header';
		const headerButton = document.createElement('button');
		header.append(headerButton);
		const list = document.createElement('div');
		list.className = 'bullet-zoom-outline-mobile-list';
		const label = document.createElement('button');
		label.className = 'bullet-zoom-outline-label';
		const children = document.createElement('button');
		children.className = 'bullet-zoom-outline-children';
		list.append(label, children);
		dialog.append(header, list);
		layer.append(dialog);
		document.body.append(layer);

		const layerStyle = getComputedStyle(layer);
		const dialogStyle = getComputedStyle(dialog);
		const listStyle = getComputedStyle(list);
		expect(layerStyle.position).toBe('fixed');
		expect(layerStyle.alignItems).toBe('flex-end');
		expect(dialogStyle.width).toBe('100%');
		expect(dialogStyle.maxWidth).toBe('100%');
		expect(dialogStyle.overflow).toBe('hidden');
		expect(listStyle.overflowX).toBe('hidden');
		expect(listStyle.overflowY).toBe('auto');
		for (const control of [headerButton, label, children]) {
			expect(getComputedStyle(control).minHeight).toBe('44px');
		}
		expect(getComputedStyle(headerButton).minWidth).toBe('44px');
		expect(getComputedStyle(children).minWidth).toBe('44px');
		expect(readProjectFile('styles.css')).toContain('max-height: min(72%, 34rem)');
	});

	it.each(['theme-light', 'theme-dark'])(
		'uses theme tokens without changing editor or breadcrumb line geometry in %s',
		(theme) => {
			const style = document.createElement('style');
			style.dataset.bulletZoomTest = 'true';
			style.textContent = `${readProjectFile('styles.css')}\n.bullet-zoom-test-line { line-height: 28px; }`;
			document.head.append(style);
			document.documentElement.classList.add(theme);
			const line = document.createElement('div');
			line.className = 'cm-line bullet-zoom-test-line';
			line.textContent = 'Bullet';
			const breadcrumbs = document.createElement('nav');
			breadcrumbs.className = 'bullet-zoom-breadcrumbs';
			const layer = document.createElement('div');
			layer.className =
				'bullet-zoom-outline-layer is-desktop-presentation';
			const dialog = document.createElement('div');
			dialog.className =
				'bullet-zoom-outline-dialog bullet-zoom-outline-desktop';
			const row = document.createElement('div');
			row.className = 'bullet-zoom-outline-row is-current';
			dialog.append(row);
			layer.append(dialog);
			document.body.append(line, breadcrumbs, layer);

			const lineHeightBefore = getComputedStyle(line).lineHeight;
			const breadcrumbHeightBefore = getComputedStyle(breadcrumbs).minHeight;
			expect(getComputedStyle(layer).position).toBe('fixed');
			const rules = Array.from(style.sheet?.cssRules ?? []).filter(
				(rule): rule is CSSStyleRule => rule instanceof CSSStyleRule,
			);
			const dialogRule = rules.find(
				(rule) => rule.selectorText === '.bullet-zoom-outline-dialog',
			);
			expect(dialogRule?.style.background).toBe('var(--background-primary)');
			expect(dialogRule?.style.color).toBe('var(--text-normal)');
			expect(readProjectFile('styles.css')).toMatch(
				/\.bullet-zoom-outline-row\.is-current\s*\{[^}]*var\(--interactive-accent\)/s,
			);
			expect(getComputedStyle(line).lineHeight).toBe(lineHeightBefore);
			expect(getComputedStyle(breadcrumbs).minHeight).toBe(
				breadcrumbHeightBefore,
			);
			expect(readProjectFile('styles.css')).not.toMatch(
				/\.cm-line[^{]*{[^}]*bullet-zoom-outline/s,
			);
		},
	);

	it('keeps inline Zoom controls persistently visible on desktop and mobile', () => {
		const style = document.createElement('style');
		style.dataset.bulletZoomTest = 'true';
		style.textContent = readProjectFile('styles.css');
		document.head.append(style);
		const line = document.createElement('div');
		line.className = 'cm-line';
		const control = document.createElement('button');
		control.className = 'bullet-zoom-row-control bullet-zoom-enter-control';
		const icon = document.createElement('span');
		icon.className = 'bullet-zoom-row-icon';
		icon.textContent = '↘';
		control.append(icon);
		line.append(control);
		document.body.append(line);

		expect(getComputedStyle(control).visibility).toBe('visible');
		expect(getComputedStyle(control).display).toBe('inline-flex');
		expect(getComputedStyle(control).opacity).toBe('1');
		expect(getComputedStyle(control).pointerEvents).toBe('auto');
		line.classList.add('cm-activeLine');
		expect(getComputedStyle(control).opacity).toBe('1');
		expect(getComputedStyle(control).pointerEvents).toBe('auto');
		line.classList.remove('cm-activeLine');
		document.body.classList.add('is-mobile', 'is-phone');
		expect(getComputedStyle(control).display).toBe('inline-flex');
		expect(getComputedStyle(control).visibility).toBe('visible');
		expect(getComputedStyle(control).opacity).toBe('1');
		expect(getComputedStyle(control).pointerEvents).toBe('auto');

		const selectors = Array.from(style.sheet?.cssRules ?? [])
			.filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
			.map((rule) => rule.selectorText)
			.join('\n');
		expect(selectors).not.toContain('.is-mobile-active');
		expect(selectors).not.toContain('.cm-line:hover');
		expect(selectors).not.toContain('.cm-activeLine');
	});

	it.each([
		{ theme: 'light', faintColor: 'rgb(218, 218, 218)' },
		{ theme: 'dark', faintColor: 'rgb(82, 82, 82)' },
	])(
		'keeps the real phone glyph within text geometry in the $theme theme',
		({ theme, faintColor }) => {
		const style = document.createElement('style');
		style.dataset.bulletZoomTest = 'true';
		style.textContent = `${readProjectFile('styles.css')}\n.bullet-zoom-test-editor-line { font-size: 20px; line-height: 28px; }`;
		document.head.append(style);
		document.body.classList.add('is-mobile', 'is-phone');
		document.documentElement.classList.add(`theme-${theme}`);
			document.documentElement.style.setProperty('--text-faint', faintColor);
			document.documentElement.style.setProperty(
				'--text-muted',
				theme === 'light' ? 'rgb(110, 110, 110)' : 'rgb(170, 170, 170)',
			);
		const referenceLine = document.createElement('div');
		referenceLine.className = 'cm-line bullet-zoom-test-editor-line';
		referenceLine.textContent = 'Reference';
		const controlLine = document.createElement('div');
		controlLine.className = 'cm-line bullet-zoom-test-editor-line';
		controlLine.append('Reference');
		const control = document.createElement('button');
		control.className =
			'bullet-zoom-row-control bullet-zoom-enter-control';
		const icon = document.createElement('span');
		icon.className = 'bullet-zoom-row-icon';
		icon.textContent = '↘';
		control.append(icon);
		controlLine.append(control);
		document.body.append(referenceLine, controlLine);

		const controlStyle = getComputedStyle(control);
		expect(controlStyle.display).toBe('inline-flex');
		expect(controlStyle.visibility).toBe('visible');
		expect(controlStyle.opacity).toBe('1');
		expect(controlStyle.pointerEvents).toBe('auto');
		expect(Number.parseFloat(controlStyle.minWidth)).toBe(0);
		expect(Number.parseFloat(controlStyle.minHeight)).toBe(0);
		expect(controlStyle.height).toBe('1em');
		expect(controlStyle.maxHeight).toBe('1em');
		expect(controlStyle.padding).toBe('0px');
		expect(Number.parseFloat(controlStyle.getPropertyValue('margin-block'))).toBe(
			0,
		);
		expect(Number.parseFloat(controlStyle.borderRadius)).toBe(0);
		expect(controlStyle.backgroundColor).toBe('rgba(0, 0, 0, 0)');
		expect(controlStyle.backgroundImage).toBe('none');
		expect(controlStyle.boxShadow).toBe('none');
		expect(controlStyle.color).toBe('var(--text-faint)');
		expect(
			document.documentElement.style.getPropertyValue('--text-faint'),
		).toBe(faintColor);
		expect(controlStyle.fontSize).toBe('inherit');
		expect(controlStyle.lineHeight).toBe('1');
		expect(getComputedStyle(referenceLine).lineHeight).toBe('28px');
		expect(getComputedStyle(controlLine).lineHeight).toBe('28px');
			control.focus();
			const focusedStyle = getComputedStyle(control);
			expect(focusedStyle.backgroundColor).toBe('rgba(0, 0, 0, 0)');
			expect(focusedStyle.backgroundImage).toBe('none');
			expect(focusedStyle.boxShadow).toBe('none');
			expect(getComputedStyle(controlLine).lineHeight).toBe('28px');
			const rules = Array.from(style.sheet?.cssRules ?? [])
				.filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule);
			const selectors = rules
				.filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
				.map((rule) => rule.selectorText)
				.join('\n');
			const focusVisibleRule = rules.find(
				(rule) =>
					rule.selectorText ===
					'button.bullet-zoom-row-control:focus-visible',
			);
			expect(selectors).toContain('button.bullet-zoom-row-control:active');
			expect(focusVisibleRule?.style.outline).toBe(
				'1px solid var(--text-muted)',
			);
		expect(selectors).not.toContain('.is-mobile-active');
		expect(selectors).not.toContain('.bullet-zoom-row-control::before');
		},
	);
});
