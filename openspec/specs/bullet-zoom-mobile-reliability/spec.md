# bullet-zoom-mobile-reliability Specification

## Purpose

Define reliable native-sidebar rendering during mobile drawer transitions and deterministic Bullet-marker Zoom gestures without taking ownership of separate Obsidian fold controls.

## Requirements

### Requirement: Render the native outline during mobile drawer reveal

When a valid mobile or tablet Markdown editor is attached to the native Bullet Outline ItemView, the plugin SHALL render its ready/empty/limited/unavailable model even if the native drawer is temporarily hidden or its right split reports collapsed. Desktop collapsed sidebars SHALL continue to defer rebuilds until visible.

#### Scenario: Open a mobile drawer with a valid note

- **WHEN** the mobile Bullet Outline ItemView attaches while the native drawer is still transitioning and the current note contains supported Bullets
- **THEN** the ItemView receives and retains the outline model, and opening the drawer shows the Bullet rows without requiring a second command or note switch

##### Example: Nested note during reveal

- **GIVEN** the note contains `- Parent\n  - Child` and the mobile right split reports collapsed during reveal
- **WHEN** the native Bullet Outline ItemView attaches
- **THEN** its rendered text contains `Parent`, and expanding that row reveals `Child`

#### Scenario: Preserve explicit unavailable state

- **WHEN** the attached mobile ItemView has no eligible source editor
- **THEN** it shows the existing non-actionable unavailable message rather than a blank panel

##### Example: No eligible editor

- **GIVEN** the active leaf is not a Live Preview Markdown editor
- **WHEN** the mobile Bullet Outline ItemView attaches
- **THEN** the ItemView displays its unavailable message and no navigation action

---
### Requirement: Complete marker gesture zooms before native fold handling

When a primary pointer or mouse gesture begins inside the exact plugin-owned Bullet marker, the plugin SHALL perform the existing fold-aware Zoom transition immediately and SHALL consume the matching native gesture. One physical gesture SHALL invoke at most one transition.

#### Scenario: Zoom a parent marker with descendants

- **WHEN** a user presses the marker of a supported Bullet that has an indented child and the row is foldable
- **THEN** the Bullet becomes focused on that first press, before the follow-up click, and the native fold state does not toggle

##### Example: Parent and child

- **GIVEN** the document is `- Parent\n  - Child`
- **WHEN** the user sends the primary `mousedown` to `Parent`'s exact marker
- **THEN** the focus anchor is `Parent` immediately and `Child` remains structurally available

#### Scenario: Ignore the follow-up click

- **WHEN** the browser emits a click after a marker pointer/mouse press already performed Zoom
- **THEN** the click is prevented and no second focus transition is dispatched

##### Example: One physical gesture

- **GIVEN** a marker `mousedown` has already focused anchor `0`
- **WHEN** the browser emits its matching `click`
- **THEN** the focus transition count remains one

#### Scenario: Preserve a separate collapse indicator

- **WHEN** a user activates a native collapse indicator outside the exact Bullet marker
- **THEN** the native collapse listener still receives the event and Bullet Zoom does not change focus

##### Example: Native disclosure

- **GIVEN** a `.collapse-indicator` is a sibling of the plugin marker
- **WHEN** the user clicks that indicator
- **THEN** the native listener receives an unprevented event and the focus anchor is unchanged

#### Scenario: Keep stale marker actions safe

- **WHEN** the document changes or a marker is detached between the initial gesture and a follow-up event
- **THEN** the consumed gesture is cleared and no stale anchor is dispatched

##### Example: Detached marker

- **GIVEN** a marker is removed after its editor document changes
- **WHEN** a retained event reaches that old element
- **THEN** Bullet Zoom performs no navigation

---
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
