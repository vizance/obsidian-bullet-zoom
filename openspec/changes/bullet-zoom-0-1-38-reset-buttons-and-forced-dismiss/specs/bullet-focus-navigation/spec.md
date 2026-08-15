## ADDED Requirements

### Requirement: Reset each size slider to its default with one tap

Each size slider setting SHALL include a reset extra button that, when activated, sets the corresponding scale back to 100, persists the change, reapplies the scale custom properties, and re-renders the settings tab so the slider control reflects 100.

#### Scenario: Reset the title slider

- **WHEN** the user taps the reset button next to the focus title slider
- **THEN** the persisted title scale becomes 100, the body custom property becomes `1`, and the re-rendered slider shows 100

##### Example: Reset after adjustment

- **GIVEN** the title scale is 130
- **WHEN** the reset button of the title slider is activated
- **THEN** the persisted data records `titleScale: 100` and the slider control value is `100`

#### Scenario: Reset the outline slider independently

- **WHEN** the user taps the reset button next to the outline slider while the title scale is 130
- **THEN** only the outline scale returns to 100 and the title scale stays 130

##### Example: Independent reset

- **GIVEN** persisted data `{ "titleScale": 130, "outlineScale": 85 }`
- **WHEN** the outline reset button is activated
- **THEN** the persisted data becomes `{ "titleScale": 130, "outlineScale": 100 }`
