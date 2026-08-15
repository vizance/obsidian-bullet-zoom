## ADDED Requirements

### Requirement: Dismiss the label preview modal instantly

When the Bullet full-text preview modal closes by any path (close button, X button, or backdrop), the plugin SHALL hide the modal element and its container element before delegating to the native close, so no slide-down animation or visible displacement occurs. Repeated close calls SHALL still delegate to the native close only once.

#### Scenario: Close hides the whole modal at once

- **WHEN** the user activates the preview modal's close control
- **THEN** the modal element and its container element are hidden immediately and the native close runs exactly once

##### Example: Close button tap

- **GIVEN** an open Bullet full-text preview modal
- **WHEN** the close button is clicked twice in quick succession
- **THEN** both the modal element and the container element report hidden, and the native close was invoked once

#### Scenario: No displacement during dismissal

- **WHEN** the preview modal is dismissed
- **THEN** the modal performs no downward movement before disappearing because its container is hidden before the native close animation can play

##### Example: Container hidden before native close

- **GIVEN** an open preview modal whose container element is visible
- **WHEN** the plugin close override runs
- **THEN** the container element's hidden property is true before the native close is delegated
