## ADDED Requirements

### Requirement: Configure marker detection for bullets and numbered items

The plugin SHALL support Zoom on ordered-list items whose markers are a number followed by `.` or `)`, in addition to plain `-` bullets, gated by a marker-detection configuration with two booleans: bullets and numbered. The library-level default SHALL be bullets enabled and numbered disabled (identical to prior behavior), while the plugin SHALL inject user settings that default both to enabled, expose two toggles in the settings tab, persist them, and rebuild the editor extensions immediately on change. When numbered detection is disabled, items inside ordered lists SHALL remain excluded as before; when enabled, an ordered item resolves through its nearest ordered-list ancestor and participates in Zoom, breadcrumbs, and the outline.

#### Scenario: Zoom a numbered item

- **WHEN** numbered detection is enabled and the user activates the marker of `2. Second`
- **THEN** the item becomes the focus anchor like a plain bullet would

##### Example: Ordered marker resolution

- **GIVEN** the document `1. First\n2. Second` with numbered detection enabled
- **WHEN** the supported-bullet resolver runs at the second line
- **THEN** it returns a marker spanning `2.` and the label `Second`

#### Scenario: Toggles gate each marker kind

- **WHEN** the bullets toggle is off and the numbered toggle is on
- **THEN** `- A` resolves to no supported item while `1. B` resolves normally

##### Example: Bullets disabled

- **GIVEN** the document `- A\n1. B` with bullets disabled and numbered enabled
- **WHEN** the resolver runs on both lines
- **THEN** line one yields null and line two yields a supported item

#### Scenario: Disabled numbered detection preserves the ordered exclusion

- **WHEN** numbered detection is disabled
- **THEN** ordered items and bullets nested under ordered lists resolve to null exactly as in prior releases

##### Example: Legacy exclusion

- **GIVEN** the document `1. First\n   - Nested` with numbered detection disabled
- **WHEN** the resolver runs on both lines
- **THEN** both lines yield null

#### Scenario: Settings persist and apply immediately

- **WHEN** the user flips either toggle in the settings tab
- **THEN** the persisted data updates and the editor extensions rebuild so detection changes without reloading the plugin

##### Example: Persisted toggle values

- **GIVEN** default settings
- **WHEN** the numbered toggle is turned off
- **THEN** the persisted data records `zoomNumbered: false` and `zoomBullets: true`
