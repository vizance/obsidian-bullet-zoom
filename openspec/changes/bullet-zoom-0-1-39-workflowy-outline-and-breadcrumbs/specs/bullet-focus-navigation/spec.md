## ADDED Requirements

### Requirement: Show the full breadcrumb trail on mobile

The mobile breadcrumb panel SHALL display the note crumb, every ancestor crumb, and the current crumb with visible separators, SHALL allow horizontal scrolling when the trail exceeds the viewport width, and SHALL truncate each non-current crumb with an ellipsis beyond approximately 6.5em while the current crumb keeps its flexible shrink behavior.

#### Scenario: Deep focus shows every level

- **WHEN** the user focuses a Bullet nested three levels deep on mobile
- **THEN** the breadcrumb panel renders the note crumb, all three ancestor crumbs, separators between crumbs, and the current crumb

##### Example: No hidden ancestors

- **GIVEN** a mobile breadcrumb panel for a focus three levels deep
- **WHEN** the rendered crumbs are inspected
- **THEN** no ancestor crumb has display none and separators are visible

#### Scenario: Long trails scroll horizontally

- **WHEN** the full trail is wider than the panel
- **THEN** the panel scrolls horizontally instead of dropping levels

##### Example: Panel overflow contract

- **GIVEN** the mobile stylesheet is loaded
- **WHEN** the breadcrumb panel rule is inspected
- **THEN** its horizontal overflow is auto and each non-current crumb carries a max-width with ellipsis truncation
