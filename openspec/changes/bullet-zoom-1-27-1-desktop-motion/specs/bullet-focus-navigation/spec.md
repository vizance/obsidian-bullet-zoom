## MODIFIED Requirements

### Requirement: Animate the bullet menu

Menu items SHALL spread out from the press point with a short entrance animation when the menu is opened by touch, so the menu explains where it came from, and the animation SHALL be skipped when the system asks for reduced motion.

A menu opened with a mouse SHALL instead appear instantly, matching the desktop convention for context menus: no entrance animation, no staggered delay, and no backdrop blur, because a blur covering a desktop-sized window costs far more per frame than the same blur on a phone. The caller SHALL declare which mode it wants, the overlay SHALL carry a class for the instant mode, and the stylesheet SHALL express the difference. Hover and selection feedback SHALL remain in both modes, and layout, hit testing, slots, and dismissal SHALL be identical.

#### Scenario: Touch keeps the entrance animation

- **WHEN** the menu opens from touch without reduced motion
- **THEN** the items animate outward from the press point

##### Example: Touch overlay

- **GIVEN** the menu opened from touch
- **THEN** the overlay keeps its fade and the items keep their staggered entrance

#### Scenario: A mouse gets an instant menu

- **WHEN** the menu opens from a mouse
- **THEN** the overlay is marked instant, and the stylesheet removes the blur and the entrance animation

##### Example: Instant overlay

- **GIVEN** the menu opened in instant mode
- **WHEN** the overlay is inspected
- **THEN** it carries the instant class

##### Example: Default stays animated

- **GIVEN** the menu opened without asking for instant mode
- **WHEN** the overlay is inspected
- **THEN** it does not carry the instant class

##### Example: Stylesheet audit

- **GIVEN** the plugin stylesheet is loaded
- **WHEN** the instant overlay rule is inspected
- **THEN** it sets the backdrop filter and the animation to none
