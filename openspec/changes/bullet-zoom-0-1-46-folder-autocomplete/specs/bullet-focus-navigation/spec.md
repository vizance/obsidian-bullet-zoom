## ADDED Requirements

### Requirement: Autocomplete the extract destination folder

The extract destination setting SHALL offer autocomplete over the vault's existing folders. The plugin SHALL collect folder paths excluding the vault root, deduplicated and sorted lexicographically, and SHALL filter them case-insensitively by substring with prefix matches ordered first, returning at most a bounded number of suggestions (default 8) and returning the leading suggestions when the query is empty. Selecting a suggestion by click or Enter SHALL fill the field with that path and persist the setting; ArrowDown and ArrowUp SHALL move the highlighted suggestion and Escape SHALL dismiss the list. Typing a folder that does not exist SHALL remain allowed.

#### Scenario: Filter folders while typing

- **WHEN** the user types part of a folder name into the destination field
- **THEN** the suggestion list shows matching existing folders with prefix matches first

##### Example: Prefix ordering

- **GIVEN** the vault folders `Cards`, `Archive/Cards`, `Notes`
- **WHEN** the query is `car`
- **THEN** the suggestions are `Cards` then `Archive/Cards`

#### Scenario: Select a suggestion

- **WHEN** the user clicks a suggestion or presses Enter on the highlighted one
- **THEN** the field value becomes that path, the setting persists, and the list closes

##### Example: Click fills the field

- **GIVEN** the suggestion `Cards/Inbox` is displayed
- **WHEN** it is clicked
- **THEN** the field value is `Cards/Inbox` and the persisted extract folder is `Cards/Inbox`

#### Scenario: Empty query lists leading folders

- **WHEN** the field is focused while empty
- **THEN** the first suggestions in sorted order are shown, bounded by the suggestion limit

##### Example: Bounded list

- **GIVEN** a vault with twenty folders
- **WHEN** the empty field is focused
- **THEN** at most eight suggestions render
