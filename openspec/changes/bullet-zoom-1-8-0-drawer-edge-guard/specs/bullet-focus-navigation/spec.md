## ADDED Requirements

### Requirement: Confine the mobile drawer swipe to the screen edge

The plugin SHALL provide a drawer edge guard, enabled by default on mobile and configurable together with an edge width setting between 8 and 80 CSS pixels defaulting to 24. While enabled the plugin SHALL listen for touch events at the window capture phase, recording on touch start whether the touch began inside a Markdown editor content area and where it began, and SHALL stop propagation of subsequent touch moves when the touch began inside that area and farther than the edge width from both the left and right viewport edges, so Obsidian's drawer handler never sees the gesture. The guard SHALL NOT call preventDefault, so native scrolling, text selection, and caret placement are unaffected, SHALL leave touches starting within the edge width untouched so the drawer still opens there, and SHALL remove its listeners when disabled or when the plugin unloads. The same edge width SHALL define where the plugin's own bullet swipes are ignored, so the two regions never overlap.

#### Scenario: Swiping in the editor no longer opens the drawer

- **WHEN** a touch starts inside the editor content away from both edges and moves horizontally
- **THEN** the guard stops propagation of the move so the drawer stays closed

##### Example: Centre swipe blocked

- **GIVEN** a 400 pixel wide viewport, an edge width of 24, and a touch starting at x 200 inside the editor
- **WHEN** the touch moves to x 300
- **THEN** propagation of the move event is stopped and its default is not prevented

#### Scenario: Edge swipes still open the drawer

- **WHEN** a touch starts within the edge width of either side
- **THEN** the guard leaves the gesture alone

##### Example: Edge swipe allowed

- **GIVEN** a 400 pixel wide viewport and an edge width of 24
- **WHEN** a touch starts at x 10 and moves to x 120
- **THEN** propagation is not stopped

#### Scenario: Touches outside the editor are ignored

- **WHEN** a touch starts outside any Markdown editor content area
- **THEN** the guard never stops propagation

##### Example: Sidebar swipe

- **GIVEN** a touch starting on an element outside the editor content
- **WHEN** it moves horizontally
- **THEN** propagation is not stopped

#### Scenario: Disabling removes the listeners

- **WHEN** the guard is disabled or the plugin unloads
- **THEN** its window listeners are removed and gestures behave exactly as Obsidian's defaults
