## ADDED Requirements

### Requirement: Act on bullets with horizontal swipes

The plugin SHALL recognise horizontal swipes on bullet lines from non-mouse pointers and run a configurable action for each direction. A swipe SHALL count only when the horizontal distance exceeds 60 CSS pixels and is more than twice the vertical distance; vertical movement beyond 24 CSS pixels SHALL cancel the gesture so scrolling still works, and gestures starting within 24 CSS pixels of the viewport's left or right edge SHALL be ignored so Obsidian's own edge gestures keep working. A recognised swipe SHALL suppress the click that follows so the caret does not move. Each direction SHALL be configurable as `none`, `prefix`, or `copy`, defaulting to prefix on swipe right and copy on swipe left, and no gesture handling SHALL be installed when both directions are `none`.

#### Scenario: Classify a horizontal swipe

- **WHEN** a gesture's horizontal and vertical distances are compared against the thresholds
- **THEN** only a dominant horizontal movement past the distance threshold yields a direction

##### Example: Classification table

- **GIVEN** the thresholds above
- **WHEN** the deltas are `(80, 10)`, `(-80, 10)`, `(30, 5)`, and `(80, 50)`
- **THEN** the results are `right`, `left`, `null`, and `null`

#### Scenario: Insert the configured prefix

- **WHEN** the prefix action runs on a bullet that does not already start with the configured text
- **THEN** the text is inserted immediately after the bullet marker

##### Example: Adding a callout prefix

- **GIVEN** the document `- idea` and the prefix `> [!note] `
- **WHEN** the prefix plan is applied at that bullet
- **THEN** the document becomes `- > [!note] idea`

#### Scenario: Toggle the prefix off

- **WHEN** the prefix action runs on a bullet whose text already begins with the configured prefix
- **THEN** the prefix is removed instead of duplicated

##### Example: Removing a callout prefix

- **GIVEN** the document `- > [!note] idea` and the prefix `> [!note] `
- **WHEN** the prefix plan is applied at that bullet
- **THEN** the document becomes `- idea`

#### Scenario: Copy the bullet

- **WHEN** the copy action runs
- **THEN** the plugin copies the bullet's text, or the bullet and its children when the copy scope includes children, and reports the result

##### Example: Copy scopes

- **GIVEN** the document `- parent\n  - child` focused at `parent`
- **WHEN** the copy text is collected with scope `text` and then with scope `branch`
- **THEN** the results are `parent` and `- parent\n  - child`
