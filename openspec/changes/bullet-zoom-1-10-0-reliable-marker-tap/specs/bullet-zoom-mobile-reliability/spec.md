## MODIFIED Requirements

### Requirement: Complete marker gesture zooms before native fold handling

The plugin SHALL decide what a pointer press on a list line means from measured coordinates rather than from the presence of any decoration element, so the result never depends on whether the editor is focused or how Live Preview renders the line. It SHALL resolve the pressed position through the view's coordinate lookup, find the supported bullet on that line, measure the marker's start and the content start, and classify the press as the fold zone before the marker, the marker zone spanning the marker with a small tolerance but never past the content start, or the content zone after it. When the press falls in the marker zone the plugin SHALL perform the existing fold-aware Zoom transition on `pointerdown` in the capture phase — ahead of any handler attached to the fold control — consume that gesture, and suppress the following click so one physical gesture invokes at most one transition. Presses in the fold or content zones SHALL not be intercepted at all.

#### Scenario: Zoom a marker regardless of focus

- **WHEN** the user presses the marker of a supported Bullet while the editor is not focused
- **THEN** the Bullet becomes focused on that press and the native fold state does not toggle

##### Example: Unfocused press

- **GIVEN** the document is `- Parent\n  - Child` and the editor has never been focused
- **WHEN** the primary pointer is pressed on `Parent`'s marker
- **THEN** the focus anchor is `Parent` and `Child` remains structurally available

#### Scenario: Classify a press across the line

- **WHEN** a press is compared against the measured marker and content boundaries
- **THEN** it resolves to the fold, marker, or content zone

##### Example: Zone table

- **GIVEN** a marker measured from x 40 to x 52, a content start at x 60, and a tolerance of 6
- **WHEN** presses land at x 20, x 46, x 56, and x 90
- **THEN** the zones are `fold`, `marker`, `marker`, and `content`

#### Scenario: Ignore the follow-up click

- **WHEN** the browser emits a click after a marker press already performed Zoom
- **THEN** the click is prevented and no second focus transition is dispatched

##### Example: One physical gesture

- **GIVEN** a marker press has already focused anchor `0`
- **WHEN** the browser emits its matching `click`
- **THEN** the focus transition count remains one

#### Scenario: Fold and text presses are left alone

- **WHEN** a press lands in the fold zone or the content zone
- **THEN** the plugin does not prevent the default, does not stop propagation, and dispatches no transition

##### Example: Fold zone press

- **GIVEN** a foldable list line
- **WHEN** the pointer is pressed left of the marker
- **THEN** the plugin dispatches nothing and the native fold handler runs
