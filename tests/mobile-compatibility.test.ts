import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

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
		expect(manifest.version).toBe('0.1.1');
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

		expect(packageManifest.version).toBe('0.1.1');
		expect(packageLock.version).toBe('0.1.1');
		expect(packageLock.packages?.['']?.version).toBe('0.1.1');
		expect(versions['0.1.1']).toBe('1.11.7');
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

	it('keeps every breadcrumb reachable in one narrow horizontal region', () => {
		const style = document.createElement('style');
		style.textContent = readProjectFile('styles.css');
		document.head.append(style);
		const panel = document.createElement('nav');
		panel.className = 'bullet-zoom-breadcrumbs';
		const button = document.createElement('button');
		button.className = 'bullet-zoom-breadcrumb';
		button.textContent = 'A very long breadcrumb that must remain reachable';
		panel.append(button);
		document.body.append(panel);

		const panelStyle = getComputedStyle(panel);
		const buttonStyle = getComputedStyle(button);
		expect(panelStyle.display).toBe('flex');
		expect(panelStyle.maxWidth).toBe('100%');
		expect(panelStyle.overflowX).toBe('auto');
		expect(panelStyle.overflowY).toBe('hidden');
		expect(panelStyle.whiteSpace).toBe('nowrap');
		expect(buttonStyle.minWidth).toBe('44px');
		expect(buttonStyle.minHeight).toBe('44px');
		expect(buttonStyle.flexShrink).toBe('0');
		expect(buttonStyle.overflow).toBe('hidden');
		expect(buttonStyle.textOverflow).toBe('ellipsis');

		panel.remove();
		style.remove();
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
