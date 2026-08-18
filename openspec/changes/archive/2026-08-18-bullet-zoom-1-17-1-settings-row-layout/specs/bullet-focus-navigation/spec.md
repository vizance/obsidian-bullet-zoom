## MODIFIED Requirements

### Requirement: Keep plugin settings within the panel width

Every settings row the plugin creates SHALL carry a plugin-owned class, and the stylesheet SHALL constrain those rows so their controls can shrink and never exceed the panel width: control containers SHALL allow shrinking without wrapping their controls onto separate lines, select and text inputs SHALL be limited to the available width while filling the remaining space, and the name column SHALL keep a minimum width so its text never breaks into single characters. On narrow viewports the row SHALL stack, placing the name and description on one line and the controls on the next. The plugin settings container SHALL also hide horizontal overflow, so the settings tab never scrolls sideways.

#### Scenario: Long command names do not widen the panel

- **WHEN** a slot dropdown lists commands with long names
- **THEN** the dropdown is limited to the available width instead of widening the row

##### Example: Stylesheet audit

- **GIVEN** the plugin stylesheet is loaded
- **WHEN** the plugin settings rules are inspected
- **THEN** they limit select elements to a maximum width and allow the control container to shrink

#### Scenario: The name column stays readable

- **WHEN** a row's name is rendered next to its controls
- **THEN** the name column keeps a minimum width so it is not squeezed to a couple of characters

##### Example: Minimum width present

- **GIVEN** the plugin stylesheet is loaded
- **WHEN** the settings info rule is inspected
- **THEN** it declares a minimum width

#### Scenario: Controls stay on one line

- **WHEN** a row holds a dropdown and a toggle
- **THEN** the control container does not wrap them onto separate lines

##### Example: No wrapping

- **GIVEN** the plugin stylesheet is loaded
- **WHEN** the control rule is inspected
- **THEN** its flex-wrap is nowrap

#### Scenario: Narrow viewports stack the row

- **WHEN** the viewport is narrow
- **THEN** a media query stacks the name above the controls

##### Example: Stacking query

- **GIVEN** the plugin stylesheet is loaded
- **WHEN** its media queries are inspected
- **THEN** one of them sets the plugin settings row to a column layout

#### Scenario: The settings tab cannot scroll sideways

- **WHEN** the settings container rule is inspected
- **THEN** it hides horizontal overflow and limits its own width
