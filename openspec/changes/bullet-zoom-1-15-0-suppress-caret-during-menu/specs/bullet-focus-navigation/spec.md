## ADDED Requirements

### Requirement: Suppress the caret while the bullet menu is open

While the bullet menu is open the plugin SHALL stop the editor from taking part in the gesture: it SHALL mark the editor with a state class whose styles make the caret transparent and disable text selection and pointer events on the editor content, and it SHALL blur the editor so the system stops treating the ongoing touch as a caret drag. The plugin SHALL remember whether the editor was focused beforehand and, on every path that closes the menu — choosing an item, the centre control, a tap outside, or Escape — SHALL remove the state class and restore focus when it had been focused, leaving the caret and keyboard as they were before the press.

#### Scenario: The caret disappears while the menu is open

- **WHEN** the menu opens from a long press
- **THEN** the editor carries the state class and no longer has focus

##### Example: State class applied

- **GIVEN** a focused editor
- **WHEN** the menu opens
- **THEN** the editor element carries the menu state class

#### Scenario: Closing restores the editor

- **WHEN** the menu closes by any path
- **THEN** the state class is removed and focus returns if the editor had it

##### Example: Cancel restores focus

- **GIVEN** the menu was opened from a focused editor
- **WHEN** the menu is cancelled
- **THEN** the state class is gone and the editor is focused again

##### Example: Running a command restores focus

- **GIVEN** the menu was opened from a focused editor
- **WHEN** an item is chosen
- **THEN** the state class is gone and the editor is focused again

#### Scenario: An unfocused editor stays unfocused

- **WHEN** the menu closes after opening from an editor that had no focus
- **THEN** the editor is not focused, so the keyboard stays down

#### Scenario: The style blocks caret and selection

- **WHEN** the plugin stylesheet is inspected
- **THEN** the menu state rules make the caret transparent and disable selection and pointer events on the editor content
