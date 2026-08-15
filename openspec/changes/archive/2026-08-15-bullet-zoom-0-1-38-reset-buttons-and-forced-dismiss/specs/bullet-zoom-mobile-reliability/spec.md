## MODIFIED Requirements

### Requirement: Dismiss the label preview modal instantly

When the Bullet full-text preview modal closes by any path (close button, X button, or backdrop), the plugin SHALL force-hide the modal element and its container element by setting an inline `display: none` declaration with the `important` priority — which overrides any theme or app stylesheet display declaration — before delegating to the native close, so no slide-down animation or visible displacement occurs. Repeated close calls SHALL still delegate to the native close only once.

#### Scenario: Close force-hides the whole modal at once

- **WHEN** the user activates the preview modal's close control
- **THEN** the modal element and the container element carry an inline important `display: none` immediately and the native close runs exactly once

##### Example: Inline priority audit

- **GIVEN** an open Bullet full-text preview modal
- **WHEN** the close button is clicked twice in quick succession
- **THEN** both elements report inline display `none` with priority `important`, and the native close was invoked once

#### Scenario: Stylesheet display rules cannot resurrect the modal

- **WHEN** an app or theme stylesheet declares a display value for the modal container
- **THEN** the inline important declaration still wins and the container stays hidden during dismissal

##### Example: Flex container stays hidden

- **GIVEN** a stylesheet rule that sets the modal container to `display: flex`
- **WHEN** the plugin close override runs
- **THEN** the computed display of the container is `none`
