## ADDED Requirements

### Requirement: Rebase focus page layout to the focused bullet

When a Bullet is focused, the plugin SHALL lay out the focus page relative to the focused bullet instead of the document's absolute list depth. The focus root line SHALL render with zero text-indent and zero inline-start padding so the title and its wrapped lines use the full editor width. Every bullet line inside the focused branch SHALL hide its leading indentation characters and SHALL receive a relative-depth custom property (capped at 8) that drives a rebased hanging indent, so a direct child renders at depth one regardless of how deep the branch sits in the document. Exiting focus SHALL restore the native layout.

#### Scenario: Zoom into a third-level bullet

- **WHEN** the user focuses a Bullet nested three levels deep
- **THEN** the focus root line carries the focus-root class with zeroed indent overrides, and its direct children carry the rebased line class with relative depth `1`

##### Example: Deep branch rebases

- **GIVEN** the document is `- A\n  - B\n    - C 這是一段會折行的長文字\n      - D\n        - E`
- **WHEN** the user focuses `C`
- **THEN** the line of `D` carries the rebased class with relative depth `1`, the line of `E` carries relative depth `2`, and the leading indentation characters of both lines are hidden from rendering

#### Scenario: Wrapped title uses the full width

- **WHEN** a focused bullet's label is longer than one visual line
- **THEN** the focus root line's computed text-indent is `0` and its inline-start padding is `0`, so wrapped title lines start at the editor's left edge

##### Example: Root line CSS contract

- **GIVEN** the plugin stylesheet is loaded and a line carries the focus-root class
- **WHEN** its computed style is inspected
- **THEN** text-indent is `0px` and padding-inline-start is `0px`

#### Scenario: Leaving focus restores native indentation

- **WHEN** the user exits focus
- **THEN** no line carries the rebased class or the focus-root class and the native indentation renders unchanged

##### Example: Exit cleanup

- **GIVEN** a focused branch whose lines carry rebased classes
- **WHEN** the focus session ends
- **THEN** querying the editor DOM for the rebased line class returns no elements
