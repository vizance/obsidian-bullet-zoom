## ADDED Requirements

### Requirement: Confine the native fold hit area on phones

When the plugin runs in phone mode, it SHALL add a plugin-owned phone-mode class to the Live Preview editor pane and SHALL ship CSS scoped to that class which confines the clickable area of the list-line native `.collapse-indicator` to the fold icon's own compact region. Taps on the Bullet marker SHALL therefore resolve to the plugin's marker Zoom handling, and taps on the editable text region SHALL resolve to native cursor placement — neither SHALL trigger the native fold toggle. The plugin SHALL NOT emit the phone-mode class on desktop, SHALL NOT target heading collapse indicators, and unloading the plugin SHALL restore the native hit area.

#### Scenario: Tap a nested parent bullet on a phone

- **WHEN** a user on a phone taps the marker of a supported Bullet that is indented two to three levels and has children
- **THEN** the plugin performs the Zoom transition and the native fold state does not toggle

##### Example: Third-level parent

- **GIVEN** the document is `- A\n  - B\n    - C\n      - D` and the editor pane carries the phone-mode class
- **WHEN** the user taps the marker of `C`
- **THEN** the focus anchor becomes `C` and `D` remains structurally available

#### Scenario: Fold from the confined icon region

- **WHEN** a user on a phone taps inside the confined `.collapse-indicator` icon region of a foldable list line
- **THEN** the native fold toggle runs and no Zoom transition is dispatched

##### Example: Collapse a parent

- **GIVEN** the document is `- Parent\n  - Child` and the editor pane carries the phone-mode class
- **WHEN** the user taps the confined fold icon of `Parent`
- **THEN** `Parent` collapses and the focus anchor does not change

#### Scenario: Desktop keeps native behavior

- **WHEN** the plugin runs outside phone mode
- **THEN** the editor pane does not carry the phone-mode class and the native `.collapse-indicator` hit area is unchanged from Obsidian defaults

##### Example: Desktop pane class audit

- **GIVEN** the plugin initializes with phone mode disabled
- **WHEN** the Live Preview editor pane is inspected
- **THEN** the phone-mode class is absent and no plugin CSS rule without the phone-mode class prefix targets `.collapse-indicator`
