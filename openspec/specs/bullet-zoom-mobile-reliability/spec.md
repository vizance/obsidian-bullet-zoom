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

---
### Requirement: Keep the outline scroll position stable across the label preview modal

When the Bullet full-text preview modal opens from an outline row's ellipsis button and later closes, the outline SHALL restore the outline body's scrollTop to its pre-open value after the post-close rerender, and the modal open/close cycle SHALL NOT change the revealCurrent render context. The plugin SHALL NOT return focus to the triggering ellipsis button after close (the ellipsis button and its modal exist only in mobile rendering; desktop outlines render no ellipsis button). Automatic scrollIntoView positioning SHALL run only when the note identity or the focused Zoom anchor actually changes.

#### Scenario: Close the preview modal on a phone

- **WHEN** a phone user opens the Bullet full-text preview modal from an outline row and closes it
- **THEN** the outline body scrollTop equals its pre-open value after the rerender, no scrollIntoView runs, and the ellipsis button does not receive focus

##### Example: Scrolled outline stays put

- **GIVEN** a phone outline whose body is scrolled to 120 CSS pixels before the ellipsis button opens the modal
- **WHEN** the modal closes and the outline rerenders
- **THEN** the outline body scrollTop is 120 and no element received a scrollIntoView call during the close cycle

#### Scenario: Desktop renders no ellipsis preview

- **WHEN** the outline renders outside mobile mode
- **THEN** no ellipsis preview button exists and the preview modal cannot open

##### Example: Desktop row audit

- **GIVEN** a desktop outline rendered for a note with long Bullet labels
- **WHEN** the rendered rows are inspected
- **THEN** no element with the outline preview button class is present

#### Scenario: Real context changes still reveal the current node

- **WHEN** the note identity or the focused Zoom anchor changes
- **THEN** the outline may position the current node via scrollIntoView as before

##### Example: Zoom change repositions

- **GIVEN** an outline rendered for note `Ideas.md` with no focus anchor
- **WHEN** the user zooms into a Bullet so the focus anchor changes
- **THEN** the rerender is allowed to scroll the current row into view

---
### Requirement: Dismiss the label preview modal instantly

When the Bullet full-text preview modal closes by any path (close button, X button, or backdrop), the plugin SHALL force-hide the modal element and its container element by setting an inline `display: none` declaration with the `important` priority — which overrides any theme or app stylesheet display declaration — before delegating to the native close, so no slide-down animation or visible displacement occurs. Repeated close calls SHALL still delegate to the native close only once.

#### Scenario: Close force-hides the whole modal at once

- **WHEN** the user activates the preview modal's close control
- **THEN** the modal element and the container element carry an inline important `display: none` immediately and the native close runs exactly once

##### Example: Inline priority audit

- **GIVEN** an open Bullet full-text preview modal
- **WHEN** the close button is clicked twice in quick succession
- **THEN** both elements report inline display `none` with priority `important`, and the native close was invoked once

#### Scenario: Stylesheet display rules cannot resurrect the modal

- **WHEN** an app or theme stylesheet declares a display value for the modal container
- **THEN** the inline important declaration still wins and the container stays hidden during dismissal

##### Example: Flex container stays hidden

- **GIVEN** a stylesheet rule that sets the modal container to `display: flex`
- **WHEN** the plugin close override runs
- **THEN** the computed display of the container is `none`
