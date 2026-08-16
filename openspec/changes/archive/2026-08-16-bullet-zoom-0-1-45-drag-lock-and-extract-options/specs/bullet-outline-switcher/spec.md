## ADDED Requirements

### Requirement: Lock outline scrolling while dragging

While an outline drag is in progress the outline body SHALL carry a dragging class that disables touch scrolling and hides overflow, and the plugin SHALL preserve the scroll position captured when the drag started, restoring it when the drag ends or cancels so the panel does not move under the user's finger.

#### Scenario: Panel stays still during a touch drag

- **WHEN** a drag starts from an outline row on a touch device
- **THEN** the outline body carries the dragging class, its touch-action is none, its overflow is hidden, and its scroll position stays at the value captured when the drag began

##### Example: Scroll position preserved

- **GIVEN** an outline body scrolled to 90 pixels when a drag starts
- **WHEN** the drag ends
- **THEN** the dragging class is removed and the scroll position is 90

#### Scenario: Cancelled drags restore scrolling

- **WHEN** a drag is cancelled by a pointercancel event
- **THEN** the dragging class is removed and normal scrolling resumes
