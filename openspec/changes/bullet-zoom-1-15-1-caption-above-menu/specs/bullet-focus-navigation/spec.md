## MODIFIED Requirements

### Requirement: Animate the bullet menu

The menu SHALL play a short entrance: items fade in and scale up from the centre with a small per-item delay so they appear to spread out, and the centre control fades in with them. The highlighted item SHALL change size through a transition rather than instantly, and item buttons SHALL carry a raised shadow that deepens while highlighted so they read as floating above the note. The caption SHALL show the highlighted item's name and SHALL be empty and hidden when nothing is highlighted. The caption SHALL sit outside the menu's bounding box — above its top edge with a gap, or below its bottom edge when the top would leave the visible band — and SHALL be centred horizontally on that box while staying inside the visible band, so a thumb resting on the centre never covers it. All motion SHALL be disabled when the user's system asks for reduced motion.

#### Scenario: Items animate in sequence

- **WHEN** the menu opens
- **THEN** each item carries an increasing animation delay so they arrive one after another

##### Example: Stagger values

- **GIVEN** three items
- **WHEN** the menu renders
- **THEN** the items' delays increase with their index

#### Scenario: The caption clears the menu

- **WHEN** the menu has room above it
- **THEN** the caption sits above every item and above the centre control

##### Example: Caption above the fan

- **GIVEN** a menu opened at x 40 y 400 in a band 800 tall with four items
- **WHEN** the caption is positioned
- **THEN** its y is smaller than every item's y and smaller than the centre's y

#### Scenario: The caption flips below a menu near the top

- **WHEN** placing the caption above would leave the visible band
- **THEN** it is placed below the menu instead and stays inside the band

##### Example: Menu near the top

- **GIVEN** a menu opened at x 40 y 60 in a band 800 tall with four items
- **WHEN** the caption is positioned
- **THEN** its y is greater than every item's y and inside the band

#### Scenario: The caption only names a highlighted item

- **WHEN** no item is highlighted
- **THEN** the caption holds no text

##### Example: Pointer in the centre

- **GIVEN** an open menu with the pointer inside the dead zone
- **THEN** the caption's text is empty

#### Scenario: Reduced motion is respected

- **WHEN** the stylesheet is inspected
- **THEN** a reduced-motion block disables the menu animation and transitions
