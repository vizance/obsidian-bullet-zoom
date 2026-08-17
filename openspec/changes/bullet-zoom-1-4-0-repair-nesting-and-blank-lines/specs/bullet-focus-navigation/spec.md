## MODIFIED Requirements

### Requirement: Keep stray lines visible and repair them automatically

While a focus session is active the plugin SHALL keep the focused area visible without hiding content that arrives at its end, remembering the session's visible end and never shrinking it while the session lasts, mapping that end through every document change, and adding no marker, highlight, or notice. When the autoFixStrayLines setting is enabled, default on and exposed as a toggle, the plugin SHALL — after document changes settle for about 600 milliseconds — repair the lines between the focused bullet and the remembered visible end using only regular-expression and indentation-column classification, never the syntax tree. Lines already indented deeper than the focused bullet and carrying a list marker SHALL be left untouched. Every other non-blank line SHALL be indented one level below the nearest preceding list item, or below the focused bullet when there is none, with all lines of the same repaired run sharing that one indentation so they stay siblings rather than nesting further with each line; lines that already carry a list marker SHALL keep their marker and text while every other line SHALL keep its text verbatim and gain a `- ` marker. Blank lines inside the repaired region SHALL be removed. Repair SHALL stop at a code fence, SHALL be dispatched as its own history step, and SHALL dispatch nothing when no line needs changing.

#### Scenario: Dictated lines nest under the preceding bullet

- **WHEN** plain lines follow an existing child bullet inside the focused area
- **THEN** they become bullets one level below that child bullet and remain siblings of each other

##### Example: Continuing the last bullet

- **GIVEN** the document `- Topic\n  - A\n\nfirst idea\n\nsecond idea` focused on `Topic` with the visible end at the document end
- **WHEN** the repair plan is applied
- **THEN** the document becomes `- Topic\n  - A\n    - first idea\n    - second idea`

#### Scenario: Lines directly under the focused bullet

- **WHEN** the repaired lines have no preceding list item other than the focused bullet
- **THEN** they become direct children of the focused bullet

##### Example: No sibling above

- **GIVEN** the document `- Topic\n\nfirst idea\nsecond idea` focused on `Topic` with the visible end at the document end
- **WHEN** the repair plan is applied
- **THEN** the document becomes `- Topic\n  - first idea\n  - second idea`

#### Scenario: Existing structure is preserved

- **WHEN** the region contains valid nested bullets and list items that escaped to the top level
- **THEN** valid nested bullets keep their indentation and escaped items keep their marker and text while moving below the nearest preceding item

##### Example: Mixed region

- **GIVEN** the document `- Topic\n  - A\n    - A1\n- escaped` focused on `Topic` with the visible end at the document end
- **WHEN** the repair plan is applied
- **THEN** the document becomes `- Topic\n  - A\n    - A1\n      - escaped`

#### Scenario: Code fences stop the repair

- **WHEN** the region contains a code fence
- **THEN** repair stops at that fence and the fenced content is untouched

##### Example: Fence boundary

- **GIVEN** the document `- Topic\n\nstray\n\n```\ncode\n```` focused on `Topic` with the visible end at the document end
- **WHEN** the repair plan is applied
- **THEN** only `stray` becomes a bullet and the fenced block is unchanged

#### Scenario: Nothing to repair produces no transaction

- **WHEN** every line in the region already sits at a valid level with no blank lines to remove
- **THEN** the planner returns null

##### Example: Clean branch

- **GIVEN** the document `- Topic\n  - A` focused on `Topic` with the visible end at the document end
- **WHEN** the repair plan is computed
- **THEN** it returns null
