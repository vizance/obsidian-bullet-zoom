## ADDED Requirements

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
