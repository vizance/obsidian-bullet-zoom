## ADDED Requirements

### Requirement: Keep stray lines visible and repair them automatically

While a focus session is active the plugin SHALL treat lines that follow the focused branch — typically paragraphs separated from the list by a blank line, which Markdown parses outside the branch — as stray lines until it reaches a supported list item indented no deeper than the focused bullet, a Markdown heading, or a code fence, excluding trailing blank lines, and SHALL keep those stray lines visible instead of hiding them behind the focus mask, without adding any marker, highlight, or notice. When the autoFixStrayLines setting is enabled, default on and exposed as a toggle, the plugin SHALL — after document changes settle for about 600 milliseconds — rewrite stray lines into children of the focused bullet: plain lines gain a bullet marker at the child indent, lines that already carry a list marker keep their text and marker while their indent is rebased by the block's minimal common indent, and blank lines are preserved. The repair SHALL be dispatched as its own history step so a single undo reverts the repair without removing the content, and no transaction SHALL be dispatched when there are no stray lines.

#### Scenario: A stray line stays visible

- **WHEN** a line without a list marker is inserted directly after the focused branch
- **THEN** it renders inside the focus page instead of being hidden

##### Example: Dictated paragraph

- **GIVEN** the document `- Topic\n  - A\n\ndictated text` with the focus anchor on `Topic`
- **WHEN** the focus decorations recompute
- **THEN** no hidden-block decoration covers the `dictated text` line

#### Scenario: Stray lines become children

- **WHEN** the repair runs on stray lines while auto-fix is enabled
- **THEN** each stray line becomes a child bullet of the focused bullet with its text unchanged

##### Example: Repair a plain line

- **GIVEN** the document `- Topic\n  - A\n\ndictated text` with the focus anchor on `Topic`
- **WHEN** the repair plan is applied
- **THEN** the document becomes `- Topic\n  - A\n\n  - dictated text`

##### Example: Rebase a stray block

- **GIVEN** the document `- Topic\n  - A\n\nfirst\n  - second` with the focus anchor on `Topic`
- **WHEN** the repair plan is applied
- **THEN** the document becomes `- Topic\n  - A\n\n  - first\n    - second`

#### Scenario: Legitimate structure is left alone

- **WHEN** the scan reaches a list item indented no deeper than the focused bullet, a heading, or a code fence
- **THEN** scanning stops there and that content is neither shown as stray nor repaired

##### Example: Sibling bullet stops the scan

- **GIVEN** the document `- Topic\n  - A\n\n- Sibling` with the focus anchor on `Topic`
- **WHEN** the repair plan is computed
- **THEN** it reports no changes and `- Sibling` is untouched

#### Scenario: Nothing to repair produces no transaction

- **WHEN** the focused branch has no stray lines
- **THEN** the planner returns no changes

##### Example: Clean branch

- **GIVEN** the document `- Topic\n  - A` with the focus anchor on `Topic`
- **WHEN** the repair plan is computed
- **THEN** it returns null
