## ADDED Requirements

### Requirement: Choose what replaces the extracted bullet

The extract command SHALL support an extractReplacement setting with the values `link`, `embed`, and `none`, defaulting to `link` and normalizing unknown or missing values to `link`, exposed as a dropdown in the settings tab. After a successful extraction the source note SHALL keep a link bullet for `link`, an embed bullet for `embed` — both preserving the original indentation — or no remaining content for `none`. When removing content the plugin SHALL also remove the branch's line break, consuming the following newline when one exists, the preceding newline when the branch ends the document, and neither when the branch is the whole document, so no blank line is left behind and the outline keeps rendering.

#### Scenario: Keep a link by default

- **WHEN** the replacement setting is `link` and an extraction succeeds
- **THEN** the branch is replaced with a link bullet at the original indent

##### Example: Link replacement

- **GIVEN** the source `- A\n  - Topic\n    - P1` extracted at `Topic` with the name `T`
- **THEN** the source becomes `- A\n  - [[T]]`

#### Scenario: Keep an embed

- **WHEN** the replacement setting is `embed`
- **THEN** the branch is replaced with an embed bullet at the original indent

##### Example: Embed replacement

- **GIVEN** the source `- A\n  - Topic\n    - P1` extracted at `Topic` with the name `T`
- **THEN** the source becomes `- A\n  - ![[T]]`

#### Scenario: Leave nothing behind

- **WHEN** the replacement setting is `none`
- **THEN** the branch and its line break are removed without leaving a blank line

##### Example: Removal in the middle

- **GIVEN** the source `- A\n- Topic\n  - P1\n- B` extracted at `Topic`
- **THEN** the source becomes `- A\n- B`

##### Example: Removal at the end

- **GIVEN** the source `- A\n- Topic\n  - P1` extracted at `Topic`
- **THEN** the source becomes `- A`
