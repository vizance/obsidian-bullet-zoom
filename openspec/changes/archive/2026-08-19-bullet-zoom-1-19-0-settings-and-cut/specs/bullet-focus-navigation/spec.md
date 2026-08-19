## MODIFIED Requirements

### Requirement: Present an English interface grouped into settings sections

All user-facing strings SHALL be written in plain English, and the settings tab SHALL group its options under six headings in this order: `Zoom`, `Focus page`, `Outline`, `Bullet commands`, `Bullet menu`, and `Extract to new note`. Each heading SHALL carry a one-sentence description of what the section covers, and every option SHALL appear under the heading matching its purpose, with names as short noun phrases, descriptions as complete sentences, buttons labelled with verbs, and notices stating what happened plus what to do next. Every setting the plugin persists SHALL have a control in the tab, including the bullet copy scope and the prefix text. Setting keys, defaults, and behavior SHALL stay unchanged.

#### Scenario: Settings render in grouped sections

- **WHEN** the settings tab opens
- **THEN** six described section headings render in order and every option appears under its matching heading

##### Example: Extract options grouped together

- **GIVEN** the settings tab is open
- **WHEN** the `Extract to new note` section is inspected
- **THEN** it contains the destination folder, template file, and remove-top-bullet options

##### Example: Bullet command options grouped together

- **GIVEN** the settings tab is open
- **WHEN** the `Bullet commands` section is inspected
- **THEN** it contains the copy scope and the prefix text

#### Scenario: Interface strings are English

- **WHEN** commands, notices, panels, or dialogs display text
- **THEN** the text is English

##### Example: Command names

- **GIVEN** the plugin registers its commands
- **WHEN** their names are inspected
- **THEN** they read `Exit bullet focus` and `Go to parent bullet`

#### Scenario: Empty labels use English fallbacks

- **WHEN** a bullet has no text or a note has no title
- **THEN** the interface shows `Untitled bullet` or `Untitled note`

##### Example: Empty bullet label

- **GIVEN** a focused bullet whose text is empty
- **WHEN** the breadcrumb renders
- **THEN** it displays `Untitled bullet`

## ADDED Requirements

### Requirement: Edit menu slots in a compact list

The menu slots SHALL be rendered as a plugin-owned list rather than as one standard settings row each, so eight slots stay readable on a tablet. Each slot row SHALL show, in order, its number, a preview of the icon it will display, the command picker, the icon field, and the enable switch, laid out on one line while there is room and wrapping only when there is not. The icon field SHALL state that leaving it empty uses the command's own icon. Changing a control SHALL update the preview immediately without redrawing the tab.

#### Scenario: A slot row stays on one line

- **WHEN** the slot list is rendered on a wide panel
- **THEN** each row places its number, preview, command picker, icon field, and switch side by side

##### Example: Stylesheet audit

- **GIVEN** the plugin stylesheet is loaded
- **WHEN** the slot row rule is inspected
- **THEN** it lays the row out as a flex line whose command picker takes the free space

#### Scenario: The preview follows the configuration

- **WHEN** a slot's command or icon changes
- **THEN** the preview beside its number shows the icon the menu would draw

##### Example: Typing an icon id

- **GIVEN** slot 1 holding the copy command with no icon
- **WHEN** the icon field is set to `star`
- **THEN** the preview switches from the copy icon to the star icon

### Requirement: Cut a bullet with its children

The plugin SHALL register a `Cut bullet` command that copies the bullet at the cursor together with every nested child to the clipboard and then removes that whole branch, including its line break. The copy SHALL happen first and the removal SHALL run only after the clipboard write succeeds, so a failed copy never destroys content. The command SHALL report what happened, and SHALL do nothing when the cursor is not on a supported bullet. Cutting SHALL always include the children regardless of the copy scope setting, and the command SHALL be available from the command palette, from hotkeys, and as a menu slot.

#### Scenario: Cutting removes the branch after copying it

- **WHEN** the cut command runs with the cursor on a bullet that has children
- **THEN** the clipboard holds the bullet and its children, and the branch is gone from the note

##### Example: A branch is cut

- **GIVEN** the document `- A\n- Topic\n  - P1\n- B` with the cursor on `Topic`
- **WHEN** the cut command runs and the clipboard write succeeds
- **THEN** the clipboard holds `- Topic\n  - P1` and the document becomes `- A\n- B`

#### Scenario: A failed copy leaves the note alone

- **WHEN** the clipboard write fails
- **THEN** the document is unchanged and a notice explains that the bullet could not be cut

##### Example: Clipboard refused

- **GIVEN** the document `- A\n- Topic\n  - P1`
- **WHEN** the cut command runs and the clipboard write fails
- **THEN** the document is still `- A\n- Topic\n  - P1`

#### Scenario: Cutting refuses a non-bullet cursor

- **WHEN** the cut command runs while the cursor sits on a plain paragraph
- **THEN** the document is unchanged and a notice explains what to do

##### Example: Cursor on a paragraph

- **GIVEN** the document `Just a paragraph` with the cursor inside it
- **WHEN** the cut command is checked
- **THEN** it reports that it cannot run
