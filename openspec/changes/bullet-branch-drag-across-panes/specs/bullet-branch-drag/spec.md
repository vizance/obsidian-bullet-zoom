## ADDED Requirements

### Requirement: Start a branch drag from a supported list marker

The plugin SHALL treat the rendered marker of every supported list item in a Markdown editor as a drag handle for that item's whole branch, where the branch is the item together with all of its nested items. A pointer press on the marker SHALL start a drag only after the pointer travels at least 12 pixels for a mouse pointer, or after the pointer is held for at least 350 milliseconds without traveling more than 10 pixels for a non-mouse pointer. The mouse distance SHALL equal the distance at which a marker press stops being a radial-menu press, so starting a drag and cancelling the menu press happen at the same moment.

A press that is released before the drag starts SHALL keep the existing marker behavior, whether that is Zoom or opening the radial menu. A press that starts a drag SHALL suppress the click that follows the release, SHALL NOT Zoom, and SHALL NOT open the radial menu.

An item SHALL be draggable exactly when the plugin already recognizes it as a supported list item. When numbered-item detection is disabled, numbered items SHALL NOT be draggable.

#### Scenario: Mouse press below the threshold still zooms

- **WHEN** the user presses a marker with a mouse, moves 3 pixels, and releases
- **THEN** no drag starts, the document is unchanged, and the marker keeps its existing press behavior

#### Scenario: Mouse press past the threshold starts a drag

- **WHEN** the user presses a marker with a mouse and moves 16 pixels
- **THEN** the branch enters the dragging state and the release neither zooms nor opens the radial menu

#### Scenario: Touch hold starts a drag

- **WHEN** the user touches a marker and holds it for 350 milliseconds without moving more than 10 pixels
- **THEN** the branch enters the dragging state

#### Scenario: Touch scroll cancels before the drag starts

- **WHEN** the user touches a marker and moves 20 pixels before 350 milliseconds elapse
- **THEN** no drag starts and the editor scrolls normally

#### Scenario: Numbered detection disabled blocks the drag

- **WHEN** numbered-item detection is disabled and the user presses the marker of a numbered item
- **THEN** no drag starts

### Requirement: Leave the radial menu its only entry point when it needs one

The radial menu opens either on a plain marker tap or on a marker long press, never on both. When the menu opens on a tap, the long press is unused and a touch hold SHALL start a branch drag. When the menu opens on a long press, that long press SHALL keep opening the menu and a touch hold SHALL NOT start a branch drag, so the menu never loses its only entry point. A mouse drag SHALL be available in both cases, because it starts on distance rather than on time.

#### Scenario: Tap opens the menu, so the hold is free for dragging

- **WHEN** the marker tap action opens the radial menu and the user holds a marker for 350 milliseconds
- **THEN** the branch enters the dragging state and the radial menu does not open

#### Scenario: Long press opens the menu, so touch dragging stays off

- **WHEN** the marker tap action zooms, which leaves the long press as the only way to open the radial menu, and the user holds a marker for 350 milliseconds
- **THEN** the radial menu opens and no drag starts

#### Scenario: A mouse drag works even when the long press owns the menu

- **WHEN** the marker tap action zooms and the user presses a marker with a mouse and moves 16 pixels
- **THEN** the branch enters the dragging state and the radial menu does not open

### Requirement: Resolve the drop gap from the pointer position

While a drag is active, the plugin SHALL resolve the pointer position to a drop gap in whichever Markdown editor is under the pointer. The plugin SHALL map the pointer to a document line, and SHALL select the gap above that line when the pointer is in the upper half of the line's rectangle and the gap below that line when the pointer is in the lower half. A gap SHALL be described by the supported item that precedes it and the supported item that follows it, either of which MAY be absent at the start or end of the list.

The plugin SHALL resolve no gap, and SHALL show no drop indicator, when the line under the pointer is not a supported list item, when the pointer is outside every Markdown editor, or when the editor under the pointer belongs to a different window document than the drag source.

#### Scenario: Upper half selects the gap above

- **WHEN** the pointer is in the upper half of a supported item's line
- **THEN** the resolved gap is the one between that item and the item above it

#### Scenario: Pointer over a non-list line resolves nothing

- **WHEN** the pointer is over a paragraph line that is not a supported list item
- **THEN** no gap is resolved and no drop indicator is shown

#### Scenario: Pointer over a popout window resolves nothing

- **WHEN** the pointer is over an editor whose owner document differs from the drag source's owner document
- **THEN** no gap is resolved and no drop indicator is shown

### Requirement: Restrict drop depth to the legal indent set for the gap

For a resolved gap, the plugin SHALL compute an ordered set of legal indent strings, from shallowest to deepest, using the item above the gap as `above` and the item below the gap as `below`:

- The deepest legal indent SHALL be the indent of `above` extended by one indent unit of the target document.
- The shallowest legal indent SHALL be the indent of `below`, so that dropping SHALL NOT re-parent `below` under the moved branch.
- When `above` is absent, the only legal indent SHALL be the indent of `below`.
- When `below` is absent, the shallowest legal indent SHALL be the outermost indent, which is the empty string.
- The set SHALL consist of the indent strings of `above` and its ancestors, plus the indent of `above` extended by one indent unit, with every entry shallower than the shallowest legal indent removed, and duplicates removed.

Indents SHALL be carried as the literal indent text of the target document, so that a document indented with tabs SHALL stay indented with tabs and a document indented with spaces SHALL stay indented with spaces.

#### Scenario: Legal indents between a parent's child and the next top-level item

- **WHEN** the gap sits between a child item and the next top-level item
- **THEN** the legal indent set runs from the top-level indent to the child's indent extended by one indent unit

##### Example: legal indent sets by gap

- **GIVEN** a document with lines `- A`, `\t- A1`, `\t\t- A1a`, `- B`, all indented with tabs and an indent unit of one tab

| Gap                    | above  | below | Legal indents (shallow to deep) |
| ---------------------- | ------ | ----- | ------------------------------- |
| before `- A`           | absent | `A`   | `""`                            |
| between `A` and `A1`   | `A`    | `A1`  | `"\t"`                          |
| between `A1a` and `B`  | `A1a`  | `B`   | `""`, `"\t"`, `"\t\t"`, `"\t\t\t"` |
| after `- B`            | `B`    | absent | `""`, `"\t"`                   |

#### Scenario: The first gap allows only one indent

- **WHEN** the gap is above the first supported item in the document
- **THEN** the legal indent set contains exactly the first item's indent

### Requirement: Choose the indent nearest to the pointer's horizontal position

The plugin SHALL map every legal indent for the current gap to a horizontal screen coordinate in the target editor, computed from the target line's left edge plus the indent's character count multiplied by the measured width of one indent unit in that editor. The plugin SHALL select the legal indent whose coordinate is nearest the pointer's horizontal position, and SHALL select the shallower indent when two coordinates are equally near. Horizontal pointer movement inside one gap SHALL change the selected indent without re-resolving the gap.

#### Scenario: Moving right selects a deeper indent

- **WHEN** the gap allows the top-level indent and one deeper indent, and the pointer moves right past the midpoint between their coordinates
- **THEN** the deeper indent becomes the selected indent

#### Scenario: Equal distance prefers the shallower indent

- **WHEN** the pointer sits exactly midway between two legal indent coordinates
- **THEN** the shallower indent is selected

### Requirement: Show a drop indicator that previews the resulting position and depth

While a gap and an indent are selected, the plugin SHALL render a horizontal drop indicator inside the target editor, positioned at the selected gap, with its left edge at the coordinate of the selected indent. The plugin SHALL position the indicator through CSS custom properties defined in the plugin stylesheet, and SHALL NOT assign inline style declarations other than those custom properties. The plugin SHALL remove the indicator when the drag ends, when the drag is canceled, and whenever no gap is resolved.

#### Scenario: Indicator follows the selected indent

- **WHEN** the selected indent changes while the gap stays the same
- **THEN** the indicator stays at the same gap and its left edge moves to the new indent's coordinate

#### Scenario: Pointer cancel removes the indicator

- **WHEN** the drag receives a pointer cancel event
- **THEN** the indicator is removed and the document is unchanged

### Requirement: Hide the text caret while a branch is being dragged

While a drag is active the plugin SHALL suppress the text caret in every Markdown editor of the window, and SHALL prevent text selection in those editors, so that the finger or mouse driving the drag never appears to be dragging the caret underneath it. The plugin SHALL remove focus from the source editor's content when the drag starts, and SHALL restore the caret and the previous focus when the drag ends, whether it ended in a drop or a cancel. A successful drop SHALL leave focus in the editor that received the branch.

#### Scenario: The caret disappears for the length of the drag

- **WHEN** a drag starts
- **THEN** the caret is suppressed and the source editor's content loses focus

#### Scenario: Cancelling restores the caret

- **WHEN** an active drag is cancelled
- **THEN** the caret is restored and focus returns to the editor that had it

#### Scenario: A drop leaves focus in the receiving editor

- **WHEN** a drag ends in a successful drop on another pane
- **THEN** the caret is restored and the receiving editor holds the focus

### Requirement: Keep the editor still while a branch is being dragged

While a drag is active the plugin SHALL hold the source editor's scroll position at the value it had when the drag started, restoring it on every pointer move, so that a finger moving across a phone screen moves the drop indicator instead of scrolling the note away. The plugin SHALL also suppress touch scrolling and overscroll in the editors of the window for the length of the drag. The scroll position SHALL be released when the drag ends, whether it ended in a drop or a cancel.

#### Scenario: The note does not scroll under a dragging finger

- **WHEN** a drag is active and the pointer moves far enough vertically to scroll the editor
- **THEN** the editor's scroll position stays where it was when the drag started

#### Scenario: Scrolling works again after the drag

- **WHEN** the drag ends
- **THEN** the editor scrolls normally again

### Requirement: Reject illegal drops without changing any document

The plugin SHALL NOT apply a drop, and SHALL leave every document unchanged, when any of the following holds:

- The drag source is not a supported list item, or its branch range cannot be computed.
- The source and target are the same document and the resolved gap lies inside the source branch.
- No gap is resolved at the moment of release.
- The target editor is read-only or is not a Markdown editor.
- The target editor has an active focus session and the resolved gap lies outside that session's range.

A rejected drop SHALL be silent: the plugin SHALL NOT show a notice for it.

#### Scenario: Dropping a branch inside itself is rejected

- **WHEN** the user releases the drag over a gap that lies within the dragged branch
- **THEN** the document is unchanged and no notice is shown

#### Scenario: Read-only target is rejected

- **WHEN** the user releases the drag over a read-only editor
- **THEN** no document is changed and no notice is shown

#### Scenario: Gap outside an active focus session is rejected

- **WHEN** the target editor has an active focus session and the resolved gap lies outside that session's range
- **THEN** no document is changed and no notice is shown

### Requirement: Move the branch into the drop position within one document

When the source and the target are the same document, the plugin SHALL apply the removal of the source branch and the insertion of the rewritten branch as a single editor transaction, so that a single undo SHALL restore the document. After a successful drop, the plugin SHALL place the cursor on the first line of the moved branch.

#### Scenario: Reorder within one document is one undo step

- **WHEN** the user drops a branch at another gap in the same document
- **THEN** the branch appears at the drop position and one undo restores the original document

#### Scenario: Cursor follows the moved branch

- **WHEN** a drop succeeds
- **THEN** the cursor is placed on the first line of the moved branch

### Requirement: Move the branch across panes and files

The plugin SHALL accept a drop in any Markdown editor of the same window, including an editor showing a different file. For a cross-document drop, the plugin SHALL first insert the rewritten branch into the target document, and SHALL remove the source branch from the source document only after the insertion succeeds. When the insertion fails, the plugin SHALL leave both documents unchanged. When the insertion succeeds but the removal fails, the plugin SHALL keep the inserted branch and SHALL show a notice stating that the source branch was not removed. A cross-document move SHALL produce one undo step in each document.

#### Scenario: Drag into a split pane showing another file

- **WHEN** the user drags a branch from one pane and releases it over a supported item in another pane showing a different file
- **THEN** the branch is removed from the source file and inserted at the drop position in the target file

#### Scenario: Failed insertion leaves the source intact

- **WHEN** the insertion into the target document fails
- **THEN** the source document is unchanged

#### Scenario: Failed removal is surfaced

- **WHEN** the insertion succeeds but the removal from the source document fails
- **THEN** the inserted branch is kept and a notice states that the source branch was not removed

### Requirement: Rewrite the dropped branch to match the target list

The plugin SHALL rewrite every line of the dropped branch so that the branch root takes the selected indent, every nested line keeps its depth relative to the branch root, and every marker adopts the marker style of the target list. When the target list is ordered, the plugin SHALL renumber the dropped lines per indent level, starting at 1 and restarting a deeper level whenever its parent level advances. When the target list is unordered, the plugin SHALL use the target's bullet character for every dropped line. The rewriting SHALL be performed by the same function that rewrites pasted list text, so that dropping and pasting produce the same markers for the same input.

#### Scenario: An ordered branch dropped into an unordered list loses its numbers

- **WHEN** a numbered branch is dropped into a list whose markers are `-`
- **THEN** every dropped line uses `-` as its marker

##### Example: unordered branch dropped into an ordered list

- **GIVEN** the dragged branch is `- Alpha`, `\t- Beta`, `\t- Gamma`
- **AND** the target list uses markers of the form `1.` at the selected indent, which is the empty string
- **WHEN** the branch is dropped
- **THEN** the inserted text is `1. Alpha`, `\t1. Beta`, `\t2. Gamma`

#### Scenario: Nested depth is preserved relative to the branch root

- **WHEN** a branch whose root is at depth 2 is dropped at the outermost indent
- **THEN** the root sits at the outermost indent and each descendant keeps its original depth difference from the root
