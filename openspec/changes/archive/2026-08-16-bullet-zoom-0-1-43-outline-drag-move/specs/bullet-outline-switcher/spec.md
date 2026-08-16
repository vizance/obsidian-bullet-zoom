## ADDED Requirements

### Requirement: Move a branch by dragging its outline row

The outline SHALL let the user drag a row with mouse or touch and drop it before or after another row, moving the corresponding bullet line and its entire indented subtree in the Markdown document to the drop position as a sibling of the drop target at the target's indent level. The subtree's internal relative indentation SHALL be preserved, dropping onto the dragged bullet itself or any of its descendants SHALL be rejected without document changes, a completed drag SHALL suppress the follow-up click so no Zoom triggers, and the document SHALL contain exactly the same lines before and after the move apart from indentation prefixes.

#### Scenario: Drop after a target sibling

- **WHEN** the user drags the outline row of a bullet with children and drops it on the lower half of another row
- **THEN** the bullet and its subtree are removed from their original position and inserted after the target's entire branch at the target's indent

##### Example: Reorder top-level branches

- **GIVEN** the document `- A\n  - A1\n- B\n- C`
- **WHEN** row `A` is dropped after row `C`
- **THEN** the document becomes `- B\n- C\n- A\n  - A1`

#### Scenario: Drop before a deeper target

- **WHEN** the user drops a top-level bullet on the upper half of a nested row
- **THEN** the moved branch adopts the nested row's indent and its children shift by the same delta

##### Example: Reindent into a nested position

- **GIVEN** the document `- A\n  - A1\n- B\n  - B1`
- **WHEN** row `A` is dropped before row `B1`
- **THEN** the document becomes `- B\n  - A\n    - A1\n  - B1`

#### Scenario: Reject dropping into the dragged subtree

- **WHEN** the user drops a row onto itself or one of its descendants
- **THEN** the document is unchanged and no move action dispatches

##### Example: Descendant target rejected

- **GIVEN** the document `- A\n  - A1\n- B`
- **WHEN** row `A` is dropped onto row `A1`
- **THEN** the planner returns no changes and the document stays `- A\n  - A1\n- B`
