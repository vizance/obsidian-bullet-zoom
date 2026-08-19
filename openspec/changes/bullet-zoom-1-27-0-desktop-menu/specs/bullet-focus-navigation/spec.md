## ADDED Requirements

### Requirement: Offer the bullet menu on desktop as an opt-in

The bullet menu SHALL always be available on phone and tablet, and SHALL be available on desktop only when a setting says so. That setting SHALL default to off, so an existing desktop user keeps the previous behavior where the marker only zooms.

The marker handler SHALL ignore mouse input unless the desktop opt-in is on, and SHALL never ignore touch or pen input. When the opt-in is on, a mouse click on the marker SHALL follow the same marker-tap choice as touch does, so the menu opens on click when the choice is to open the menu, and on a long press when the choice is to zoom. Turning the opt-in off SHALL return the marker to zoom-only for the mouse without affecting phone or tablet.

#### Scenario: Desktop stays as it was by default

- **WHEN** the marker is clicked with a mouse and the desktop opt-in is off
- **THEN** no menu opens

##### Example: Default desktop click

- **GIVEN** a desktop editor with the menu enabled but the desktop opt-in off
- **WHEN** the marker receives a mouse press and release
- **THEN** the menu request is never made

#### Scenario: The opt-in brings the menu to the mouse

- **WHEN** the marker is clicked with a mouse and the desktop opt-in is on
- **THEN** the menu opens for that bullet and no zoom happens

##### Example: Enabled desktop click

- **GIVEN** a desktop editor with the menu enabled and the desktop opt-in on
- **WHEN** the marker receives a mouse press and release
- **THEN** the menu request is made once and no focus session starts

#### Scenario: Touch is never gated by the desktop setting

- **WHEN** the marker receives touch input
- **THEN** the menu behaves exactly as before, whatever the desktop opt-in says

##### Example: Touch with the opt-in off

- **GIVEN** a tablet editor with the menu enabled and the desktop opt-in off
- **WHEN** the marker receives a touch press and release
- **THEN** the menu request is still made once
