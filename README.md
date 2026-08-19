# Bullet Zoom

Zoom into any bullet in Obsidian and work on it as if it were its own page — on desktop, phone, and tablet.

Bullet Zoom brings the outliner workflow of Workflowy, Logseq, and Bike to Obsidian: focus a branch, browse the whole note from a bullet outline, drag rows to reorder, and split a branch off into its own note.

Zooming only changes what the current editor pane shows. Your Markdown is never rewritten.

[繁體中文說明](README.zh-TW.md)

## Install

### With BRAT (recommended)

1. Install and enable BRAT in Obsidian.
2. Run `BRAT: Plugins: Add a beta plugin for testing (with or without version)`.
3. Enter `vizance/obsidian-bullet-zoom`.
4. Pick the latest version.
5. Enable Bullet Zoom under **Settings → Community plugins**.

The same repository serves desktop, phone, and tablet. Use BRAT's update command for later releases.

### Manually

Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/vizance/obsidian-bullet-zoom/releases/latest), put them in `.obsidian/plugins/bullet-zoom/` inside your vault, then enable the plugin.

Requires Obsidian `1.11.7` or newer.

## Zoom into a bullet

Either:

- Tap or click the bullet marker (the dot, or the number for ordered lists).
- Put the cursor inside a bullet and run **Zoom into current bullet**.

Once focused, the bullet's own text becomes the page title and its children follow underneath. Breadcrumbs at the top show the full path, starting with a home icon for the whole note. The layout is rebased on the focused bullet, so a deeply nested branch still uses the full width of the screen.

The faint `+` at the bottom adds an empty child bullet, indented according to your current Obsidian or Outliner settings. One undo reverts it.

### Go back

- Click any ancestor in the breadcrumbs to jump to that level.
- Click the home icon to return to the whole note.
- Run **Go to parent bullet**, or **Exit bullet focus** to leave immediately.

### Dictation and AI tools keep working

Voice-to-text and AI writing tools often insert paragraphs that break the list structure. Bullet Zoom keeps that content visible, and about half a second after you stop typing it tidies the focused area: each line becomes a bullet one level below the bullet it follows, all lines of the same run stay siblings, blank lines are removed, and the wording is never rewritten. Bullets already nested deeper keep their level, and the tidy stops at a code fence or a heading — a heading you used to separate groups of bullets keeps its `#` and the blank line before it. When the editor's list continuation has swallowed a top-level heading into a bullet (`- # Outline`), the tidy gives the heading its line back. One undo reverts just the fix. Tidying runs only while you are zoomed in, and only in the pane you are typing in, so a note sitting in another split is never rewritten and ordinary editing outside zoom is never touched. Turn it off with **Fix broken bullets** under **Focus page**.

### Headings stay headings

Pressing Enter inside a list makes Obsidian start the next item, so a heading typed there lands after the marker as `- # Outline` and stops being a heading. Bullet Zoom removes that marker in the same transaction, so the heading works and one undo reverts both. Only the line you just edited is inspected, indented items are left alone — a heading cannot be indented — and `#tag` is not a heading. Turn it off with **Keep headings out of bullets** under **Editing**.

### Radial menu

Tap a bullet marker on mobile and the commands fan out beside it — zoom is simply one of the commands in the ring. A tap is more precise than a hold, since the menu is anchored on the marker and never drifts with your thumb. Prefer the old split? Set **Marker tap** to zoom, and a hold still opens the menu. Keep holding and slide to an item, then lift to run it; or lift first and tap one. The centre button, a tap outside, or Escape closes the menu without running anything.

While the menu is open the editor is frozen: the caret is hidden and cannot be dragged, so the finger that opened the menu only drives the menu. Closing it restores the caret and the keyboard exactly as they were. Opening the menu never focuses the editor, so the keyboard stays down, and the layout uses the visible viewport — if the keyboard is already up, the fan still lands above it. Items spread out with a short entrance animation, which is skipped when your system asks for reduced motion.

The fan opens toward whichever side of the screen has more room — to the right for a bullet near the left edge — and its spread narrows near the top or bottom, so no item ever lands off screen. Items show icons rather than names, and the name of the item under your thumb appears just below the centre.

Each of the eight slots holds an Obsidian command id, an optional icon id, and an on/off switch, so the menu can run the plugin's own bullet commands or anything from another plugin, and you can hide a slot without losing its command. Out of the box the first five slots are copy, delete, insert prefix, zoom, and extract to note.

A slot with no icon of its own uses the command's icon, falling back to a neutral dot for commands that have none. To choose one, tap the icon button beside the slot number: a picker opens with a search box and a grid of real icons, and a **Use the command icon** button clears the choice. There is no icon id to type.

The menu sizes itself for the device: phones keep the compact ring, tablets get larger buttons and icons, and the fan widens when it holds many items so a full set of eight never overlaps.

The bullet commands below come with the plugin and also work from the command palette:

- **Copy bullet** — copies the bullet's text, or the bullet with its children when the copy scope says so.
- **Cut bullet** — copies the bullet and all of its children, then removes that branch. The removal happens only after the copy succeeds, so a failed copy never loses content.

Pasting a branch back is handled too. When you paste list content with the cursor on a list line, the branch is rewritten to belong to that list: every line moves to the target's indentation while keeping its depth, so children stay nested, and every marker adopts the target's style — a numbered branch pasted into a bulleted list comes out bulleted, and a bulleted branch pasted into a numbered list is renumbered per level. Pasting into an empty bullet fills that line instead of leaving a stray marker. Turn it off with **Match the list you paste into** under **Bullet commands**.
- **Clear bullet text** — empties the bullet but keeps it and its children, ready for retyping.
- **Delete bullet** — removes the bullet and everything nested under it, line break included.
- **Insert prefix text** — inserts the configured text after the marker, or removes it when it is already there.

Settings live under **Bullet menu**. One choice decides what a marker tap does: open the menu, zoom, or zoom with the menu on a long press. The rest of the section follows that choice — the press duration appears only for the long-press option, and the slot list only when the menu can open at all. Each slot row shows its number, the icon button, the command picker, and an on/off switch. A short press still zooms, and moving your finger cancels the gesture so scrolling is unaffected.

### Folding is separate from zooming

Obsidian's native fold arrow only collapses and expands a thread — it never zooms. The bullet marker zooms. Each list line is split by measured coordinates into three zones: the fold arrow before the marker, the marker itself, and the text after it. Because the split comes from measurement rather than from how Live Preview renders the line, tapping the marker zooms whether or not the editor already has focus. The fold zone covers everything left of the marker, including the indentation, so a foldable line can be collapsed from anywhere in that space; lines with nothing to fold are never intercepted, and the fold arrow keeps Obsidian's own size and alignment.

Zooming into a collapsed bullet expands just enough to reveal the target, leaving deeper collapsed sections as they were.

## Bullet outline

Run **Open bullet outline** or click the ribbon icon to browse the current note's bullet structure in the right sidebar.

- Click a row's text to zoom into it; click the disclosure triangle to expand or collapse it in the outline.
- Headings (`#` to `######`) appear as non-interactive section headers, and top-level numbering restarts at `1.` under each heading.
- Rows show hierarchical numbering (`1.`, `1.1`, `1.1.1`). Numbering is display-only and never written to your Markdown.
- The home icon at the top exits focus and returns to the whole note.
- Moving the cursor to a bullet reveals its path in the outline without zooming.
- Labels show plain text only — no `**`, backticks, or link targets. Truncated rows offer a magnifier button that opens the full text.

On phone and tablet the outline uses Obsidian's native right drawer, opens with only the current path expanded, and closes itself after a successful zoom.

### Drag to reorder

Drag a row with the mouse, or press and hold for about a third of a second on touch, then drop it on the upper half of another row to place it before, or the lower half to place it after.

The bullet moves together with its entire indented subtree, and indentation is recalculated to match the drop position. Dropping a branch into its own subtree is rejected. The outline stays still while you drag, so the panel does not slide under your finger.

## Extract a bullet into a new note

Put the cursor on a bullet and run **Extract bullet to new note**. Enter a name — the bullet's text is prefilled and selected — and confirm.

The branch moves into a new note and the original spot is updated according to your settings, keeping the list structure and the outline valid.

Settings under **Extract to new note**:

| Setting | What it does |
| --- | --- |
| Destination folder | Where new notes are created, with autocomplete over existing folders. Empty means the current note's folder. Missing folders are created. |
| Template file | A Markdown file used as the starting point. Empty means no template. |
| Replacement text | What stays behind: a link (default), an embed, or nothing. |
| After extracting | Stay in the current note (default), or open the new note in the current tab, a new tab, or a split. |
| Remove the top bullet | On by default: the new note keeps only the child bullets, dedented to the top level. |

### Template placeholders

| Placeholder | Value |
| --- | --- |
| `{{content}}` | The extracted bullet content |
| `{{title}}` | The name you entered |
| `{{date}}` | Local date, `YYYY-MM-DD` |
| `{{time}}` | Local time, `HH:mm` |
| `{{source}}` | A wiki link back to the source note |

Placeholders are case-insensitive and tolerate inner spaces. If the template has no `{{content}}`, the content is appended after a blank line.

## Settings

Settings are grouped into six described sections:

- **Zoom** — detect plain bullets and numbered items independently.
- **Focus page** — scale the title shown after zooming, toggle indent guides, and fix broken bullets automatically.
- **Outline** — scale the outline text; lower values fit more lines on screen.
- **Bullet commands** — what copy puts on the clipboard, and the text the prefix command inserts.
- **Editing** — whether pasted lists are matched to their destination, and whether headings are kept out of bullets.
- **Bullet menu** — choose what a marker tap does, and configure the eight slots when the menu is in use.
- **Extract to new note** — the extraction options listed above.

Both size sliders range from 60% to 160% and have a reset button. Indent guides draw vertical lines that connect nested bullets on the focus page; they are on by default.

## Commands

Bullet Zoom ships without default hotkeys so it never clashes with Outliner or your own bindings. Assign them under **Settings → Hotkeys**:

- `Bullet Zoom: Zoom into current bullet`
- `Bullet Zoom: Go to parent bullet`
- `Bullet Zoom: Exit bullet focus`
- `Bullet Zoom: Open bullet outline`
- `Bullet Zoom: Extract bullet to new note`
- `Bullet Zoom: Copy bullet`
- `Bullet Zoom: Cut bullet`
- `Bullet Zoom: Clear bullet text`
- `Bullet Zoom: Delete bullet`
- `Bullet Zoom: Insert prefix text`

On mobile you can add them to the toolbar.

## Supported syntax

Works in Live Preview with unordered bullets and, when enabled, ordered items:

```markdown
- Dash bullet
* Asterisk bullet
+ Plus bullet
1. Numbered item
2) Numbered item
```

Not supported: task lists, Source mode, Reading view, heading focus, and persisting the last focus across restarts.

## Mobile and tablet

The plugin and its BRAT package support desktop, phone, and tablet. Automated tests lock DOM and CSS contracts for breadcrumbs, editor-only scrolling, the native drawer, single-row outline layout, and touch targets.

Those tests cannot reproduce the iOS keyboard, Dynamic Island, real touch layout, or third-party themes, so every candidate build is also checked on a physical iPhone and iPad. If something is covered, mistapped, or scrolled to the wrong place, please report your device, OS, Obsidian version, and a screenshot.

## Troubleshooting

**Tapping the fold arrow does not zoom.** That is intended — the fold arrow only folds. Tap the bullet marker or use the zoom command.

**A command does nothing.** Check that you are in Live Preview and that the cursor sits inside a supported bullet. If it is a numbered item, enable **Zoom numbered items** in settings.

**The outline is empty.** Open a Markdown note in Live Preview, then run **Open bullet outline** again.

**Extraction reports a missing template.** Check the template path under **Extract to new note**.

## Release history

See the [releases page](https://github.com/vizance/obsidian-bullet-zoom/releases) for notes on every version, in English and Traditional Chinese.

## Development

Source and tests stay in this repository for review, maintenance, and regression safety; BRAT never installs them into your vault. See [CONTRIBUTING.md](CONTRIBUTING.md) for build, test, and release boundaries.

## License

[MIT](LICENSE)
