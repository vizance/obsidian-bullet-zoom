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
		expect(manifest.version).toBe('0.1.30');
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

		expect(packageManifest.version).toBe('0.1.30');
		expect(packageLock.version).toBe('0.1.30');
		expect(packageLock.packages?.['']?.version).toBe('0.1.30');
		expect(versions['0.1.1']).toBe('1.11.7');
		expect(versions['0.1.2']).toBe('1.11.7');
		expect(versions['0.1.3']).toBe('1.11.7');
		expect(versions['0.1.4']).toBe('1.11.7');
		expect(versions['0.1.5']).toBe('1.11.7');
		expect(versions['0.1.6']).toBe('1.11.7');
		expect(versions['0.1.7']).toBe('1.11.7');
		expect(versions['0.1.8']).toBe('1.11.7');
		expect(versions['0.1.9']).toBe('1.11.7');
		expect(versions['0.1.10']).toBe('1.11.7');
		expect(versions['0.1.11']).toBe('1.11.7');
		expect(versions['0.1.12']).toBe('1.11.7');
		expect(versions['0.1.13']).toBe('1.11.7');
		expect(versions['0.1.14']).toBe('1.11.7');
		expect(versions['0.1.15']).toBe('1.11.7');
		expect(versions['0.1.16']).toBe('1.11.7');
		expect(versions['0.1.17']).toBe('1.11.7');
		expect(versions['0.1.18']).toBe('1.11.7');
		expect(versions['0.1.19']).toBe('1.11.7');
		expect(versions['0.1.21']).toBe('1.11.7');
		expect(versions['0.1.22']).toBe('1.11.7');
		expect(versions['0.1.23']).toBe('1.11.7');
		expect(versions['0.1.24']).toBe('1.11.7');
		expect(versions['0.1.25']).toBe('1.11.7');
		expect(versions['0.1.26']).toBe('1.11.7');
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
		expect(panel.querySelector('.bullet-zoom-outline-trigger')).toBeNull();
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

	it.each(['theme-light', 'theme-dark'])(
		'keeps the focused page footer in normal flow with a compact 44px mobile action in %s',
		(theme) => {
		const style = document.createElement('style');
		style.dataset.bulletZoomTest = 'true';
		style.textContent = readProjectFile('styles.css');
		document.head.append(style);
		document.body.classList.add('is-mobile');
		document.documentElement.classList.add(theme);
		const line = document.createElement('div');
		line.className = 'cm-line bullet-zoom-focus-root-line';
		line.textContent = '聚焦標題';
		const footer = document.createElement('section');
		footer.className = 'bullet-zoom-focus-page-footer';
		const addChild = document.createElement('button');
		addChild.className = 'bullet-zoom-add-child';
		addChild.textContent = '＋';
		footer.append(addChild);
		document.body.append(line, footer);

		expect(getComputedStyle(line).position).not.toBe('fixed');
		expect(getComputedStyle(footer).position).not.toBe('fixed');
		expect(getComputedStyle(footer).position).not.toBe('sticky');
		expect(getComputedStyle(footer).width).toBe('100%');
		expect(getComputedStyle(line).overflowWrap).toBe('anywhere');
		expect(getComputedStyle(addChild).minWidth).toBe('44px');
		expect(getComputedStyle(addChild).minHeight).toBe('44px');
		expect(getComputedStyle(addChild).color).toBe('var(--text-faint)');
		expect(getComputedStyle(addChild).backgroundColor).toBe(
			'rgba(0, 0, 0, 0)',
		);
		expect(readProjectFile('styles.css')).not.toMatch(
			/\.bullet-zoom-focus-page-footer\s*{[^}]*(?:position:\s*(?:fixed|sticky)|z-index)/s,
		);
		},
	);

	it('uses one native-sidebar surface with 44px mobile actions and no overlay geometry', () => {
		const style = document.createElement('style');
		style.dataset.bulletZoomTest = 'true';
		style.textContent = `.is-mobile button { display: flex; justify-content: center; }\n${readProjectFile('styles.css')}`;
		document.head.append(style);
		document.body.classList.add('is-mobile');
		const sidebar = document.createElement('div');
		sidebar.className = 'bullet-zoom-outline-sidebar';
		const body = document.createElement('div');
		body.className = 'bullet-zoom-outline-sidebar-body';
		const row = document.createElement('div');
		row.className = 'bullet-zoom-outline-sidebar-row is-depth-6';
		const index = document.createElement('span');
		index.className = 'bullet-zoom-outline-sidebar-index';
		index.textContent = '1.';
		const disclosure = document.createElement('button');
		disclosure.className = 'bullet-zoom-outline-sidebar-disclosure';
		const disclosureIcon = document.createElement('span');
		disclosureIcon.className = 'bullet-zoom-outline-sidebar-disclosure-icon';
		disclosure.append(disclosureIcon);
		const label = document.createElement('button');
		label.className = 'bullet-zoom-outline-sidebar-label';
		const labelText = document.createElement('span');
		labelText.className = 'bullet-zoom-outline-sidebar-label-text';
		labelText.textContent = '從開頭保留的長文字內容';
		label.append(labelText);
		const preview = document.createElement('button');
		preview.className = 'bullet-zoom-outline-sidebar-preview';
		preview.textContent = '…';
		row.append(index, disclosure, label, preview);
		body.append(row);
		sidebar.append(body);
		document.body.append(sidebar);

		expect(getComputedStyle(sidebar).width).toBe('100%');
		expect(getComputedStyle(sidebar).overflow).toBe('hidden');
		expect(getComputedStyle(body).overflowX).toBe('hidden');
		expect(getComputedStyle(body).overflowY).toBe('auto');
		expect(getComputedStyle(index).minHeight).toBe('44px');
		expect(getComputedStyle(disclosure).minHeight).toBe('44px');
		expect(getComputedStyle(disclosure).minWidth).toBe('44px');
		expect(getComputedStyle(disclosure).alignItems).toBe('center');
		expect(getComputedStyle(disclosure).justifyContent).toBe('center');
		expect(getComputedStyle(disclosure).lineHeight).toBe('0');
		expect(getComputedStyle(disclosureIcon).display).toBe('block');
		expect(getComputedStyle(disclosureIcon).width).toBe('16px');
		expect(getComputedStyle(disclosureIcon).height).toBe('16px');
		expect(getComputedStyle(label).minHeight).toBe('44px');
		expect(getComputedStyle(preview).minHeight).toBe('44px');
		expect(getComputedStyle(preview).minWidth).toBe('44px');
		expect(getComputedStyle(row).gridTemplateColumns).toBe(
			'max-content 44px minmax(0, 1fr) auto',
		);
		expect(getComputedStyle(row).gridTemplateAreas).toBe(
			"'index disclosure label preview'",
		);
		expect(getComputedStyle(row).gridAutoRows).toBe('minmax(44px, auto)');
		expect(getComputedStyle(index).gridArea).toBe('index');
		expect(getComputedStyle(disclosure).gridArea).toBe('disclosure');
		expect(getComputedStyle(label).gridArea).toBe('label');
		expect(getComputedStyle(label).width).toBe('100%');
		expect(getComputedStyle(label).maxWidth).toBe('100%');
		expect(getComputedStyle(label).justifyContent).toBe('flex-start');
		expect(getComputedStyle(label).textAlign).toBe('start');
		expect(getComputedStyle(labelText).minWidth).toBe('0');
		expect(getComputedStyle(labelText).overflow).toBe('hidden');
		expect(getComputedStyle(labelText).textOverflow).toBe('ellipsis');
		expect(getComputedStyle(labelText).whiteSpace).toBe('nowrap');
		expect(getComputedStyle(preview).gridArea).toBe('preview');
		expect(getComputedStyle(row).paddingInlineStart).toBe('24px');
		preview.hidden = true;
		expect(getComputedStyle(preview).display).toBe('none');
		expect(readProjectFile('styles.css')).not.toContain(
			'.bullet-zoom-outline-layer',
		);
		expect(readProjectFile('styles.css')).not.toContain('visualViewport');
	});

	it.each(['theme-light', 'theme-dark'])(
		'uses compact 44px mobile controls and theme tokens without changing editor geometry in %s',
		(theme) => {
			const style = document.createElement('style');
			style.dataset.bulletZoomTest = 'true';
			style.textContent = `${readProjectFile('styles.css')}\n.bullet-zoom-test-line { line-height: 28px; }`;
			document.head.append(style);
			document.body.classList.add('is-mobile');
			document.documentElement.classList.add(theme);
			const line = document.createElement('div');
			line.className = 'cm-line bullet-zoom-test-line';
			line.textContent = 'Bullet';
			const breadcrumbs = document.createElement('nav');
			breadcrumbs.className = 'bullet-zoom-breadcrumbs';
			const sidebar = document.createElement('div');
			sidebar.className = 'bullet-zoom-outline-sidebar';
			const row = document.createElement('div');
			row.className = 'bullet-zoom-outline-sidebar-row is-current';
			const index = document.createElement('span');
			index.className = 'bullet-zoom-outline-sidebar-index';
			index.textContent = '1.';
			const disclosure = document.createElement('button');
			disclosure.className = 'bullet-zoom-outline-sidebar-disclosure';
			const label = document.createElement('button');
			label.className = 'bullet-zoom-outline-sidebar-label';
			const preview = document.createElement('button');
			preview.className = 'bullet-zoom-outline-sidebar-preview';
			row.append(index, disclosure, label, preview);
			sidebar.append(row);
			document.body.append(line, breadcrumbs, sidebar);

			const lineHeightBefore = getComputedStyle(line).lineHeight;
			const breadcrumbHeightBefore = getComputedStyle(breadcrumbs).minHeight;
			expect(getComputedStyle(sidebar).position).not.toBe('fixed');
			const rules = Array.from(style.sheet?.cssRules ?? []).filter(
				(rule): rule is CSSStyleRule => rule instanceof CSSStyleRule,
			);
			const sidebarRule = rules.find(
				(rule) => rule.selectorText === '.bullet-zoom-outline-sidebar',
			);
			expect(sidebarRule?.style.background).toBe('var(--background-primary)');
			expect(sidebarRule?.style.color).toBe('var(--text-normal)');
			expect(getComputedStyle(sidebar).fontSize).toBe('var(--font-ui-small)');
			expect(getComputedStyle(row).minHeight).toBe('44px');
			expect(getComputedStyle(disclosure).minWidth).toBe('44px');
			expect(getComputedStyle(disclosure).minHeight).toBe('44px');
			expect(getComputedStyle(label).minHeight).toBe('44px');
			expect(getComputedStyle(preview).minWidth).toBe('44px');
			expect(getComputedStyle(preview).minHeight).toBe('44px');
			const projectStyles = readProjectFile('styles.css');
			expect(projectStyles).not.toMatch(
				/\.bullet-zoom-outline-sidebar-(?:root|row)\.is-current\s*\{[^}]*(?:box-shadow|border|background)/s,
			);
			expect(projectStyles).toMatch(
				/\.bullet-zoom-outline-sidebar-label\[aria-current='true'\]\s*\{[^}]*font-weight:\s*var\(--font-semibold, 600\)/s,
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

	it('keeps a hidden mobile overflow preview out of layout', () => {
		const style = document.createElement('style');
		style.dataset.bulletZoomTest = 'true';
		style.textContent = readProjectFile('styles.css');
		document.head.append(style);
		const preview = document.createElement('button');
		preview.className = 'bullet-zoom-outline-sidebar-preview';
		preview.hidden = true;
		document.body.append(preview);
		expect(getComputedStyle(preview).display).toBe('none');
	});

	it('keeps outline label text to one start-preserving ellipsis line', () => {
		const source = readProjectFile('styles.css');
		expect(source).toMatch(
			/\.bullet-zoom-outline-sidebar-label-text\s*\{[^}]*min-width:\s*0;[^}]*overflow:\s*hidden;[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;/s,
		);
		expect(source).toMatch(
			/\.bullet-zoom-outline-sidebar-body\s*\{[^}]*overflow-x:\s*hidden;/s,
		);
	});

	it('removes row-end control activation from every platform', () => {
		const source = readProjectFile('src/focus-extension.ts');
		const pluginSource = readProjectFile('src/main.ts');
		const css = readProjectFile('styles.css');
		const bundle = readProjectFile('main.js');
		expect(source).not.toContain('bullet-zoom-row-control');
		expect(source).not.toContain('BulletRowControlWidget');
		expect(source).not.toContain('↘');
		expect(source).not.toContain('↖');
		expect(pluginSource).not.toContain('alwaysShowRowControls');
		expect(pluginSource).not.toContain('永遠顯示行尾縮放箭頭');
		expect(css).not.toContain('bullet-zoom-row-control');
		expect(bundle).not.toContain('bullet-zoom-row-control');
		expect(bundle).not.toContain('alwaysShowRowControls');
		expect(bundle).not.toContain('永遠顯示行尾縮放箭頭');
	});
});
