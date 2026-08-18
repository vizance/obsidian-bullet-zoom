## ADDED Requirements

### Requirement: Keep plugin settings within the panel width

Every settings row the plugin creates SHALL carry a plugin-owned class, and the stylesheet SHALL constrain those rows so their controls can shrink and never exceed the panel width: control containers SHALL allow shrinking, and select and text inputs SHALL be limited to the available width. The settings tab SHALL therefore not scroll horizontally even when command names in a dropdown are long.

#### Scenario: Long command names do not widen the panel

- **WHEN** a slot dropdown lists commands with long names
- **THEN** the dropdown is limited to the available width instead of widening the row

##### Example: Stylesheet audit

- **GIVEN** the plugin stylesheet is loaded
- **WHEN** the plugin settings rules are inspected
- **THEN** they limit select elements to a maximum width and allow the control container to shrink

### Requirement: Clear a bullet without removing it

The plugin SHALL provide a clear command that removes only the text after the bullet's marker, leaving the marker, its indentation, and every nested child untouched, so an empty bullet remains ready for typing. The command SHALL make no change when the bullet already has no text, and SHALL refuse with a notice when the cursor is not on a supported bullet. It SHALL be available as a command and as a menu slot, and SHALL appear in the default slot configuration.

#### Scenario: Clearing keeps the bullet and its children

- **WHEN** the clear command runs on a bullet that has text and children
- **THEN** only that line's text is removed

##### Example: Clear a parent bullet

- **GIVEN** the document `- Topic\n  - Child` with the cursor on `Topic`
- **WHEN** the clear command runs
- **THEN** the document becomes `- \n  - Child`

#### Scenario: An empty bullet is left alone

- **WHEN** the clear command runs on a bullet whose text is already empty
- **THEN** the planner reports no change

##### Example: Nothing to clear

- **GIVEN** the document `- ` with the cursor on that bullet
- **WHEN** the clear plan is computed
- **THEN** it returns null
