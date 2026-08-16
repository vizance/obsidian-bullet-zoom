## ADDED Requirements

### Requirement: Draw indent guides on the focus page

The plugin SHALL support a focusIndentGuides setting, default enabled and exposed as a toggle in the settings tab, that adds a body-level class enabling vertical indent guides on focus-page bullet lines. Guides SHALL be drawn as a repeating background gradient whose period equals the indent unit and whose painted width equals the line's relative depth multiplied by that unit, so a line at depth N shows N ancestor guides aligned with the ancestor bullet markers, using the theme border color at one pixel wide without changing layout metrics or hit areas. Every guide rule SHALL be scoped under the body class, and disabling the setting or the plugin SHALL remove the guides entirely.

#### Scenario: Guides appear for nested lines

- **WHEN** the setting is enabled and the focus page renders a nested branch
- **THEN** each rebased line paints one vertical guide per ancestor level

##### Example: Depth two line

- **GIVEN** the guides class is present and a line carries relative depth `2`
- **WHEN** its computed background is inspected
- **THEN** the background image is a repeating gradient whose painted width resolves from the depth and indent unit

#### Scenario: Disabling removes the guides

- **WHEN** the setting is turned off
- **THEN** the body no longer carries the guides class and no guide rule applies

##### Example: Class removal

- **GIVEN** the guides setting is enabled and the class is on the document body
- **WHEN** the setting is turned off
- **THEN** the document body no longer has the guides class

#### Scenario: Guide styles stay scoped

- **WHEN** the plugin stylesheet is inspected
- **THEN** every rule painting a guide background includes the guides body class in its selector

##### Example: Selector audit

- **GIVEN** the plugin stylesheet is loaded
- **WHEN** rules whose background image is a repeating gradient are collected
- **THEN** each of their selectors contains `bullet-zoom-indent-guides`
