## MODIFIED Requirements

### Requirement: Choose the icon for each menu slot

Each menu slot SHALL offer an icon field alongside its command and enabled controls, accepting any Obsidian icon id, with autocomplete over the available ids and a preview of the current icon next to the slot name. Leaving the field empty SHALL mean "use the command's icon". An icon id that does not exist SHALL leave the slot with the command's icon rather than an empty button, and changing the command SHALL keep an explicitly chosen icon.

The preview SHALL be a button that opens an icon picker, so a slot can be configured without knowing any icon id. The picker SHALL show a search box and a grid in which every entry draws the actual icon above a readable name derived from its id, SHALL limit how many entries it draws at once so opening it stays fast, and SHALL filter as the search text changes, preferring entries whose name starts with the search text. Choosing an entry SHALL apply it to the slot and update the field, the preview, and the stored settings together. The picker SHALL also offer a way to clear the icon, which is the same as leaving the field empty.

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

- **WHEN** the icon preview of a slot is activated
- **THEN** an icon picker opens for that slot, and choosing an entry applies it to the field, the preview, and the settings

##### Example: Picking a star

- **GIVEN** slot 1 holding the copy command with no icon
- **WHEN** the preview is activated and `star` is chosen
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
