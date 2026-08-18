## ADDED Requirements

### Requirement: Keep the bullet menu inside the visible viewport

Opening the bullet menu SHALL NOT focus the editor, so the software keyboard never appears because of a long press. The menu SHALL lay itself out inside the visible viewport, described by a top offset and a height that the caller takes from the visual viewport when available and from the window height otherwise, and SHALL clamp every item, the centre control, and the caption into that band with a small padding. When the caption cannot fit below the centre it SHALL be placed above it.

#### Scenario: A long press does not raise the keyboard

- **WHEN** the menu opens for a bullet
- **THEN** the editor selection moves to that bullet and the editor is not focused

#### Scenario: Items stay above the keyboard

- **WHEN** the visible viewport is shorter than the window because the keyboard is up
- **THEN** every item sits inside the visible band

##### Example: Keyboard covering the lower half

- **GIVEN** a window 800 tall, a visible band from 0 to 400, a press at x 30 y 380, four items, and a radius of 96
- **WHEN** the layout is computed
- **THEN** every item's y is at least 0 and at most 400

##### Example: Visible band offset from the top

- **GIVEN** a visible band starting at 100 with a height of 300 and a press at x 30 y 380
- **WHEN** the layout is computed
- **THEN** every item's y is at least 100 and at most 400

#### Scenario: The caption flips above a low centre

- **WHEN** the centre sits close to the bottom of the visible band
- **THEN** the caption is placed above the centre instead of below it

### Requirement: Animate the bullet menu

The menu SHALL play a short entrance: items fade in and scale up from the centre with a small per-item delay so they appear to spread out, and the centre control fades in with them. The highlighted item SHALL change size through a transition rather than instantly. All motion SHALL be disabled when the user's system asks for reduced motion.

#### Scenario: Items animate in sequence

- **WHEN** the menu opens
- **THEN** each item carries an increasing animation delay so they arrive one after another

##### Example: Stagger values

- **GIVEN** three items
- **WHEN** the menu renders
- **THEN** the items' delays increase with their index

#### Scenario: Reduced motion is respected

- **WHEN** the stylesheet is inspected
- **THEN** a reduced-motion block disables the menu animation and transitions
