## ADDED Requirements

### Requirement: Run bullet commands from a radial menu

The plugin SHALL register bullet commands for copying, deleting, and prefixing the bullet at the cursor, and SHALL offer a radial menu that runs any Obsidian command against a chosen bullet. Copy SHALL place the bullet's text or its whole branch on the clipboard according to the copy scope setting; delete SHALL remove the bullet's branch together with its line break; prefix SHALL insert the configured text after the marker, or remove it when already present. Each command SHALL do nothing and report why when the cursor is not on a supported bullet.

The menu SHALL be available on mobile only, gated by an enable setting defaulting to on, with a configurable press duration between 250 and 1000 milliseconds defaulting to 450, and eight slots each holding an optional Obsidian command id, defaulting to copy, delete, prefix, zoom, and extract in the first five slots. Opening the menu SHALL place the editor cursor on the target bullet first, so any command that acts on the cursor works. Choosing a slot SHALL run its command; releasing over the centre, tapping outside, or pressing Escape SHALL close the menu without running anything. Empty slots SHALL not render.

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
- **THEN** only slots holding a command id produce a segment, in slot order

##### Example: Sparse configuration

- **GIVEN** slots holding `copy`, an empty value, and `delete`
- **WHEN** the segments are computed
- **THEN** two segments render, for `copy` and `delete`

#### Scenario: Selecting a slot runs its command on the target bullet

- **WHEN** a segment is chosen
- **THEN** the cursor is already on the target bullet and that command id is executed once

##### Example: Running a slot

- **GIVEN** the menu opened for the bullet at position 12 with slot one bound to `bullet-zoom:copy-bullet`
- **WHEN** that segment is chosen
- **THEN** the cursor is at 12 and `bullet-zoom:copy-bullet` is executed once

#### Scenario: Cancelling runs nothing

- **WHEN** the centre is chosen, a tap lands outside the menu, or Escape is pressed
- **THEN** the menu closes and no command runs
