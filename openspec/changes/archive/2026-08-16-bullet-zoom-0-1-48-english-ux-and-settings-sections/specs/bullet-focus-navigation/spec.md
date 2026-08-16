## ADDED Requirements

### Requirement: Present an English interface grouped into settings sections

All user-facing strings SHALL be written in plain English, and the settings tab SHALL group its options under four headings in this order: `Zoom`, `Outline`, `Focus page`, and `Extract to new note`. Each option SHALL appear under the heading matching its purpose, with names as short noun phrases, descriptions as complete sentences, buttons labelled with verbs, and notices stating what happened plus what to do next. Setting keys, defaults, and behavior SHALL stay unchanged.

#### Scenario: Settings render in grouped sections

- **WHEN** the settings tab opens
- **THEN** four section headings render in order and every option appears under its matching heading

##### Example: Extract options grouped together

- **GIVEN** the settings tab is open
- **WHEN** the `Extract to new note` section is inspected
- **THEN** it contains the destination folder, template file, and remove-top-bullet options

#### Scenario: Interface strings are English

- **WHEN** commands, notices, panels, or dialogs display text
- **THEN** the text is English

##### Example: Command names

- **GIVEN** the plugin registers its commands
- **WHEN** their names are inspected
- **THEN** they read `Exit bullet focus` and `Go to parent bullet`

#### Scenario: Empty labels use English fallbacks

- **WHEN** a bullet has no text or a note has no title
- **THEN** the interface shows `Untitled bullet` or `Untitled note`

##### Example: Empty bullet label

- **GIVEN** a focused bullet whose text is empty
- **WHEN** the breadcrumb renders
- **THEN** it displays `Untitled bullet`
