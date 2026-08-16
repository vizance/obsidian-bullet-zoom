## ADDED Requirements

### Requirement: Choose what happens after extracting

The extract command SHALL support an extractOpenBehavior setting with the values `stay`, `current`, `tab`, and `split`, defaulting to `stay` and normalizing unknown or missing values to `stay`, exposed as a dropdown in the settings tab. After the new note is created and the source note is updated, the plugin SHALL keep the current view for `stay`, open the new note in the active tab for `current`, in a new tab for `tab`, and in a split for `split`. A failure while opening SHALL show a notice without undoing the completed extraction.

#### Scenario: Stay in the source note by default

- **WHEN** the behavior setting is `stay` and an extraction succeeds
- **THEN** no leaf is opened and the user keeps editing the source note

#### Scenario: Open the new note

- **WHEN** the behavior setting is `current`, `tab`, or `split`
- **THEN** the created file opens in the active tab, a new tab, or a split respectively

##### Example: New tab behavior

- **GIVEN** the behavior setting is `tab` and the extraction created `Cards/T.md`
- **THEN** the plugin opens that file in a new tab after the source note is updated

#### Scenario: Opening failures do not undo the extraction

- **WHEN** opening the created file throws
- **THEN** a notice reports that the note could not be opened and both the new file and the updated source note remain
