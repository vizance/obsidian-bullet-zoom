## ADDED Requirements

### Requirement: Configure the extract destination and prefill the name

The extract command SHALL support an extractFolder setting (default empty, meaning the current note's folder) that determines where the new note is created, creating the folder when it does not exist and aborting with a notice when creation fails. The extract modal SHALL prefill its name field with the bullet's text, sanitized by trimming whitespace, unwrapping Markdown link syntax to its display text, and removing characters that are illegal in file names, and SHALL select that text so the user can overwrite it directly.

#### Scenario: Extract into a configured folder

- **WHEN** the extract folder setting is a non-empty path and the user confirms a name
- **THEN** the new note is created under that folder rather than the current note's folder

##### Example: Configured destination

- **GIVEN** the extract folder setting is `Cards` and the entered name is `新筆記`
- **THEN** the created path is `Cards/新筆記.md`

#### Scenario: Empty setting keeps the current folder

- **WHEN** the extract folder setting is empty
- **THEN** the new note is created in the current note's folder as before

#### Scenario: Prefilled and sanitized name

- **WHEN** the extract modal opens for a bullet
- **THEN** the name field contains the bullet text with illegal file-name characters removed and link syntax unwrapped, and the text is selected

##### Example: Sanitization table

- **GIVEN** the bullet text `關於 [[卡片盒]] / 筆記: 方法`
- **WHEN** the modal opens
- **THEN** the prefilled name is `關於 卡片盒 筆記 方法`
