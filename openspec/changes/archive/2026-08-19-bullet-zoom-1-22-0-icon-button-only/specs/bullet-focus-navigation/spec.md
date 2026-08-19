## MODIFIED Requirements

### Requirement: Choose the icon for each menu slot

Each menu slot SHALL expose its icon through a single control: a preview button that draws the icon the menu would use and opens an icon picker when activated. There SHALL be no icon id text field, so configuring a slot never requires knowing an id. An icon id stored by an earlier version SHALL keep working, and an icon id that does not exist SHALL leave the slot with the command's icon rather than an empty button. Changing the command SHALL keep an explicitly chosen icon, and a slot with no chosen icon SHALL use the command's icon, falling back to a neutral marker icon when the command has none.

The picker SHALL show a search box and a grid in which every entry draws the actual icon above a readable name derived from its id, SHALL limit how many entries it draws at once so opening it stays fast, and SHALL filter as the search text changes, preferring entries whose name starts with the search text. Choosing an entry SHALL apply it to the slot, updating the preview and the stored settings together. The picker SHALL also offer a way to clear the icon, returning the slot to the command's icon.

#### Scenario: The icon has one control

- **WHEN** a slot row is rendered
- **THEN** it shows a number, an icon button, a command picker, and an enable switch, and no icon id field

##### Example: Slot row controls

- **GIVEN** the settings tab is open
- **WHEN** a slot row is inspected
- **THEN** it contains exactly one icon control, the preview button

#### Scenario: A configured icon wins over the command's icon

- **WHEN** a slot has both an icon id and a command that carries its own icon
- **THEN** the menu renders the slot's icon

##### Example: Resolution order

- **GIVEN** a slot icon `star`, a command icon `copy`, and a default `circle-dot`
- **WHEN** the icon is resolved
- **THEN** the result is `star`

##### Example: Falling back

- **GIVEN** an empty slot icon and a command without an icon
- **WHEN** the icon is resolved
- **THEN** the result is the default icon

#### Scenario: Icon ids are persisted and normalized

- **WHEN** settings are loaded
- **THEN** each slot's icon is a trimmed string, defaulting to empty for settings saved before the field existed

##### Example: Older records gain an empty icon

- **GIVEN** stored slots `{copy, enabled, icon: "  star  "}` and `{delete, enabled}`
- **WHEN** the settings are normalized
- **THEN** the first icon is `star` and the second icon is empty

#### Scenario: The preview opens a picker

- **WHEN** the icon button of a slot is activated
- **THEN** an icon picker opens for that slot, and choosing an entry applies it to the preview and the settings

##### Example: Picking a star

- **GIVEN** slot 1 holding the copy command with no icon
- **WHEN** the icon button is activated and `star` is chosen
- **THEN** the slot icon becomes `star` and the preview draws the star

#### Scenario: The picker filters by name

- **WHEN** search text is entered
- **THEN** only matching entries are listed, those whose name starts with the text first, capped at the display limit

##### Example: Prefix matches lead

- **GIVEN** the ids `lucide-star`, `lucide-star-off`, and `lucide-align-left` and the search text `star`
- **WHEN** the list is filtered
- **THEN** it holds `lucide-star` and `lucide-star-off`, in that order

##### Example: The list is capped

- **GIVEN** five hundred ids and an empty search text
- **WHEN** the list is filtered with a limit of one hundred and twenty
- **THEN** it holds one hundred and twenty entries

#### Scenario: Names are readable

- **WHEN** an entry is labelled
- **THEN** its name drops the icon set prefix and reads as words

##### Example: Label for a lucide id

- **GIVEN** the id `lucide-file-output`
- **WHEN** it is labelled
- **THEN** it reads `file output`

#### Scenario: Clearing returns to the command icon

- **WHEN** the picker's clear option is chosen
- **THEN** the slot icon becomes empty and the preview shows the command's icon

##### Example: Clearing a chosen icon

- **GIVEN** slot 1 holding the copy command with the icon `star`
- **WHEN** the clear option is chosen
- **THEN** the slot icon becomes empty and the preview draws the copy icon

### Requirement: Edit menu slots in a compact list

The menu slots SHALL be rendered as a plugin-owned list rather than as one standard settings row each, so eight slots stay readable on a tablet. Each slot row SHALL show, in order, its number, the icon button, the command picker, and the enable switch, laid out on one line while there is room and wrapping only when there is not, with the command picker taking the free space. Changing a control SHALL update the row immediately without redrawing the tab.

#### Scenario: A slot row stays on one line

- **WHEN** the slot list is rendered on a wide panel
- **THEN** each row places its number, icon button, command picker, and switch side by side

##### Example: Stylesheet audit

- **GIVEN** the plugin stylesheet is loaded
- **WHEN** the slot row rule is inspected
- **THEN** it lays the row out as a flex line whose command picker takes the free space

#### Scenario: The preview follows the configuration

- **WHEN** a slot's command or icon changes
- **THEN** the icon button shows the icon the menu would draw

##### Example: Switching command

- **GIVEN** slot 1 holding the copy command with no chosen icon
- **WHEN** its command changes to delete
- **THEN** the icon button switches to the delete command's icon

## ADDED Requirements

### Requirement: Show only the menu settings that apply

The bullet menu section SHALL present one control for what a bullet marker does, offering exactly three choices: open the menu on tap, zoom on tap with no menu, or zoom on tap with the menu on a long press. That choice SHALL be stored in the existing enable and marker-tap settings, so no stored settings need migrating. The section SHALL then show only the settings the choice actually uses: the press duration SHALL appear only for the long-press choice, and the slot list SHALL appear only when the menu can be opened at all. Changing the choice SHALL redraw the section immediately.

#### Scenario: Zooming hides the menu settings

- **WHEN** the marker is set to zoom with no menu
- **THEN** neither the press duration nor the slot list is shown

##### Example: Zoom only

- **GIVEN** the marker choice is zoom with no menu
- **WHEN** the settings tab renders
- **THEN** the bullet menu section contains only the marker choice

#### Scenario: Tapping to open the menu hides the press duration

- **WHEN** the marker is set to open the menu on tap
- **THEN** the slot list is shown and the press duration, which only governs long presses, is not

##### Example: Stored values for the tap choice

- **GIVEN** the open-the-menu choice
- **WHEN** it is saved
- **THEN** the menu stays enabled and the marker tap action is `menu`

#### Scenario: The long-press choice shows everything

- **WHEN** the marker is set to zoom with the menu on a long press
- **THEN** both the press duration and the slot list are shown

##### Example: Stored values for the long-press choice

- **GIVEN** the long-press choice
- **WHEN** it is saved
- **THEN** the menu stays enabled and the marker tap action is `zoom`
