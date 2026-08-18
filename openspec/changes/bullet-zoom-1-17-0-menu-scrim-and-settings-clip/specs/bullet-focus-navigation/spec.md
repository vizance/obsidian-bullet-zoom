## ADDED Requirements

### Requirement: Separate the bullet menu from the note behind it

The menu overlay SHALL dim the content behind it using Obsidian's modal cover colour together with a slight backdrop blur, so the note recedes and the menu reads as the only active layer, and the dimming SHALL disappear with the menu. The overlay SHALL fade in, and that fade SHALL be disabled under reduced motion. The menu SHALL draw a marker ring at its origin so the bullet being acted on stays identifiable once the background is dimmed.

#### Scenario: The background dims while the menu is open

- **WHEN** the menu opens
- **THEN** the overlay paints the modal cover colour and blurs what is behind it

##### Example: Overlay style audit

- **GIVEN** the plugin stylesheet is loaded
- **WHEN** the overlay rule is inspected
- **THEN** its background uses the modal cover variable and it applies a backdrop blur

#### Scenario: The dimming leaves with the menu

- **WHEN** the menu closes by any path
- **THEN** the overlay is removed from the document, taking the dimming with it

#### Scenario: The target bullet stays identifiable

- **WHEN** the menu opens
- **THEN** a marker ring is drawn at the menu origin

##### Example: Ring position

- **GIVEN** a menu opened at x 40 y 200
- **WHEN** the overlay is inspected
- **THEN** it contains a ring element positioned at that origin

#### Scenario: Reduced motion skips the fade

- **WHEN** the stylesheet is inspected
- **THEN** the reduced-motion block also disables the overlay fade

### Requirement: Clip the plugin settings to the panel

The plugin settings tab SHALL mark its own container with a plugin-owned class whose styles prevent horizontal overflow, so no control can widen the panel or make the tab scroll sideways, in addition to the per-row width limits.

#### Scenario: The settings tab cannot scroll sideways

- **WHEN** the settings container rule is inspected
- **THEN** it hides horizontal overflow and limits its own width
