## ADDED Requirements

### Requirement: Group the outline into heading sections

The outline SHALL scan the note for ATX headings (levels 1–6), skipping frontmatter and fenced code blocks, and SHALL render each heading as a non-interactive section header row in document order. Top-level bullets SHALL be grouped under the nearest preceding heading, bullets before the first heading form a headerless leading group, and the top-level index numbering SHALL restart at 1 within each section while nested numbering rules stay unchanged. Headings without bullets SHALL still render, and notes without headings SHALL render exactly as before.

#### Scenario: Sections restart numbering

- **WHEN** a note contains two headings each followed by top-level bullets
- **THEN** the outline shows both heading rows and the first bullet under each heading is numbered `1.`

##### Example: Two sections

- **GIVEN** the note `# Raw Ideas\n- A\n- B\n# Outline\n- C`
- **WHEN** the outline renders
- **THEN** heading rows `Raw Ideas` and `Outline` appear, `A` is `1.` and `B` is `2.` under the first, and `C` is `1.` under the second

#### Scenario: Header rows are visual only

- **WHEN** the user interacts with a heading row
- **THEN** it triggers no zoom, fold, or selection action and is not focusable

##### Example: Non-interactive audit

- **GIVEN** a rendered heading row
- **WHEN** it is inspected
- **THEN** it is not a button, carries no click handler contract, and is excluded from the tab order

#### Scenario: Leading bullets and code blocks

- **WHEN** bullets appear before the first heading or a `#` line sits inside a fenced code block
- **THEN** the leading bullets render in a headerless first group and the fenced `#` line does not create a section

##### Example: Fence is ignored

- **GIVEN** the note `- A\n\`\`\`\n# not a heading\n\`\`\`\n# Real\n- B`
- **WHEN** the outline renders
- **THEN** only one heading row `Real` appears, `A` is `1.` in the leading group, and `B` is `1.` under `Real`
