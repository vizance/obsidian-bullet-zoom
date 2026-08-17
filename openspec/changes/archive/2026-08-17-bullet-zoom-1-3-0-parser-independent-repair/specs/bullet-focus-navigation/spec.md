## MODIFIED Requirements

### Requirement: Keep stray lines visible and repair them automatically

While a focus session is active the plugin SHALL keep the focused area visible without hiding content that arrives at its end, remembering the session's visible end and never shrinking it while the session lasts, mapping that end through every document change, and adding no marker, highlight, or notice. When the autoFixStrayLines setting is enabled, default on and exposed as a toggle, the plugin SHALL — after document changes settle for about 600 milliseconds — repair the lines between the focused bullet and the remembered visible end using only regular-expression and indentation-column classification, never the syntax tree, so the repair behaves identically under any Markdown parser. Blank lines SHALL be preserved, list items indented deeper than the focused bullet SHALL be left untouched, list items indented no deeper SHALL keep their marker and text while being re-indented to the child level, and every other non-blank line SHALL keep its text verbatim while gaining the child indent and a `- ` marker, so each line break becomes the next bullet. Repair SHALL stop at a code fence, SHALL be dispatched as its own history step, and SHALL dispatch nothing when no line needs changing.

#### Scenario: Dictated paragraphs become bullets

- **WHEN** several plain lines sit between the focused bullet and the remembered visible end
- **THEN** each becomes a child bullet of the focused bullet with its text unchanged

##### Example: Multi-paragraph dictation

- **GIVEN** the document `- Topic\n  - A\n\nfirst idea\n\nsecond idea` focused on `Topic` with the visible end at the document end
- **WHEN** the repair plan is applied
- **THEN** the document becomes `- Topic\n  - A\n\n  - first idea\n\n  - second idea`

#### Scenario: Existing structure is preserved

- **WHEN** the region contains valid child bullets and list items that escaped to the top level
- **THEN** valid children keep their indentation and escaped items keep their marker and text while moving to the child level

##### Example: Mixed region

- **GIVEN** the document `- Topic\n  - A\n    - A1\n- escaped` focused on `Topic` with the visible end at the document end
- **WHEN** the repair plan is applied
- **THEN** the document becomes `- Topic\n  - A\n    - A1\n  - escaped`

#### Scenario: Headings keep their text

- **WHEN** a line in the region starts with hashes
- **THEN** it becomes a bullet whose text still begins with those hashes

##### Example: Heading line

- **GIVEN** the document `- Topic\n\n## Section` focused on `Topic` with the visible end at the document end
- **WHEN** the repair plan is applied
- **THEN** the document becomes `- Topic\n\n  - ## Section`

#### Scenario: Code fences stop the repair

- **WHEN** the region contains a code fence
- **THEN** repair stops at that fence and the fenced content is untouched

##### Example: Fence boundary

- **GIVEN** the document `- Topic\n\nstray\n\n```\ncode\n```` focused on `Topic` with the visible end at the document end
- **WHEN** the repair plan is applied
- **THEN** only `stray` becomes a bullet and the fenced block is unchanged

#### Scenario: Nothing to repair produces no transaction

- **WHEN** every line in the region already sits at a valid child level
- **THEN** the planner returns null

##### Example: Clean branch

- **GIVEN** the document `- Topic\n  - A` focused on `Topic` with the visible end at the document end
- **WHEN** the repair plan is computed
- **THEN** it returns null
