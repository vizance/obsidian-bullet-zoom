## ADDED Requirements

### Requirement: Extract a bullet branch into a new note

The plugin SHALL provide an editor command that is available only when the cursor sits on a supported bullet, opens a modal asking for a file name, and on confirmation creates a Markdown file with that name in the current note's folder, moves the bullet's branch content into it, and replaces the branch in the source note with a wiki-link bullet at the original indent so the list structure and outline stay valid. A removeTopBullet setting (default enabled, exposed as a settings toggle) SHALL control the new file's content: when enabled the top bullet line is dropped and its child lines are dedented to the top level by their minimal common indent prefix (falling back to the bullet's label text when there are no children); when disabled the whole branch is included rebased to zero indent. An empty file name or an existing file SHALL abort with a notice and leave the source note unchanged.

#### Scenario: Extract with the default remove-top behavior

- **WHEN** the user runs the command on a bullet with children, enters a name, and confirms
- **THEN** the new file contains the dedented children, and the source branch becomes a link bullet at the original indent

##### Example: Remove-top extraction

- **GIVEN** the source `- Topic\n  - P1\n    - P1a\n  - P2` with the cursor on `Topic` and the name `新筆記`
- **THEN** the new file content is `- P1\n  - P1a\n- P2` and the source becomes `- [[新筆記]]`

#### Scenario: Extract keeping the top bullet

- **WHEN** removeTopBullet is disabled and the user extracts a nested bullet
- **THEN** the new file contains the whole branch rebased to zero indent

##### Example: Keep-top extraction

- **GIVEN** the source `- A\n  - Topic\n    - P1` with the cursor on `Topic`, removeTopBullet disabled, and the name `T`
- **THEN** the new file content is `- Topic\n  - P1` and the source becomes `- A\n  - [[T]]`

#### Scenario: A leaf bullet extracts its label

- **WHEN** removeTopBullet is enabled and the bullet has no children
- **THEN** the new file contains the bullet's label text

##### Example: Leaf extraction

- **GIVEN** the source `- Only text` and the name `N`
- **THEN** the new file content is `Only text` and the source becomes `- [[N]]`

#### Scenario: Invalid names abort safely

- **WHEN** the entered name is empty or a file with that name already exists
- **THEN** a notice is shown and the source note is unchanged
