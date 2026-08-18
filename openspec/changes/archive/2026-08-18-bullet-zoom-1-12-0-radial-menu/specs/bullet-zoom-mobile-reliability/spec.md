## MODIFIED Requirements

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
