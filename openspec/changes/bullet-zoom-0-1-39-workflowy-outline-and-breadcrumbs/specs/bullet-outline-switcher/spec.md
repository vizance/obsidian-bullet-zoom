## ADDED Requirements

### Requirement: Render outline rows in a compact indent-first style

Outline rows SHALL keep their hierarchical index but render it in a smaller muted style aligned toward the disclosure control, the disclosure triangle SHALL sit adjacent to the label text, leaf rows SHALL render a muted dot placeholder instead of an empty spacer, and mobile rows SHALL indent 12 CSS pixels per depth level (capped at depth 6) while preserving the existing 44 CSS pixel touch targets.

#### Scenario: Compact row anatomy

- **WHEN** the outline renders a branch with parents and leaves
- **THEN** parent rows show index, adjacent triangle, and label in order, and leaf rows show a dot placeholder in the disclosure position

##### Example: Leaf dot placeholder

- **GIVEN** a note containing `- Parent\n  - Leaf`
- **WHEN** the outline renders with `Parent` expanded
- **THEN** the `Leaf` row's disclosure position contains a non-interactive dot element marked aria-hidden

#### Scenario: Mobile depth indentation

- **WHEN** the outline renders on mobile
- **THEN** each depth level indents 12 CSS pixels more than its parent up to depth 6

##### Example: Depth six cap

- **GIVEN** the mobile stylesheet is loaded
- **WHEN** the depth-6 row rule is inspected
- **THEN** its inline-start padding is 72px and touch heights remain 44px
