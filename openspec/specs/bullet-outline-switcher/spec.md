# bullet-outline-switcher Specification

## Purpose

Define how Bullet Zoom derives the supported Bullet hierarchy for the current Markdown editor and presents safe hierarchy navigation without changing Markdown.

## Requirements

### Requirement: Derive a current-file Bullet outline

The plugin SHALL derive an immutable hierarchy from every supported plain unordered-list item in the current CodeMirror document, regardless of viewport or fold visibility. Each outline node SHALL contain the item's display label, its marker anchor, and its direct supported-Bullet children. A node's parent SHALL be the nearest structurally open preceding supported Bullet with a smaller indentation; a node with no such ancestor SHALL be top-level. Empty item labels SHALL use `（空白節點）`. Numbered items, task items, headings, frontmatter sequences, fenced-code text, continuation text, and items from other Markdown files SHALL NOT appear.

#### Scenario: Build direct children from indentation

- **WHEN** the current note contains supported Bullets at parent, child, grandchild, sibling, and second-root indentation levels
- **THEN** the outline contains two top-level nodes, assigns child and sibling directly to the first parent, and assigns grandchild directly to child

##### Example: Five-item hierarchy

- **GIVEN** the source `- Parent\n  - Child\n    - Grandchild\n  - Sibling\n- Second root`
- **WHEN** the outline is derived
- **THEN** the hierarchy is `Parent[Child[Grandchild], Sibling]` followed by `Second root`

#### Scenario: Include folded and offscreen targets

- **WHEN** a supported Bullet is outside `EditorView.visibleRanges` or replaced by an active CodeMirror fold
- **THEN** its outline node and descendants remain available at their document anchors

#### Scenario: Exclude unsupported structures and other files

- **WHEN** the current file contains a plain Bullet, a task, a numbered item, a heading, and a link to another note containing Bullets
- **THEN** the outline contains only the plain Bullet from the current file

#### Scenario: End ancestry at a structural interruption

- **WHEN** a heading, task item, or same-indent paragraph separates a supported parent Bullet from a later indented supported Bullet
- **THEN** the later Bullet is top-level rather than being attached to the no-longer-open parent

#### Scenario: Wait for a complete syntax tree

- **WHEN** CodeMirror has not parsed the current document through its final line within the bounded synchronous parsing window
- **THEN** the switcher reports that the note structure is still being parsed and SHALL NOT display or navigate a partial outline

#### Scenario: Distinguish duplicate and empty labels by anchor

- **WHEN** two supported items have the label `Idea` and a third supported item has no text after its marker
- **THEN** all three nodes retain distinct anchors and the empty node displays `（空白節點）`

---
### Requirement: Present an adaptive outline switcher

While focus is active, the plugin SHALL render one native outline-switcher trigger after the breadcrumb path in the same navigation container. The trigger SHALL have the accessible name `切換 Bullet`, SHALL remain visually separate from breadcrumb labels, and SHALL open a plugin-owned presentation outside normal Markdown and breadcrumb layout flow. Opening the presentation SHALL NOT change editor line height, breadcrumb block height, Markdown, selection, or focus anchor.

Desktop SHALL display a Bike-inspired cascading-column overlay anchored below the trigger. The first column SHALL list top-level nodes, each later column SHALL list the direct children of the selected node in the preceding column, and opening SHALL pre-expand the active focus path with its entries highlighted. The overlay SHALL remain within the current editor viewport, SHALL vertically scroll each long column, and SHALL internally reveal later columns without increasing the editor pane width.

Opening a desktop presentation SHALL move keyboard focus to the current node label, or the first available node label when the current node is unavailable. Re-hovering an already open branch SHALL NOT rebuild the presentation. The controller SHALL recompute desktop placement when the owning pane or trigger geometry changes. Activating the same trigger again SHALL close the current presentation.

Phone and tablet SHALL display a modal bottom sheet containing one sibling level at a time. Opening SHALL show the current item's sibling level with the current item highlighted. The sheet SHALL provide explicit back navigation toward the note root, SHALL keep each actionable control at least 44 by 44 CSS pixels, SHALL keep lists internally scrollable, and SHALL NOT cause horizontal page scrolling.

Opening a phone or tablet presentation SHALL move focus into the modal, keep Tab and Shift-Tab within its native controls, preserve a valid focused action after changing levels, and restore trigger focus on close. The plugin SHALL size and reposition its mobile overlay from `visualViewport` when that API is available, including resize or offset changes caused by the software keyboard; the CSS viewport SHALL remain the fallback when it is unavailable.

#### Scenario: Open a desktop cascade on the active path

- **WHEN** `Grandchild` is focused under `Parent` and `Child` and the desktop user activates `切換 Bullet`
- **THEN** the overlay shows a top-level column with `Parent` highlighted, a child column with `Child` highlighted, and a grandchild column with `Grandchild` highlighted

#### Scenario: Open a mobile sheet at the sibling level

- **WHEN** `Child A2` is focused under `Parent A` and the phone user activates `切換 Bullet`
- **THEN** the sheet lists the direct children of `Parent A`, marks `Child A2` as current, and provides a back action to the note's top-level items

#### Scenario: Keep the mobile modal above the software keyboard

- **WHEN** the mobile visual viewport becomes shorter or changes vertical offset while the sheet is open
- **THEN** the plugin updates the overlay height and top offset so the sheet remains inside the visible viewport

#### Scenario: Keep the switcher out of editor layout

- **WHEN** the switcher opens and closes beside a focused Bullet
- **THEN** the measured Bullet line height, breadcrumb block height, editor document width, Markdown, selection, and focus anchor remain unchanged

#### Scenario: Show an empty state without a target action

- **WHEN** the captured editor state contains no valid outline node
- **THEN** the presentation displays a non-actionable empty-state message and offers only close navigation

---
### Requirement: Separate focus selection from hierarchy browsing

Each outline node SHALL render a label action that focuses that exact node. A node with direct children SHALL additionally render a distinct child-chevron action that reveals those children without changing focus, selection, fold state, or Markdown. A leaf SHALL NOT render a child-chevron action. The fixed `全文` action SHALL exit Bullet focus through the existing explicit exit transition.

Selecting a Bullet label SHALL invoke the existing fold-aware focus transition at that node's anchor, move the cursor to the end of the target's first line, close the switcher, and restore editor focus. The transition SHALL reveal target-owned and target-covering folds, SHALL preserve folds beginning on descendant lines, and SHALL keep Markdown unchanged. Duplicate labels SHALL navigate by anchor rather than visible text.

#### Scenario: Focus a parent that also has children

- **WHEN** `Parent` has direct children and the user activates the `Parent` label action
- **THEN** `Parent` becomes focused immediately and the switcher closes without requiring the user to browse its children

#### Scenario: Browse children without focusing the parent

- **WHEN** `Parent` is not the active focus and the user activates its child-chevron action
- **THEN** the presentation reveals only `Parent`'s direct children while the existing focus anchor, editor selection, folds, and Markdown remain unchanged

#### Scenario: Focus a folded target from the switcher

- **WHEN** the user selects a node whose marker is covered by an ancestor fold and whose own first line owns a fold
- **THEN** the shared focus transition removes the covering and target-owned folds, preserves descendant-owned folds, focuses the selected node, and leaves Markdown unchanged

#### Scenario: Return to the complete note

- **WHEN** the user activates `全文` in the switcher
- **THEN** the existing exit transition clears focus, closes the switcher, retains the current editor selection, and displays the complete note

---
### Requirement: Close safely and preserve per-editor ownership

One open switcher SHALL belong to one `EditorView`. Multiple panes MAY own independent presentations, but only the topmost presentation in a document SHALL handle a document-level Escape or desktop outside activation. Escape, the explicit close action, desktop outside activation, successful target selection, successful `全文` selection, file replacement, document identity change, focus-session invalidation, or editor destruction SHALL close that switcher and remove its plugin-owned overlay or sheet. Closing without navigation SHALL return keyboard focus to the trigger when that trigger remains valid. A stale switcher SHALL NOT dispatch an anchor captured from a replaced document or file, even if a permissive callback fails to notice that the file path changed.

All user-derived labels SHALL be inserted as text rather than HTML. Trigger, label, chevron, back, close, and root actions SHALL be native buttons with role-specific accessible names. The desktop presentation SHALL expose a labelled navigation-dialog relationship, and the phone or tablet sheet SHALL expose a labelled modal-dialog relationship.

#### Scenario: Close with Escape without changing focus

- **WHEN** the switcher is open and the user presses Escape
- **THEN** the presentation is removed, the active Bullet focus and selection remain unchanged, and keyboard focus returns to the valid trigger

#### Scenario: Reject a stale anchor after document replacement

- **WHEN** the switcher captures anchor 42 and the editor document or file changes before that label is activated
- **THEN** the switcher closes without dispatching focus to anchor 42

#### Scenario: Keep split panes independent

- **WHEN** two editor panes have independent focus sessions and the first pane opens its switcher
- **THEN** only the first pane owns and displays that switcher and no action changes the second pane's focus session

#### Scenario: Close only the topmost split-pane presentation

- **WHEN** two editor panes have open switchers and the user presses Escape once
- **THEN** only the topmost presentation closes and restores its own trigger focus

#### Scenario: Render a Markdown label as plain text

- **WHEN** a Bullet label contains `<img src=x onerror=alert(1)>`
- **THEN** the switcher displays those characters as text and creates no image or executable event handler

---
### Requirement: Activate a native sidebar label with one complete gesture

A valid Bullet label in the native sidebar SHALL invoke its revision-bound focus action on the first complete primary desktop click, first keyboard activation, or first mobile tap. Activating the already-open Bullet sidebar ItemView SHALL NOT schedule a model render solely because that sidebar leaf became active, and SHALL NOT replace the pressed label between pointer down and click. One user gesture SHALL invoke at most one focus transition.

The plugin SHALL retain native button click semantics for labels and SHALL NOT move focus navigation to pointerdown, synthesize an additional click, or bypass anchor, revision, editor, file, document, marker, or connection validation. Explicit command, ribbon, or breadcrumb opening SHALL still reveal the current node, and source editor document, file, editor, focus, caret, title, layout, and destruction changes SHALL still refresh or invalidate the sidebar as specified.

#### Scenario: Switch on the first desktop click

- **WHEN** a desktop user presses a valid label while the editor pane is active and native pointer activation makes the Bullet sidebar leaf active before click
- **THEN** the original label remains connected through click, the selected Bullet becomes focused once, and no preliminary gray-only focus click is required

#### Scenario: Do not dispatch twice

- **WHEN** one complete primary desktop click activates a valid label
- **THEN** the focus callback runs exactly once and the resulting focus anchor equals that label's numeric anchor

#### Scenario: Retain keyboard activation

- **WHEN** a keyboard user focuses a valid label button and presses Enter or Space once
- **THEN** the selected Bullet becomes focused once through the same validated label action

#### Scenario: Retain mobile tap activation

- **WHEN** a phone or tablet user taps a valid label once
- **THEN** the selected Bullet becomes focused once and native drawer return behavior remains unchanged

#### Scenario: Reject a stale label

- **WHEN** the source editor, file, document, revision, or marker identity changes before click completes
- **THEN** the stale label performs no focus transition even though sidebar-self activation no longer schedules a redundant render

#### Scenario: Preserve relevant refresh paths

- **WHEN** the source document, source editor, file, focus anchor, caret anchor, note title, layout, explicit-open request, or editor lifetime changes
- **THEN** the sidebar still refreshes, reveals, or invalidates its model through the existing owner-specific path

---
### Requirement: Render outline rows in a compact indent-first style

Outline rows SHALL keep their hierarchical index rendered inline with the row (inline-flex, minimum 24 CSS pixel width, muted color, tabular numerals) so the index, disclosure triangle, and label align on one visual line. Leaf rows SHALL render an empty spacer in the disclosure position with no visible glyph. The row preview control SHALL render a magnifier SVG icon instead of the「…」character so it cannot be confused with label truncation ellipses. Mobile rows SHALL indent 12 CSS pixels per depth level (capped at depth 6) while preserving the existing 44 CSS pixel touch targets.

#### Scenario: Single-line row anatomy

- **WHEN** the outline renders a branch with parents and leaves
- **THEN** each row keeps index, disclosure, and label on one line, and leaf rows show an empty spacer with no glyph

##### Example: Leaf spacer is empty

- **GIVEN** a note containing `- Parent\n  - Leaf`
- **WHEN** the outline renders with `Parent` expanded
- **THEN** the `Leaf` row's disclosure position contains an aria-hidden spacer whose text content is empty

#### Scenario: Preview control uses an icon

- **WHEN** a row's label overflows and the preview control is shown
- **THEN** the control contains an SVG icon and no「…」text content

##### Example: Icon audit

- **GIVEN** a rendered mobile outline row with an overflowing label
- **WHEN** the preview button is inspected
- **THEN** it contains an `svg` element and its text content is empty

#### Scenario: Mobile depth indentation

- **WHEN** the outline renders on mobile
- **THEN** each depth level indents 12 CSS pixels more than its parent up to depth 6

##### Example: Depth six cap

- **GIVEN** the mobile stylesheet is loaded
- **WHEN** the depth-6 row rule is inspected
- **THEN** its inline-start padding is 72px and touch heights remain 44px

---
### Requirement: Group the outline into heading sections

The outline SHALL scan the note for ATX headings (levels 1–6), skipping frontmatter and fenced code blocks, and SHALL render each heading as a non-interactive section header row in document order. Top-level bullets SHALL be grouped under the nearest preceding heading, bullets before the first heading form a headerless leading group, and the top-level index numbering SHALL restart at 1 within each section while nested numbering rules stay unchanged. Headings without bullets SHALL still render, and notes without headings SHALL render exactly as before.

#### Scenario: Sections restart numbering

- **WHEN** a note contains two headings each followed by top-level bullets
- **THEN** the outline shows both heading rows and the first bullet under each heading is numbered `1.`

##### Example: Two sections

- **GIVEN** the note `# Raw Ideas\n- A\n- B\n# Outline\n- C`
- **WHEN** the outline renders
- **THEN** heading rows `Raw Ideas` and `Outline` appear, `A` is `1.` and `B` is `2.` under the first, and `C` is `1.` under the second

#### Scenario: Header rows are visual only

- **WHEN** the user interacts with a heading row
- **THEN** it triggers no zoom, fold, or selection action and is not focusable

##### Example: Non-interactive audit

- **GIVEN** a rendered heading row
- **WHEN** it is inspected
- **THEN** it is not a button, carries no click handler contract, and is excluded from the tab order

#### Scenario: Leading bullets and code blocks

- **WHEN** bullets appear before the first heading or a `#` line sits inside a fenced code block
- **THEN** the leading bullets render in a headerless first group and the fenced `#` line does not create a section

##### Example: Fence is ignored

- **GIVEN** the note `- A\n\`\`\`\n# not a heading\n\`\`\`\n# Real\n- B`
- **WHEN** the outline renders
- **THEN** only one heading row `Real` appears, `A` is `1.` in the leading group, and `B` is `1.` under `Real`
