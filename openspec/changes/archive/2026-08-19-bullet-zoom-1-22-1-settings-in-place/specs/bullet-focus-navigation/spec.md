## MODIFIED Requirements

### Requirement: Show only the menu settings that apply

The bullet menu section SHALL present one control for what a bullet marker does, offering exactly three choices: open the menu on tap, zoom on tap with no menu, or zoom on tap with the menu on a long press. That choice SHALL be stored in the existing enable and marker-tap settings, so no stored settings need migrating. The section SHALL then show only the settings the choice actually uses: the press duration SHALL appear only for the long-press choice, and the slot list SHALL appear only when the menu can be opened at all. The settings that depend on the choice SHALL live in their own container, and changing the choice SHALL rebuild only that container, leaving every other row, the scroll position, and the control the user just touched exactly where they were.

#### Scenario: Zooming hides the menu settings

- **WHEN** the marker is set to zoom with no menu
- **THEN** neither the press duration nor the slot list is shown

##### Example: Zoom only

- **GIVEN** the marker choice is zoom with no menu
- **WHEN** the settings tab renders
- **THEN** the bullet menu section contains only the marker choice

#### Scenario: Tapping to open the menu hides the press duration

- **WHEN** the marker is set to open the menu on tap
- **THEN** the slot list is shown and the press duration, which only governs long presses, is not

##### Example: Stored values for the tap choice

- **GIVEN** the open-the-menu choice
- **WHEN** it is saved
- **THEN** the menu stays enabled and the marker tap action is `menu`

#### Scenario: The long-press choice shows everything

- **WHEN** the marker is set to zoom with the menu on a long press
- **THEN** both the press duration and the slot list are shown

##### Example: Stored values for the long-press choice

- **GIVEN** the long-press choice
- **WHEN** it is saved
- **THEN** the menu stays enabled and the marker tap action is `zoom`

#### Scenario: Switching the choice does not move the page

- **WHEN** the marker choice changes
- **THEN** only the dependent settings are rebuilt, and the rest of the tab keeps its position

##### Example: Scroll position survives

- **GIVEN** the settings tab scrolled down to the bullet menu section
- **WHEN** the marker choice changes
- **THEN** the section stays under the user's finger instead of jumping to the top

### Requirement: Reset each size slider to its default with one tap

Each size slider setting SHALL include a reset extra button that, when activated, sets the corresponding scale back to 100, persists the change, reapplies the scale custom properties, and updates the slider control in place to show 100 without re-rendering the settings tab.

#### Scenario: Reset the title slider

- **WHEN** the user taps the reset button next to the focus title slider
- **THEN** the persisted title scale becomes 100, the body custom property becomes `1`, and the slider shows 100 without the page moving

##### Example: Reset after adjustment

- **GIVEN** the title scale is 130
- **WHEN** the reset button is activated
- **THEN** the stored title scale is 100 and the slider displays 100
