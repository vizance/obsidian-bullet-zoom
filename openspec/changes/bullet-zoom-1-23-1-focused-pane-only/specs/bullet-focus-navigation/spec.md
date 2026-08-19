## MODIFIED Requirements

### Requirement: Keep stray lines visible and repair them automatically

While a focus session is active the plugin SHALL keep the focused area visible without hiding content that arrives at its end, remembering the session's visible end and never shrinking it while the session lasts, mapping that end through every document change, and adding no marker, highlight, or notice. When the autoFixStrayLines setting is enabled, default on and exposed as a toggle, the plugin SHALL — after document changes settle for about 600 milliseconds, only while a focus session is active, and only in the editor pane that currently holds input focus — repair the lines between the focused bullet and the remembered visible end using only regular-expression and indentation-column classification, never the syntax tree. A pane without input focus SHALL never be repaired, and losing focus SHALL cancel a scheduled repair, so document changes that reach a background pane from synchronisation, from the same note being open twice, or from another plugin never rewrite a note the user is not editing. Lines already indented deeper than the focused bullet and carrying a list marker SHALL be left untouched. Every other non-blank line SHALL be indented one level below the nearest preceding list item, or below the focused bullet when there is none, with all lines of the same repaired run sharing that one indentation so they stay siblings; lines that already carry a list marker SHALL keep their marker and text while every other line SHALL keep its text verbatim and gain a `- ` marker. Blank lines between repaired lines SHALL be removed. Repair SHALL stop at a code fence or a heading, leaving that line and everything after it untouched, and the replaced range SHALL end at the last line the repair actually rewrote, so blank lines before a boundary survive. A list item that carries no indentation and whose content is a heading SHALL be restored to a plain heading by dropping its list marker, and the repair SHALL stop at that line; an indented list item whose content is a heading SHALL be left exactly as it is, and the repair SHALL stop there too. Repair SHALL be dispatched as its own history step, and SHALL dispatch nothing when no line needs changing. When no focus session is active the plugin SHALL NOT modify the document.

#### Scenario: Dictated lines nest under the preceding bullet

- **WHEN** plain lines follow an existing child bullet inside the focused area
- **THEN** they become bullets one level below that child bullet and remain siblings of each other

##### Example: Continuing the last bullet

- **GIVEN** the document `- Topic\n  - A\n\nfirst idea\n\nsecond idea` focused on `Topic` with the visible end at the document end
- **WHEN** the repair plan is applied
- **THEN** the document becomes `- Topic\n  - A\n    - first idea\n    - second idea`

#### Scenario: A background pane is never repaired

- **WHEN** a pane holding a focus session loses input focus and its document changes anyway
- **THEN** no repair runs in that pane

##### Example: Editing another pane

- **GIVEN** a focused bullet in a pane that no longer holds input focus, and auto-fix enabled
- **WHEN** that pane's document gains `\n\ndictated text` and the debounce elapses
- **THEN** the document still reads as it did, with the dictated text untouched

#### Scenario: Headings survive the repair

- **WHEN** a heading separates groups of bullets inside the repaired region
- **THEN** the heading keeps its `#` marker, the repair stops there, and the blank line before it is left in place

##### Example: A heading between groups

- **GIVEN** the document `- Topic\nstray line\n\n# Outline\n- Later` focused on `Topic` with the visible end at the document end
- **WHEN** the repair plan is applied
- **THEN** the document becomes `- Topic\n  - stray line\n\n# Outline\n- Later`

#### Scenario: A heading swallowed by a list marker is restored

- **WHEN** a top-level list item's content is a heading
- **THEN** the list marker is dropped so the heading works again, and the repair stops at that line

##### Example: Restoring a swallowed heading

- **GIVEN** the document `- Topic\n- # Outline\nstray` focused on `Topic` with the visible end at the document end
- **WHEN** the repair plan is applied
- **THEN** the document becomes `- Topic\n# Outline\nstray`

#### Scenario: No focus session means no changes

- **WHEN** the user edits a list while no focus session is active
- **THEN** the plugin dispatches no repair transaction at all

##### Example: Editing outside zoom

- **GIVEN** the document `- A` with no focus session and auto-fix enabled
- **WHEN** `\n\ndictated text` is appended and the debounce elapses
- **THEN** the document still reads `- A\n\ndictated text`
