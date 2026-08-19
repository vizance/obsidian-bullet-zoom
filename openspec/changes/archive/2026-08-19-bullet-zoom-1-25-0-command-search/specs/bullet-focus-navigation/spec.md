## MODIFIED Requirements

### Requirement: Edit menu slots in a compact list

The menu slots SHALL be rendered as a plugin-owned list rather than as one standard settings row each, so eight slots stay readable on a tablet. Each slot row SHALL show, in order, its number, the icon button, the command button, and the enable switch, laid out on one line while there is room and wrapping only when there is not, with the command button taking the free space and showing the current command's name, or a muted placeholder when the slot is empty. Choosing either the icon or the command SHALL happen through a searchable picker rather than a long list, and changing a control SHALL update the row immediately without redrawing the tab.

The command picker SHALL offer a search box and a result list in which every entry shows the command's own icon and name, SHALL cap how many results it draws at once, and SHALL treat the search text as whitespace-separated terms that must all appear in the command's name or id, listing name-prefix matches first. It SHALL also offer a way to leave the slot empty. Filtering SHALL be independent of Obsidian so it can be tested directly.

#### Scenario: A slot row stays on one line

- **WHEN** the slot list is rendered on a wide panel
- **THEN** each row places its number, icon button, command button, and switch side by side

##### Example: Stylesheet audit

- **GIVEN** the plugin stylesheet is loaded
- **WHEN** the slot row rule is inspected
- **THEN** it lays the row out as a flex line whose command button takes the free space

#### Scenario: Commands are found by typing

- **WHEN** search text is entered in the command picker
- **THEN** only commands matching every term are listed, name-prefix matches first, capped at the display limit

##### Example: Partial terms across the name

- **GIVEN** the commands `Bullet Zoom: Copy bullet` and `Bullet Zoom: Cut bullet` and the search text `cut bul`
- **WHEN** the list is filtered
- **THEN** only `Bullet Zoom: Cut bullet` remains

##### Example: Matching on the id

- **GIVEN** a command with the id `editor:toggle-bold`
- **WHEN** the search text is `toggle-bold`
- **THEN** that command is listed

##### Example: The list is capped

- **GIVEN** two hundred commands and an empty search text
- **WHEN** the list is filtered
- **THEN** it holds at most the display limit

#### Scenario: A slot can be emptied from the picker

- **WHEN** the picker's empty option is chosen
- **THEN** the slot holds no command and renders no menu item

##### Example: Emptying slot 1

- **GIVEN** slot 1 holding the copy command
- **WHEN** the empty option is chosen
- **THEN** the slot's command id becomes empty and the menu draws seven items instead of eight

#### Scenario: The preview follows the configuration

- **WHEN** a slot's command or icon changes
- **THEN** the icon button shows the icon the menu would draw and the command button shows the command's name

##### Example: Switching command

- **GIVEN** slot 1 holding the copy command with no chosen icon
- **WHEN** its command changes to delete
- **THEN** the icon button switches to the delete command's icon
