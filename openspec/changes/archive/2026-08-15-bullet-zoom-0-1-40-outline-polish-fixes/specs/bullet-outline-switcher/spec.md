## MODIFIED Requirements

### Requirement: Render outline rows in a compact indent-first style

Outline rows SHALL keep their hierarchical index rendered inline with the row (inline-flex, minimum 24 CSS pixel width, muted color, tabular numerals) so the index, disclosure triangle, and label align on one visual line. Leaf rows SHALL render an empty spacer in the disclosure position with no visible glyph. The row preview control SHALL render a magnifier SVG icon instead of the「…」character so it cannot be confused with label truncation ellipses. Mobile rows SHALL indent 12 CSS pixels per depth level (capped at depth 6) while preserving the existing 44 CSS pixel touch targets.

#### Scenario: Single-line row anatomy

- **WHEN** the outline renders a branch with parents and leaves
- **THEN** each row keeps index, disclosure, and label on one line, and leaf rows show an empty spacer with no glyph

##### Example: Leaf spacer is empty

- **GIVEN** a note containing `- Parent\n  - Leaf`
- **WHEN** the outline renders with `Parent` expanded
- **THEN** the `Leaf` row's disclosure position contains an aria-hidden spacer whose text content is empty

#### Scenario: Preview control uses an icon

- **WHEN** a row's label overflows and the preview control is shown
- **THEN** the control contains an SVG icon and no「…」text content

##### Example: Icon audit

- **GIVEN** a rendered mobile outline row with an overflowing label
- **WHEN** the preview button is inspected
- **THEN** it contains an `svg` element and its text content is empty

#### Scenario: Mobile depth indentation

- **WHEN** the outline renders on mobile
- **THEN** each depth level indents 12 CSS pixels more than its parent up to depth 6

##### Example: Depth six cap

- **GIVEN** the mobile stylesheet is loaded
- **WHEN** the depth-6 row rule is inspected
- **THEN** its inline-start padding is 72px and touch heights remain 44px
