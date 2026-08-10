import obsidianmd from 'eslint-plugin-obsidianmd';
import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig(
	globalIgnores([
		'node_modules',
		'coverage',
		'.test-vault',
		'esbuild.config.mjs',
		'main.js',
		'manifest.json',
		'package-lock.json',
		'package.json',
		'versions.json',
	]),
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: ['eslint.config.mjs'],
				},
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	...obsidianmd.configs.recommended,
	{
		files: ['src/main.ts', 'src/focus-extension.ts'],
		rules: {
			// Spectra fixes these public command IDs and Traditional Chinese labels.
			'obsidianmd/commands/no-plugin-id-in-command-id': 'off',
			'obsidianmd/ui/sentence-case': 'off',
			// CodeMirror test DOMs do not include Obsidian's HTMLElement helpers.
			'obsidianmd/prefer-create-el': 'off',
		},
	},
	{
		files: ['tests/**/*.ts'],
		rules: {
			// Test-only fixtures inspect local source and inject styles into jsdom.
			'obsidianmd/no-forbidden-elements': 'off',
			'obsidianmd/no-nodejs-modules': 'off',
			'obsidianmd/prefer-create-el': 'off',
		},
	},
);
