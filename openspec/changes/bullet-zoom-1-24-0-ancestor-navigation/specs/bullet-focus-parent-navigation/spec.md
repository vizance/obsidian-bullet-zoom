## ADDED Requirements

### Requirement: Reach an ancestor bullet without zooming

The plugin SHALL provide ancestor navigation that works while editing, not only while zoomed. `Go to parent bullet` SHALL, when no focus session is active, place the cursor at the start of the text of the bullet the cursor's bullet is nested under; when a focus session is active it SHALL keep its existing behavior of moving one level up the breadcrumbs. A separate `Go to top-level bullet` command SHALL climb to the outermost ancestor and place the cursor at the start of its text, so a reader deep in a branch can see the context that branch belongs to. Both SHALL scroll the target into view and return input focus to the editor.

Ancestors SHALL be found by walking up the document and comparing indentation columns, never through the syntax tree, skipping blank lines and stopping at a heading because a heading separates one list from another. While a focus session is active the search SHALL NOT climb above the focused bullet, so the cursor never lands outside what the reader can see. When there is no ancestor — the cursor is already at the top level, or is not on a bullet at all — the command SHALL make no change and SHALL say why.

#### Scenario: The cursor climbs one level while editing

- **WHEN** `Go to parent bullet` runs with no focus session and the cursor inside a nested bullet
- **THEN** the cursor moves to the start of the parent bullet's text

##### Example: One level up

- **GIVEN** the document `- Parent\n\t- Child\n\t\t- Deep` with the cursor at the end of `Deep`
- **WHEN** the command runs
- **THEN** the cursor sits on the `Child` line

#### Scenario: The cursor reaches the outermost bullet

- **WHEN** `Go to top-level bullet` runs from a deeply nested bullet
- **THEN** the cursor moves to the start of the outermost ancestor's text

##### Example: All the way up

- **GIVEN** the document `- Parent\n\t- Child\n\t\t- Deep` with the cursor at the end of `Deep`
- **WHEN** the command runs
- **THEN** the cursor sits immediately before `Parent`

#### Scenario: A heading separates lists

- **WHEN** the nearest less-indented lines lie above a heading
- **THEN** no ancestor is found

##### Example: Heading in between

- **GIVEN** the document `- Root\n# Section\n\t- Child` with the cursor on `Child`
- **WHEN** an ancestor is searched for
- **THEN** there is none

#### Scenario: Zoom limits how far the cursor climbs

- **WHEN** a focus session is active and the outermost ancestor lies above the focused bullet
- **THEN** the cursor stops at the focused bullet

##### Example: Stopping at the focus root

- **GIVEN** a document focused on a middle bullet with deeper bullets under it
- **WHEN** the top-level command runs from the deepest bullet
- **THEN** the cursor lands on the focused bullet rather than above it

#### Scenario: Nothing to climb to is explained

- **WHEN** the cursor is already on a top-level bullet, or is not on a bullet
- **THEN** the document and the cursor are unchanged and a notice explains what to do

##### Example: Already at the top

- **GIVEN** the document `- Only` with the cursor inside it
- **WHEN** `Go to top-level bullet` runs
- **THEN** the cursor does not move and a notice is shown

## MODIFIED Requirements

### Requirement: Fail parent navigation safely

The parent command SHALL leave the document unchanged in every case; it only ever moves the cursor. When no focus session is active and the cursor has no parent bullet above it, the command SHALL leave the selection unchanged and SHALL explain that the cursor needs to be on a nested bullet. If the Obsidian command callback cannot access a dispatchable CodeMirror editor view, the command SHALL leave state unchanged and SHALL show the notice `Could not reach the current editor.`.

#### Scenario: Run the parent command with nothing above the cursor

- **WHEN** the cursor sits on a top-level bullet with no focus session and the user runs `bullet-zoom-focus-parent`
- **THEN** the document and selection remain unchanged and a notice explains what to do

#### Scenario: Run the parent command without an editor adapter

- **WHEN** the command callback cannot access a dispatchable CodeMirror editor view
- **THEN** the document and focus state remain unchanged and the notice `Could not reach the current editor.` appears
