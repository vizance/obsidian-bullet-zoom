import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { markdown } from '@codemirror/lang-markdown';
import { foldedRanges } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

import {
	createFocusExtension,
	focusFilePath,
	focusLivePreview,
	focusNoteTitle,
	getFocusSession,
} from '../src/focus-extension';

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
		expect(manifest.version).toBe('1.4.0');
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

		expect(packageManifest.version).toBe('1.4.0');
		expect(packageLock.version).toBe('1.4.0');
		expect(packageLock.packages?.['']?.version).toBe('1.4.0');
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
		expect(panelStyle.overflowX).toBe('auto');
		expect(panelStyle.overflowY).toBe('hidden');
		expect(panelStyle.whiteSpace).toBe('nowrap');
		expect(noteStyle.display).toBe('inline-flex');
		expect(hiddenAncestorStyle.display).toBe('inline-flex');
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
		expect(getComputedStyle(row).paddingInlineStart).toBe('72px');
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
			expect(getComputedStyle(sidebar).fontSize).toContain(
				'var(--font-ui-smaller, 0.9em)',
			);
			expect(getComputedStyle(sidebar).fontSize).toContain(
				'--bullet-zoom-outline-scale',
			);
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

describe('phone fold hit-area confinement (0.1.33)', () => {
	function mountPhonePane(documentText: string, isPhone: boolean): {
		pane: HTMLDivElement;
		view: EditorView;
	} {
		const pane = document.createElement('div');
		pane.className = 'markdown-source-view is-live-preview';
		document.body.append(pane);
		const view = new EditorView({
			parent: pane,
			state: EditorState.create({
				doc: documentText,
				extensions: [
					markdown(),
					focusFilePath.of('Ideas.md'),
					focusNoteTitle.of('Ideas'),
					focusLivePreview.of(true),
					createFocusExtension({ isPhone, isMobile: isPhone }),
				],
			}),
		});
		return { pane, view };
	}

	it('adds the phone pane class only in phone mode', () => {
		const phone = mountPhonePane('- Parent\n  - Child', true);
		expect(phone.pane.classList.contains('bullet-zoom-phone-pane')).toBe(true);
		phone.view.destroy();
		expect(phone.pane.classList.contains('bullet-zoom-phone-pane')).toBe(false);
		phone.pane.remove();

		const desktop = mountPhonePane('- Parent\n  - Child', false);
		expect(desktop.pane.classList.contains('bullet-zoom-phone-pane')).toBe(
			false,
		);
		desktop.view.destroy();
		desktop.pane.remove();
	});

	it('zooms a third-level parent marker on a phone without toggling folds', () => {
		const { pane, view } = mountPhonePane(
			'- A\n  - B\n    - C\n      - D',
			true,
		);
		const anchorC = view.state.doc.line(3).from + 4;
		const marker = Array.from(
			view.contentDOM.querySelectorAll<HTMLElement>('.bullet-zoom-marker'),
		).find((candidate) => view.posAtDOM(candidate) === anchorC);
		expect(marker).toBeDefined();

		marker?.click();
		expect(getFocusSession(view.state)?.anchor).toBe(anchorC);
		let foldCount = 0;
		foldedRanges(view.state).between(0, view.state.doc.length, () => {
			foldCount += 1;
		});
		expect(foldCount).toBe(0);
		expect(view.state.doc.toString()).toBe('- A\n  - B\n    - C\n      - D');
		view.destroy();
		pane.remove();
	});

	it('defers collapse-indicator clicks to the native fold owner on phones', () => {
		const { pane, view } = mountPhonePane('- Parent\n  - Child', true);
		const line = view.contentDOM.querySelector('.cm-line');
		const collapseIndicator = document.createElement('div');
		collapseIndicator.className = 'collapse-indicator collapse-icon';
		line?.prepend(collapseIndicator);

		const click = new MouseEvent('click', { bubbles: true, cancelable: true });
		expect(collapseIndicator.dispatchEvent(click)).toBe(true);
		expect(getFocusSession(view.state)).toBeNull();
		view.destroy();
		pane.remove();
	});

	it('confines the native list fold hit area only under the phone pane class', () => {
		const style = document.createElement('style');
		style.dataset.bulletZoomTest = 'true';
		style.textContent = readProjectFile('styles.css');
		document.head.append(style);

		const buildPane = (phonePane: boolean): HTMLElement => {
			const pane = document.createElement('div');
			pane.className = 'markdown-source-view is-live-preview';
			pane.classList.toggle('bullet-zoom-phone-pane', phonePane);
			const line = document.createElement('div');
			line.className = 'cm-line HyperMD-list-line HyperMD-list-line-3';
			const indicator = document.createElement('div');
			indicator.className = 'collapse-indicator collapse-icon';
			line.append(indicator);
			pane.append(line);
			document.body.append(pane);
			return indicator;
		};

		const phoneIndicator = buildPane(true);
		const desktopIndicator = buildPane(false);
		const phoneStyle = getComputedStyle(phoneIndicator);
		expect(phoneStyle.maxWidth).toBe('24px');
		expect(phoneStyle.maxHeight).toBe('24px');
		expect(phoneStyle.overflow).toBe('hidden');
		const desktopStyle = getComputedStyle(desktopIndicator);
		expect(desktopStyle.maxWidth).not.toBe('24px');

		const collapseRules = Array.from(style.sheet?.cssRules ?? []).filter(
			(rule): rule is CSSStyleRule =>
				rule instanceof CSSStyleRule &&
				rule.selectorText.includes('.collapse-indicator'),
		);
		expect(collapseRules.length).toBeGreaterThan(0);
		for (const rule of collapseRules) {
			for (const selector of rule.selectorText.split(',')) {
				expect(selector).toContain('.bullet-zoom-phone-pane');
				expect(selector).toContain('.HyperMD-list-line');
			}
		}
	});
});

describe('focus page rebase CSS contract (0.1.36)', () => {
	it('zeroes the focus root indent and rebases branch lines with importance', () => {
		const style = document.createElement('style');
		style.dataset.bulletZoomTest = 'true';
		style.textContent = readProjectFile('styles.css');
		document.head.append(style);
		const rules = Array.from(style.sheet?.cssRules ?? []).filter(
			(rule): rule is CSSStyleRule => rule instanceof CSSStyleRule,
		);

		const rootRule = rules.find(
			(rule) => rule.selectorText === '.bullet-zoom-focus-root-line',
		);
		expect(rootRule?.style.getPropertyValue('text-indent').trim()).toBe('0');
		expect(rootRule?.style.getPropertyPriority('text-indent')).toBe('important');
		expect(
			rootRule?.style.getPropertyValue('padding-inline-start').trim(),
		).toBe('0');
		expect(rootRule?.style.getPropertyPriority('padding-inline-start')).toBe(
			'important',
		);

		const rebasedRule = rules.find(
			(rule) => rule.selectorText === '.bullet-zoom-rebased-line',
		);
		expect(rebasedRule).toBeDefined();
		expect(
			rebasedRule?.style.getPropertyValue('padding-inline-start'),
		).toContain('--bullet-zoom-relative-depth');
		expect(rebasedRule?.style.getPropertyPriority('padding-inline-start')).toBe(
			'important',
		);
		expect(rebasedRule?.style.getPropertyValue('text-indent')).toContain(
			'--bullet-zoom-indent-unit',
		);
		expect(rebasedRule?.style.getPropertyPriority('text-indent')).toBe(
			'important',
		);

		const phoneTitleRule = rules.find(
			(rule) =>
				rule.selectorText ===
				'.bullet-zoom-phone-pane .bullet-zoom-focus-root-line',
		);
		expect(phoneTitleRule?.style.getPropertyValue('font-size')).toContain(
			'clamp',
		);
	});
});

describe('size slider CSS contract (0.1.37)', () => {
	it('multiplies title and outline font sizes by the scale variables', () => {
		const style = document.createElement('style');
		style.dataset.bulletZoomTest = 'true';
		style.textContent = readProjectFile('styles.css');
		document.head.append(style);
		const rules = Array.from(style.sheet?.cssRules ?? []).filter(
			(rule): rule is CSSStyleRule => rule instanceof CSSStyleRule,
		);
		const fontSizeOf = (selector: string): string =>
			rules
				.filter((rule) => rule.selectorText === selector)
				.map((rule) => rule.style.getPropertyValue('font-size'))
				.find((value) => value !== '') ?? '';

		expect(fontSizeOf('.bullet-zoom-focus-root-line')).toContain(
			'--bullet-zoom-title-scale',
		);
		expect(
			fontSizeOf('.bullet-zoom-phone-pane .bullet-zoom-focus-root-line'),
		).toContain('--bullet-zoom-title-scale');
		expect(fontSizeOf('.bullet-zoom-outline-sidebar')).toContain(
			'--bullet-zoom-outline-scale',
		);
		expect(fontSizeOf('.is-mobile .bullet-zoom-outline-sidebar')).toContain(
			'--bullet-zoom-outline-scale',
		);
	});
});

describe('drag scroll lock CSS contract (0.1.45)', () => {
	it('disables touch scrolling on the outline body while dragging', () => {
		const style = document.createElement('style');
		style.dataset.bulletZoomTest = 'true';
		style.textContent = readProjectFile('styles.css');
		document.head.append(style);
		const rule = Array.from(style.sheet?.cssRules ?? []).find(
			(candidate): candidate is CSSStyleRule =>
				candidate instanceof CSSStyleRule &&
				candidate.selectorText ===
					'.bullet-zoom-outline-sidebar-body.bullet-zoom-outline-dragging',
		);
		expect(rule).toBeDefined();
		expect(rule?.style.getPropertyValue('touch-action').trim()).toBe('none');
		expect(rule?.style.getPropertyValue('overflow').trim()).toBe('hidden');
	});
});

describe('focus indent guides CSS contract (1.1.0)', () => {
	it('paints scoped depth-aware guides without changing layout metrics', () => {
		const style = document.createElement('style');
		style.dataset.bulletZoomTest = 'true';
		style.textContent = readProjectFile('styles.css');
		document.head.append(style);
		const rules = Array.from(style.sheet?.cssRules ?? []).filter(
			(rule): rule is CSSStyleRule => rule instanceof CSSStyleRule,
		);
		const guideRules = rules.filter((rule) =>
			rule.style.getPropertyValue('background-image').includes(
				'repeating-linear-gradient',
			),
		);
		expect(guideRules.length).toBeGreaterThan(0);
		for (const rule of guideRules) {
			expect(rule.selectorText).toContain('bullet-zoom-indent-guides');
			expect(rule.style.getPropertyValue('padding-inline-start')).toBe('');
			expect(rule.style.getPropertyValue('text-indent')).toBe('');
		}
		const guideRule = guideRules.find((rule) =>
			rule.selectorText.includes('bullet-zoom-rebased-line'),
		);
		expect(guideRule?.style.getPropertyValue('background-size')).toContain(
			'--bullet-zoom-relative-depth',
		);
		expect(guideRule?.style.getPropertyValue('background-size')).toContain(
			'--bullet-zoom-indent-unit',
		);
		expect(guideRule?.style.getPropertyValue('background-repeat').trim()).toBe(
			'no-repeat',
		);
	});
});
