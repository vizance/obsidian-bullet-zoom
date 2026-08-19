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

The plugin SHALL decide what a pointer press on a list line means from measured coordinates rather than from the presence of any decoration element, so the result never depends on whether the editor is focused or how Live Preview renders the line. It SHALL resolve the pressed position through the view's coordinate lookup, find the supported bullet on that line, measure the marker's start and the content start, and classify the press as the fold zone before the marker, the marker zone spanning the marker with a small tolerance but never past the content start, or the content zone after it. Presses in the content zone SHALL never be intercepted; presses in the fold zone are handled by the gutter fold requirement.

For a press in the marker zone the plugin SHALL consume the gesture in the capture phase ahead of any handler attached to the fold control, and SHALL decide between zoom and menu by how long the press lasts: on non-mouse pointers with the radial menu enabled it SHALL start a press timer, open the radial menu when the timer elapses while the pointer is still down and has moved less than the cancel threshold, and perform the fold-aware Zoom transition instead when the pointer is released before the timer elapses. Pointer movement beyond the cancel threshold or a pointer cancel SHALL abandon both outcomes. Mouse pointers, and any pointer when the menu is disabled, SHALL zoom immediately on press as before. One physical gesture SHALL invoke at most one outcome, and the follow-up click SHALL be suppressed.

#### Scenario: A short press zooms

- **WHEN** a touch press on the marker is released before the press timer elapses
- **THEN** the Bullet is focused and no menu opens

##### Example: Quick tap

- **GIVEN** a press timer of 450 milliseconds
- **WHEN** the marker is pressed and released after 120 milliseconds
- **THEN** the focus anchor is that Bullet

#### Scenario: A long press opens the menu

- **WHEN** the press timer elapses while the pointer is still down and steady
- **THEN** the radial menu opens for that Bullet and no zoom happens

##### Example: Held press

- **GIVEN** a press timer of 450 milliseconds
- **WHEN** the marker is pressed and held for 500 milliseconds
- **THEN** the menu is open and the focus session is unchanged

#### Scenario: Movement abandons the gesture

- **WHEN** the pointer moves beyond the cancel threshold before release
- **THEN** neither zoom nor menu happens

##### Example: Scroll from the marker

- **GIVEN** a cancel threshold of 12 pixels
- **WHEN** the pointer moves 40 pixels vertically and is released
- **THEN** no focus transition is dispatched and no menu opens

#### Scenario: Mouse presses keep zooming immediately

- **WHEN** a mouse press lands in the marker zone
- **THEN** the Zoom transition happens on press with no timer

#### Scenario: Zoom a marker regardless of focus

- **WHEN** the user presses the marker of a supported Bullet while the editor is not focused
- **THEN** the gesture resolves to that Bullet and the native fold state does not toggle

##### Example: Unfocused press

- **GIVEN** the document is `- Parent\n  - Child` and the editor has never been focused
- **WHEN** a mouse press lands on `Parent`'s marker
- **THEN** the focus anchor is `Parent` and `Child` remains structurally available

#### Scenario: Classify a press across the line

- **WHEN** a press is compared against the measured marker and content boundaries
- **THEN** it resolves to the fold, marker, or content zone

##### Example: Zone table

- **GIVEN** a marker measured from x 40 to x 52, a content start at x 60, and a tolerance of 6
- **WHEN** presses land at x 20, x 46, x 56, and x 90
- **THEN** the zones are `fold`, `marker`, `marker`, and `content`

#### Scenario: Ignore the follow-up click

- **WHEN** the browser emits a click after a marker gesture already resolved
- **THEN** the click is prevented and no second transition is dispatched

##### Example: One physical gesture

- **GIVEN** a marker press has already focused anchor `0`
- **WHEN** the browser emits its matching `click`
- **THEN** the focus transition count remains one

#### Scenario: Text presses are left alone

- **WHEN** a press lands in the content zone
- **THEN** the plugin does not prevent the default, does not stop propagation, and dispatches no transition

##### Example: Content zone press

- **GIVEN** a list line
- **WHEN** the pointer is pressed on its text
- **THEN** the plugin dispatches nothing and the caret is placed natively

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

When the Bullet full-text preview modal closes by any path (close button, X button, or backdrop), the plugin SHALL force-hide the modal element and its container element by adding a plugin-owned class whose stylesheet rule declares `display: none` with the `important` priority — which overrides any theme or app stylesheet display declaration — before delegating to the native close, so no slide-down animation or visible displacement occurs. The plugin SHALL NOT set inline styles for this. Repeated close calls SHALL still delegate to the native close only once.

#### Scenario: Close the preview modal by any path

- **WHEN** the preview modal is dismissed
- **THEN** the modal element and the container element carry the force-hidden class immediately and the native close runs exactly once

##### Example: Repeated close calls

- **GIVEN** the preview modal is open
- **WHEN** the close control is activated twice
- **THEN** both elements carry the force-hidden class, and the native close was invoked once

##### Example: A theme that shows modals

- **GIVEN** a theme whose stylesheet sets a display value on modal containers
- **WHEN** the preview modal is dismissed
- **THEN** the important declaration in the plugin's class still wins and the container stays hidden during dismissal

---
### Requirement: Fold from the whole gutter left of the marker

When a press lands in the fold zone — anywhere from the start of the line up to the bullet marker, whatever the indentation depth — and the line is foldable, the plugin SHALL toggle that line's fold itself using the editor's fold effects, consume the gesture, and suppress the following click. When the line is not foldable the plugin SHALL not intercept the press at all. The plugin SHALL apply no styling to the native fold control, so its size and alignment stay exactly as Obsidian renders them.

#### Scenario: Fold from the indentation area

- **WHEN** the user presses the blank area left of a nested bullet whose line is foldable
- **THEN** that line folds and no caret is placed

##### Example: Deep indent press

- **GIVEN** the document `- A\n  - B\n    - C` and a press at the far left of the `B` line
- **WHEN** the press is handled
- **THEN** the `B` line is folded

#### Scenario: A second press unfolds

- **WHEN** the fold zone of an already folded line is pressed
- **THEN** the line unfolds

##### Example: Toggle back

- **GIVEN** the `B` line is folded
- **WHEN** its fold zone is pressed again
- **THEN** the fold is removed

#### Scenario: Leaf lines are left alone

- **WHEN** the fold zone of a line with no foldable range is pressed
- **THEN** the plugin does not prevent the default, does not stop propagation, and dispatches nothing

##### Example: Leaf press

- **GIVEN** the document `- A` with no children
- **WHEN** the area left of its marker is pressed
- **THEN** the plugin dispatches nothing

#### Scenario: The native fold control keeps its own styling

- **WHEN** the plugin stylesheet is inspected
- **THEN** no rule targets the native fold control

##### Example: Stylesheet audit

- **GIVEN** the plugin stylesheet is loaded
- **WHEN** its rules are collected
- **THEN** none of their selectors mention the collapse indicator

---
### Requirement: Choose what a marker tap does

The plugin SHALL provide a marker tap setting with the values `menu` and `zoom`, defaulting to `menu`, that decides what a non-mouse press on the bullet marker does while the menu is enabled. With `menu` the plugin SHALL open the menu when the pointer is released and has moved less than the cancel threshold, without waiting for a press timer, so a plain tap is enough. With `zoom` the plugin SHALL keep the existing split: a release before the press timer zooms, and holding past it opens the menu. Movement beyond the cancel threshold SHALL abandon the gesture in both modes, mouse presses SHALL keep zooming immediately, and the menu SHALL be anchored on the marker's measured position rather than on where the finger lifted, so it opens in the same place every time.

#### Scenario: A tap opens the menu by default

- **WHEN** the marker is tapped and released without moving
- **THEN** the menu opens and no zoom happens

##### Example: Quick tap in menu mode

- **GIVEN** the marker tap setting is `menu`
- **WHEN** the marker is pressed and released after 80 milliseconds
- **THEN** the menu request fires once and the focus session is unchanged

#### Scenario: Zoom mode keeps the press timer

- **WHEN** the setting is `zoom` and the press is released quickly
- **THEN** the bullet is zoomed, and holding past the timer opens the menu instead

##### Example: Quick tap in zoom mode

- **GIVEN** the marker tap setting is `zoom`
- **WHEN** the marker is pressed and released after 80 milliseconds
- **THEN** the focus anchor is that bullet and no menu request fires

#### Scenario: Movement still cancels

- **WHEN** the pointer moves beyond the cancel threshold before release
- **THEN** neither the menu nor a zoom happens in either mode

#### Scenario: The menu is anchored on the marker

- **WHEN** the menu opens from a marker gesture
- **THEN** it is positioned from the marker's measured coordinates, not from the release point
