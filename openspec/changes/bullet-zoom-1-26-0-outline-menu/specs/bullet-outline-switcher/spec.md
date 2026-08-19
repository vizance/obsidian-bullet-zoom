## ADDED Requirements

### Requirement: Open the bullet menu from an outline row

Each outline row's hierarchical number SHALL be able to open the bullet menu for that row's bullet, mirroring the editor where the marker opens the menu and the text zooms. The row's text SHALL keep zooming, and the number SHALL NOT zoom. Long press SHALL NOT be used, because it already reorders rows.

The behavior SHALL be governed by a setting that defaults to on and appears only when the menu can be opened at all. When the setting is off, the number SHALL render as inert display text, hidden from assistive technology, exactly as before. When it is on, the number SHALL be a button carrying an accessible name that says it opens the menu for that bullet, and the menu SHALL open centred on the number and act on that row's position in the document. A row whose action is no longer valid — the outline moved on, or the editor is gone — SHALL open nothing and refresh the outline instead.

#### Scenario: The number opens the menu

- **WHEN** the setting is on and a row's number is activated
- **THEN** the bullet menu opens for that row's bullet, positioned on the number

##### Example: Activating the number

- **GIVEN** an outline row for the bullet `Topic` at document position 12
- **WHEN** its number is activated
- **THEN** the menu request carries anchor 12

#### Scenario: The text still zooms

- **WHEN** a row's text is activated while the setting is on
- **THEN** the plugin zooms into that bullet and no menu opens

##### Example: Text and number do different things

- **GIVEN** an outline row with the setting on
- **WHEN** its text is activated
- **THEN** exactly one zoom request is made and no menu request

#### Scenario: The number is inert when the setting is off

- **WHEN** the setting is off
- **THEN** the number renders as plain text, hidden from assistive technology, and cannot be activated

##### Example: Inert numbering

- **GIVEN** the setting is off
- **WHEN** a row renders
- **THEN** its number is a span marked `aria-hidden`

#### Scenario: A stale row opens nothing

- **WHEN** the number of a row whose revision no longer matches is activated
- **THEN** no menu opens and the outline refreshes

##### Example: Stale revision

- **GIVEN** an outline rendered at revision 1 and a coordinator now at revision 2
- **WHEN** a row number from the old render is activated
- **THEN** no menu opens
