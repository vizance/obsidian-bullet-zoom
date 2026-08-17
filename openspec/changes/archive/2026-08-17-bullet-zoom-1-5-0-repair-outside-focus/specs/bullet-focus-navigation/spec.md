## ADDED Requirements

### Requirement: Tidy dictated lines inside lists without zooming

When no focus session is active and the autoFixStrayLines setting is enabled, the plugin SHALL accumulate the document range touched by recent changes, map it through later changes, and — after edits settle for about 600 milliseconds — tidy only that range. It SHALL first look upward from the range's first line, skipping blank lines, for the nearest list item; if the first non-blank line found is not a list item, or none exists, the plugin SHALL do nothing. Within the range below that anchor the plugin SHALL convert only non-blank lines that carry no list marker, giving each the indentation one level below the nearest preceding list item and a `- ` marker while keeping the text verbatim, with all lines of the same run sharing that indentation. Lines that already carry a list marker SHALL be left exactly as they are, blank lines between the first and last converted line SHALL be removed while blank lines outside that span SHALL be kept, a code fence SHALL stop the tidy, and the change SHALL be dispatched as its own history step only when at least one line is converted.

#### Scenario: Dictation inside a list is tidied

- **WHEN** plain lines are inserted after a list item while no focus session is active
- **THEN** they become bullets one level below that item and stay siblings of each other

##### Example: Dictating under a bullet

- **GIVEN** the document `- A\n\nfirst idea\n\nsecond idea` and a recent change covering the last two lines
- **WHEN** the tidy plan is computed
- **THEN** the document becomes `- A\n  - first idea\n  - second idea`

#### Scenario: Editing outside a list does nothing

- **WHEN** the change range's nearest preceding non-blank line is a paragraph or heading rather than a list item
- **THEN** the planner returns null and the document is untouched

##### Example: Plain prose

- **GIVEN** the document `Some prose\n\ndictated text` and a recent change covering the last line
- **WHEN** the tidy plan is computed
- **THEN** it returns null

#### Scenario: Existing list items are never re-indented

- **WHEN** the range contains list items alongside plain lines
- **THEN** only the plain lines change and every existing list item keeps its original indentation

##### Example: Mixed range

- **GIVEN** the document `- A\n- B\nstray` and a recent change covering the last line
- **WHEN** the tidy plan is applied
- **THEN** the document becomes `- A\n- B\n  - stray`

#### Scenario: Blank lines outside the converted span survive

- **WHEN** blank lines sit before the first converted line or after the last one
- **THEN** those blank lines remain in the document

##### Example: Leading blank kept

- **GIVEN** the document `- A\n\nstray\n\n` and a recent change covering `stray`
- **WHEN** the tidy plan is applied
- **THEN** the blank line between `- A` and the new bullet is preserved
