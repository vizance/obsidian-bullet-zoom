## MODIFIED Requirements

### Requirement: Run bullet commands from a radial menu

The plugin SHALL register bullet commands for copying, deleting, and prefixing the bullet at the cursor, and SHALL offer a press-and-hold menu that runs any Obsidian command against a chosen bullet. Copy SHALL place the bullet's text or its whole branch on the clipboard according to the copy scope setting; delete SHALL remove the bullet's branch together with its line break; prefix SHALL insert the configured text after the marker, or remove it when already present. Each command SHALL do nothing and report why when the cursor is not on a supported bullet.

The menu SHALL be available on mobile only, gated by an enable setting defaulting to on, with a configurable press duration between 250 and 1000 milliseconds defaulting to 450, and eight slots each holding an optional Obsidian command id together with an enabled flag, defaulting to copy, delete, prefix, zoom, and extract enabled in the first five slots. Persisted slots stored as plain command ids SHALL be read as enabled slots so earlier configurations keep working. Opening the menu SHALL place the editor cursor on the target bullet first, so any command that acts on the cursor works. Slots that are disabled or hold no command id SHALL not render, and disabling a slot SHALL keep its command id so re-enabling restores it.

The menu SHALL lay its items out as a fan that opens toward the side of the viewport with more room — to the right when the press is in the left half, to the left otherwise — spanning a vertical range clamped so every item stays inside the viewport. Items SHALL be drawn as icons supplied by the caller rather than as command names, and the menu SHALL display the name of the currently highlighted item near its centre so an icon is never ambiguous. Pointer position SHALL be matched to the nearest item centre within a hit radius rather than by angle, so the layout and the hit test never disagree; a pointer inside the centre dead zone SHALL mean cancel. Choosing an item SHALL run its command; releasing over the centre, tapping outside, or pressing Escape SHALL close the menu without running anything.

#### Scenario: Copy, delete, and prefix act on the cursor's bullet

- **WHEN** each bullet command runs with the cursor on a supported bullet
- **THEN** copy fills the clipboard, delete removes the branch, and prefix toggles the configured text

##### Example: Delete removes the branch

- **GIVEN** the document `- A\n- Topic\n  - P1\n- B` with the cursor on `Topic`
- **WHEN** the delete command runs
- **THEN** the document becomes `- A\n- B`

#### Scenario: Commands refuse a non-bullet cursor

- **WHEN** a bullet command runs while the cursor sits on a plain paragraph
- **THEN** the document is unchanged and a notice explains what to do

#### Scenario: Slots map to commands

- **WHEN** the menu renders with its configured slots
- **THEN** only slots holding a command id produce an item, in slot order

##### Example: Sparse configuration

- **GIVEN** slots holding enabled `copy`, an empty value, and enabled `delete`
- **WHEN** the items are computed
- **THEN** two items render, for `copy` and `delete`

#### Scenario: Disabled slots stay configured but hidden

- **WHEN** a slot holding a command is disabled
- **THEN** it renders no item while keeping its command id for later

##### Example: Toggling a slot off

- **GIVEN** slots holding enabled `copy` and disabled `delete`
- **WHEN** the items are computed
- **THEN** only `copy` renders, and the stored `delete` id is unchanged

#### Scenario: The fan opens away from the nearest edge

- **WHEN** the press is in the left half of the viewport
- **THEN** every item is placed to the right of the press and inside the viewport

##### Example: Press near the left edge

- **GIVEN** a viewport 400 wide and 800 tall, a press at x 30 y 400, four items, and a radius of 96
- **WHEN** the layout is computed
- **THEN** the layout side is `right` and every item's x is greater than 30 and less than 400

##### Example: Press near the right edge

- **GIVEN** a viewport 400 wide and 800 tall, a press at x 370 y 400, four items, and a radius of 96
- **WHEN** the layout is computed
- **THEN** the layout side is `left` and every item's x is less than 370 and greater than 0

#### Scenario: Vertical room is respected

- **WHEN** the press sits near the top or bottom edge
- **THEN** every item stays within the viewport vertically

##### Example: Press near the top

- **GIVEN** a viewport 400 wide and 800 tall, a press at x 30 y 40, four items, and a radius of 96
- **WHEN** the layout is computed
- **THEN** every item's y is at least 0 and at most 800

#### Scenario: The pointer selects the nearest item

- **WHEN** the pointer sits closer to one item centre than any other and within the hit radius
- **THEN** that item is highlighted, and releasing there runs its command

##### Example: Nearest wins

- **GIVEN** items centred at (100, 50) and (100, 150) and a hit radius of 60
- **WHEN** the pointer is at (105, 140)
- **THEN** the second item is selected

#### Scenario: Cancelling runs nothing

- **WHEN** the centre is chosen, a tap lands outside the menu, or Escape is pressed
- **THEN** the menu closes and no command runs
