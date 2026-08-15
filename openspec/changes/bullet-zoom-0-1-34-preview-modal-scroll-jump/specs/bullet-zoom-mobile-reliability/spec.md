## ADDED Requirements

### Requirement: Keep the outline scroll position stable across the label preview modal

When the Bullet full-text preview modal opens from an outline row's ellipsis button and later closes, the outline SHALL restore the outline body's scrollTop to its pre-open value after the post-close rerender, and the modal open/close cycle SHALL NOT change the revealCurrent render context. The plugin SHALL NOT return focus to the triggering ellipsis button after close (the ellipsis button and its modal exist only in mobile rendering; desktop outlines render no ellipsis button). Automatic scrollIntoView positioning SHALL run only when the note identity or the focused Zoom anchor actually changes.

#### Scenario: Close the preview modal on a phone

- **WHEN** a phone user opens the Bullet full-text preview modal from an outline row and closes it
- **THEN** the outline body scrollTop equals its pre-open value after the rerender, no scrollIntoView runs, and the ellipsis button does not receive focus

##### Example: Scrolled outline stays put

- **GIVEN** a phone outline whose body is scrolled to 120 CSS pixels before the ellipsis button opens the modal
- **WHEN** the modal closes and the outline rerenders
- **THEN** the outline body scrollTop is 120 and no element received a scrollIntoView call during the close cycle

#### Scenario: Desktop renders no ellipsis preview

- **WHEN** the outline renders outside mobile mode
- **THEN** no ellipsis preview button exists and the preview modal cannot open

##### Example: Desktop row audit

- **GIVEN** a desktop outline rendered for a note with long Bullet labels
- **WHEN** the rendered rows are inspected
- **THEN** no element with the outline preview button class is present

#### Scenario: Real context changes still reveal the current node

- **WHEN** the note identity or the focused Zoom anchor changes
- **THEN** the outline may position the current node via scrollIntoView as before

##### Example: Zoom change repositions

- **GIVEN** an outline rendered for note `Ideas.md` with no focus anchor
- **WHEN** the user zooms into a Bullet so the focus anchor changes
- **THEN** the rerender is allowed to scroll the current row into view
