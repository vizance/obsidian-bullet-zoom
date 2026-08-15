## MODIFIED Requirements

### Requirement: Show the full breadcrumb trail on mobile

The mobile breadcrumb panel SHALL display the note crumb, every ancestor crumb, and the current crumb with visible separators, each crumb showing its full label without a per-crumb max-width truncation, and SHALL allow horizontal scrolling when the trail exceeds the viewport width. The current crumb keeps its flexible shrink behavior at the end of the trail.

#### Scenario: Deep focus shows every level in full

- **WHEN** the user focuses a Bullet nested three levels deep on mobile
- **THEN** the breadcrumb panel renders the note crumb, all ancestor crumbs with their full labels, separators between crumbs, and the current crumb

##### Example: No per-crumb truncation

- **GIVEN** a mobile breadcrumb panel for a focus three levels deep
- **WHEN** the ancestor crumb styles are inspected
- **THEN** no ancestor crumb carries a 6.5em max-width and their labels are not ellipsized by the plugin stylesheet

#### Scenario: Long trails scroll horizontally

- **WHEN** the full trail is wider than the panel
- **THEN** the panel scrolls horizontally instead of dropping or truncating levels

##### Example: Panel overflow contract

- **GIVEN** the mobile stylesheet is loaded
- **WHEN** the breadcrumb panel rule is inspected
- **THEN** its horizontal overflow is auto
