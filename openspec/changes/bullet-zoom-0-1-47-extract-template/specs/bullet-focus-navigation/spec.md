## ADDED Requirements

### Requirement: Apply a template when extracting a note

The extract command SHALL support an extractTemplatePath setting (default empty, meaning no template) selectable through a Markdown-file autocomplete in the settings tab. When set and the file exists, the plugin SHALL read the template and render the new note by substituting the placeholders `{{content}}`, `{{title}}`, `{{date}}`, `{{time}}`, and `{{source}}`, matched case-insensitively and tolerating inner whitespace, where content is the extracted branch text, title is the entered file name, date is the local `YYYY-MM-DD`, time is the local `HH:mm`, and source is a wiki link to the originating note or an empty string when unavailable. A template without a content placeholder SHALL have the extracted content appended after a blank line, unknown placeholders SHALL be left untouched, an empty template SHALL yield the extracted content unchanged, and a template that cannot be read SHALL abort the extraction with a notice leaving the source note unchanged.

#### Scenario: Render a template with placeholders

- **WHEN** a template containing placeholders is configured and the user extracts a bullet
- **THEN** the new note contains the template with each known placeholder replaced

##### Example: Standard template

- **GIVEN** the template `# {{title}}\n\n{{content}}\n\n來源：{{source}}`, the name `想法`, the content `- A`, and the source note `Daily`
- **THEN** the new note is `# 想法\n\n- A\n\n來源：[[Daily]]`

#### Scenario: Template without a content placeholder

- **WHEN** the configured template has no content placeholder
- **THEN** the extracted content is appended after a blank line

##### Example: Header-only template

- **GIVEN** the template `# {{title}}` , the name `想法`, and the content `- A`
- **THEN** the new note is `# 想法\n\n- A`

#### Scenario: No template configured

- **WHEN** the template setting is empty
- **THEN** the new note contains exactly the extracted content as before

##### Example: Unchanged behavior

- **GIVEN** an empty template and the content `- A`
- **THEN** the new note is `- A`

#### Scenario: Unreadable template aborts safely

- **WHEN** the configured template file cannot be read
- **THEN** a notice is shown, no file is created, and the source note is unchanged
