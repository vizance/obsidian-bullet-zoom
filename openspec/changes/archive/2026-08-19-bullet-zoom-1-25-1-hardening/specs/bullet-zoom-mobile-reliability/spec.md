## MODIFIED Requirements

### Requirement: Dismiss the label preview modal instantly

When the Bullet full-text preview modal closes by any path (close button, X button, or backdrop), the plugin SHALL force-hide the modal element and its container element by adding a plugin-owned class whose stylesheet rule declares `display: none` with the `important` priority — which overrides any theme or app stylesheet display declaration — before delegating to the native close, so no slide-down animation or visible displacement occurs. The plugin SHALL NOT set inline styles for this. Repeated close calls SHALL still delegate to the native close only once.

#### Scenario: Close the preview modal by any path

- **WHEN** the preview modal is dismissed
- **THEN** the modal element and the container element carry the force-hidden class immediately and the native close runs exactly once

##### Example: Repeated close calls

- **GIVEN** the preview modal is open
- **WHEN** the close control is activated twice
- **THEN** both elements carry the force-hidden class, and the native close was invoked once

##### Example: A theme that shows modals

- **GIVEN** a theme whose stylesheet sets a display value on modal containers
- **WHEN** the preview modal is dismissed
- **THEN** the important declaration in the plugin's class still wins and the container stays hidden during dismissal
