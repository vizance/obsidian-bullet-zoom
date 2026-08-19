# AGENTS.md

Guidance for coding agents working on Bullet Zoom, an Obsidian plugin that zooms into a single bullet branch. Human contributors: see [CONTRIBUTING.md](CONTRIBUTING.md).

## Project overview

- TypeScript, bundled with esbuild into `main.js`, which BRAT installs together with `manifest.json` and `styles.css`.
- `src/` holds the plugin. Parsing and document planning live in `src/list-structure.ts`, editor behaviour in `src/focus-extension.ts`, wiring and settings in `src/main.ts`.
- Specifications live in `openspec/specs/`, change proposals in `openspec/changes/`. This repository is developed spec-first with Spectra; see [CLAUDE.md](CLAUDE.md).

## Setup and commands

```bash
npm install
npm test          # vitest, must stay green
npm run lint      # eslint with the Obsidian plugin rules, must report 0 errors
npm run build     # type-check, then bundle to main.js
```

Run all three before proposing a change. `npm run build` is required before a release because `main.js` is a published asset.

## Code style

- Tabs for indentation, single quotes, semicolons, `readonly` and `Object.freeze` for returned data.
- Write comments that explain *why* a decision was made, not what the line does. Comment where the reason is not obvious from the code.
- Never set styles inline (`element.style.foo = ...`). Add a class in `styles.css` instead, so themes can override it and the Obsidian lint rules stay clean.
- Do not depend on Obsidian's syntax tree or on decoration DOM elements for behaviour. Live Preview parses differently from the test environment. Use measured coordinates, regular expressions, and indentation columns instead — several past bugs came from ignoring this.

## Testing instructions

- Every behaviour change needs a test. Pure logic goes in a testable module with no Obsidian import; DOM and CSS contracts are asserted in `tests/mobile-compatibility.test.ts` by parsing `styles.css`.
- Automated tests cannot reproduce the iOS keyboard, real touch layout, or third-party themes. Say so, and ask for device verification instead of claiming it works.
- When a report contradicts the tests, check which build the user is actually running before changing code. A stale copy on another device has caused this more than once.

## Security and privacy

This repository is public and its releases install into other people's vaults. Before pushing, and again before each release:

- No paths from the author's private workspace anywhere in the tree, including generated blocks in specs: `grep -rn "300_專案\|200_Reference\|000_Agent\|chi_agent\|Obsidian Vault" . --exclude-dir=node_modules --exclude-dir=.git`
- No credentials: `grep -rniE "api[_-]?key|secret|token|password|ghp_" . --exclude-dir=node_modules --exclude=package-lock.json`
- The esbuild banner and any generated comment may name only the public repository URL, never a local path — that line ships inside `main.js`.
- Sanitize user input before it becomes a file path; `trim()` alone is not enough.
- Remove debugging probes and console logging before release.

## Release instructions

- Keep `manifest.json`, `package.json`, `package-lock.json`, and `versions.json` on the same version, and update the version assertion in `tests/mobile-compatibility.test.ts`.
- Tags carry no `v` prefix. Release notes are written in English first, then Traditional Chinese, and explain the cause of a fix rather than only the fix.
- Attach exactly `main.js`, `manifest.json`, and `styles.css` to the GitHub release.
