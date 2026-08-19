## ADDED Requirements

### Requirement: Match the list you paste into

When list content is pasted while the cursor sits on a list line, the plugin SHALL rewrite the pasted branch to belong to that list before inserting it, and SHALL leave every other paste to Obsidian. Each pasted line SHALL keep its depth relative to the branch root while being shifted to the target line's indentation, so children stay nested under the pasted parent. Each pasted marker SHALL adopt the target list's style: the target's bullet character when the target is unordered, or a fresh number per level when the target is ordered. Lines that are not list items, such as wrapped continuation text, SHALL be carried along with the same shift. Pasting into a list item that has no content SHALL replace that line rather than leaving an empty marker above the branch, and pasting into a list item that has content SHALL insert the branch on the following lines. The behavior SHALL be governed by a setting that defaults to on, and SHALL apply only to a collapsed cursor.

#### Scenario: A numbered branch becomes bulleted

- **WHEN** a branch copied from a numbered list is pasted into an unordered list
- **THEN** every pasted line uses the target list's bullet character

##### Example: Numbered into dashes

- **GIVEN** the clipboard holds `1. Topic\n\t1. Child` and the cursor is on `- Alpha`
- **WHEN** the paste is planned
- **THEN** the inserted text is `\n- Topic\n\t- Child`

#### Scenario: Children stay nested

- **WHEN** a branch is pasted onto an indented line
- **THEN** each pasted line keeps its depth relative to the branch root, measured from the target line's indentation

##### Example: Pasting under a nested bullet

- **GIVEN** the clipboard holds `1. Topic\n\t1. Child` and the cursor is on a line indented by one tab
- **WHEN** the paste is planned
- **THEN** the inserted text indents `Topic` by one tab and `Child` by two

#### Scenario: An ordered target renumbers the branch

- **WHEN** the target list is ordered
- **THEN** the pasted lines are numbered per level, restarting under each new parent

##### Example: Bullets into a numbered list

- **GIVEN** the clipboard holds `- Topic\n\t- Child\n\t- Second child\n- Sibling` and the cursor is on `1. Alpha`
- **WHEN** the paste is planned
- **THEN** the inserted text is `\n1. Topic\n\t1. Child\n\t2. Second child\n2. Sibling`

#### Scenario: An empty bullet is filled

- **WHEN** the cursor sits on a list item with no content
- **THEN** the plan replaces that whole line instead of inserting below it

##### Example: Pasting into a fresh bullet

- **GIVEN** the document `- Alpha\n\t- ` with the cursor at the end
- **WHEN** the paste is planned
- **THEN** the plan replaces the second line and its text starts with one tab

#### Scenario: Other pastes are left alone

- **WHEN** the clipboard is not a list, the cursor is not on a list line, or the setting is off
- **THEN** the plugin does not intervene and Obsidian pastes normally

##### Example: Plain text

- **GIVEN** the clipboard holds `Just text` and the cursor is on `- Alpha`
- **WHEN** the paste is planned
- **THEN** there is no plan
