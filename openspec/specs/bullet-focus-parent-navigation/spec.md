# bullet-focus-parent-navigation Specification

## Purpose

TBD - created by archiving change 'add-bullet-zoom-parent-shortcut'. Update Purpose after archive.

## Requirements

### Requirement: Navigate to the immediate parent focus

The plugin SHALL provide a `bullet-zoom-focus-parent` command that changes an active nested focus to the immediate parent Bullet represented by the current focus session. Repeated command execution SHALL move outward exactly one Bullet level at a time and SHALL NOT change the Markdown document or current selection.

#### Scenario: Return one level from a deeply nested item

- **WHEN** `Grandchild` is focused under `Parent` and `Child`, and the user runs `bullet-zoom-focus-parent`
- **THEN** `Child` becomes the focused item while `Parent` remains its parent breadcrumb

#### Scenario: Return repeatedly through multiple levels

- **WHEN** `Grandchild` is focused under `Parent` and `Child`, and the user runs `bullet-zoom-focus-parent` twice
- **THEN** the first execution focuses `Child` and the second execution focuses `Parent`

#### Scenario: Preserve source and selection during parent navigation

- **WHEN** the user runs `bullet-zoom-focus-parent` from a nested focused item without typing
- **THEN** the Markdown source remains byte-for-byte identical and the current selection remains unchanged

---
### Requirement: Return from a root Bullet to the complete note

The plugin SHALL clear focus when `bullet-zoom-focus-parent` runs while a root-level Bullet is focused, because the complete note is the immediate outer level. Clearing focus SHALL remove the breadcrumb panel and retain the current selection.

#### Scenario: Run the parent command from a root item

- **WHEN** a root-level Bullet is focused and the user runs `bullet-zoom-focus-parent`
- **THEN** focus clears, the complete note appears, the breadcrumb panel disappears, and the selection is retained

---
### Requirement: Register a configurable shortcut command

The plugin SHALL register `bullet-zoom-focus-parent` with the display name `回到上一層 Bullet` so Obsidian can expose it in Hotkeys settings and configurable mobile command surfaces. The plugin SHALL NOT supply a default hotkey, because a Vault can already assign the same key combination to an editing command. The existing `bullet-zoom-exit` command SHALL remain available and SHALL continue to return directly to the complete note.

#### Scenario: Assign a Vault-specific desktop shortcut

- **WHEN** Obsidian loads the plugin and the user searches Hotkeys settings for `回到上一層 Bullet`
- **THEN** the user can assign a Vault-specific key combination to `bullet-zoom-focus-parent`

#### Scenario: Avoid overriding an existing editing shortcut

- **WHEN** another plugin or Obsidian command already uses a key combination in the Vault
- **THEN** Bullet Zoom does not claim that combination through a plugin-supplied default hotkey

##### Example: Outliner already owns the upward movement shortcut

- **GIVEN** `obsidian-outliner:move-list-item-up` is assigned `Mod + Alt + ArrowUp` in the Vault
- **WHEN** Bullet Zoom registers `bullet-zoom-focus-parent`
- **THEN** the Bullet Zoom command has no `hotkeys` metadata and the existing Outliner assignment is not duplicated by the plugin

#### Scenario: Keep direct exit available

- **WHEN** a nested Bullet is focused and the user runs `bullet-zoom-exit`
- **THEN** the plugin returns directly to the complete note without requiring repeated parent navigation

---
### Requirement: Fail parent navigation safely

The parent command SHALL leave the document, selection, and focus state unchanged when no focus session is active. If the Obsidian command callback cannot access a dispatchable CodeMirror editor view, the command SHALL leave state unchanged and SHALL show the notice `無法取得目前的 Obsidian 編輯畫面。`.

#### Scenario: Run the parent command without active focus

- **WHEN** the complete note is visible and the user runs `bullet-zoom-focus-parent`
- **THEN** the document and selection remain unchanged and no notice appears

#### Scenario: Run the parent command without an editor adapter

- **WHEN** the command callback cannot access a dispatchable CodeMirror editor view
- **THEN** the document and focus state remain unchanged and the notice `無法取得目前的 Obsidian 編輯畫面。` appears
