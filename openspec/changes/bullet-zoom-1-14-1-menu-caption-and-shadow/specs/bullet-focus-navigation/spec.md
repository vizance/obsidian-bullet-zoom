## MODIFIED Requirements

### Requirement: Animate the bullet menu

The menu SHALL play a short entrance: items fade in and scale up from the centre with a small per-item delay so they appear to spread out, and the centre control fades in with them. The highlighted item SHALL change size through a transition rather than instantly, and item buttons SHALL carry a raised shadow that deepens while highlighted so they read as floating above the note. The caption SHALL show the highlighted item's name and SHALL be empty and hidden when nothing is highlighted, rather than showing a cancel hint. All motion SHALL be disabled when the user's system asks for reduced motion.

#### Scenario: Items animate in sequence

- **WHEN** the menu opens
- **THEN** each item carries an increasing animation delay so they arrive one after another

##### Example: Stagger values

- **GIVEN** three items
- **WHEN** the menu renders
- **THEN** the items' delays increase with their index

#### Scenario: The caption only names a highlighted item

- **WHEN** no item is highlighted
- **THEN** the caption holds no text

##### Example: Pointer in the centre

- **GIVEN** an open menu with the pointer inside the dead zone
- **THEN** the caption's text is empty

##### Example: Pointer over an item

- **GIVEN** an open menu with the pointer over the copy item
- **THEN** the caption reads that item's name

#### Scenario: Reduced motion is respected

- **WHEN** the stylesheet is inspected
- **THEN** a reduced-motion block disables the menu animation and transitions
