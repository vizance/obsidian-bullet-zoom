## ADDED Requirements

### Requirement: Keep headings out of bullets while typing

The plugin SHALL watch every document change and, when a line the change touched becomes a list item with no indentation whose content is a heading, SHALL remove that list marker in the same transaction, so the heading works and one undo reverts both the typing and the correction. Only lines the change touched SHALL be inspected, indented list items SHALL be left alone because a heading cannot be indented, and a hash without following whitespace SHALL NOT count as a heading. The guard SHALL run whether or not a focus session is active, SHALL never run again on its own correction, and SHALL be governed by a setting that defaults to on.

#### Scenario: A continued list item stops swallowing a heading

- **WHEN** the editor starts a new list item and a heading is typed into it
- **THEN** the marker is removed and the line is left as a plain heading

##### Example: Typing a heading into a fresh item

- **GIVEN** the document `- Topic\n- ` with the cursor at the end
- **WHEN** `# Outline` is typed
- **THEN** the document becomes `- Topic\n# Outline`

#### Scenario: Only the edited lines are considered

- **WHEN** a change touches one line while another line already holds a swallowed heading
- **THEN** the untouched line is left exactly as it is

##### Example: Editing elsewhere

- **GIVEN** the document `- # Kept\n- Topic`
- **WHEN** `!` is appended to the second line
- **THEN** the document becomes `- # Kept\n- Topic!`

#### Scenario: Indented items and tags are not touched

- **WHEN** the line is an indented list item holding a heading, or its content is a hash without a space
- **THEN** nothing is removed

##### Example: A tag stays a tag

- **GIVEN** the line `- #tag`
- **WHEN** the guard inspects it
- **THEN** no change is planned

#### Scenario: The guard can be turned off

- **WHEN** the setting is off
- **THEN** the marker stays and the editor behaves exactly as Obsidian does

##### Example: Guard disabled

- **GIVEN** the setting is off and the document `- Topic\n- `
- **WHEN** `# Outline` is typed
- **THEN** the document becomes `- Topic\n- # Outline`
