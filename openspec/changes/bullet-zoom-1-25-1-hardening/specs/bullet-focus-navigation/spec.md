## ADDED Requirements

### Requirement: Sanitize the name of an extracted note

The name the user types when extracting SHALL be sanitized with the same rule that produces the suggested name before it is used to build a path: path separators, and the characters Obsidian rejects in file names, SHALL be replaced with spaces, runs of whitespace SHALL be collapsed, and the result SHALL be trimmed. The file SHALL therefore always be created inside the configured destination folder, never above or beside it. A name that is empty after sanitizing SHALL abort the extraction with a notice, leaving the source note unchanged.

#### Scenario: A typed path cannot escape the destination folder

- **WHEN** the entered name contains path separators or parent-directory steps
- **THEN** those characters are replaced and the note is created inside the destination folder

##### Example: Parent-directory steps

- **GIVEN** the entered name `../../outside`
- **WHEN** the name is sanitized
- **THEN** it becomes `.. .. outside`, which stays inside the destination folder

##### Example: A slash in the middle

- **GIVEN** the entered name `Ideas/Draft`
- **WHEN** the name is sanitized
- **THEN** it becomes `Ideas Draft`

#### Scenario: A name made only of rejected characters is refused

- **WHEN** the entered name has nothing left after sanitizing
- **THEN** the extraction stops and a notice asks for a name

##### Example: Only separators

- **GIVEN** the entered name `///`
- **WHEN** the name is sanitized
- **THEN** it is empty and the extraction is refused
