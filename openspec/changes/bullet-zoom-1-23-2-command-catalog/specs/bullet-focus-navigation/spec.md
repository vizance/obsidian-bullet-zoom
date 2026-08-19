## ADDED Requirements

### Requirement: Resolve command names and icons from the registry

The plugin SHALL resolve command names and icons from Obsidian's command registries, which list every registered command regardless of whether it can run at this moment, and SHALL fall back to the context-filtered command listing only when the registries are unavailable. Entries SHALL be de-duplicated by id, keeping the first, and an entry with no name SHALL fall back to its id. A registry that is missing, malformed, or that throws SHALL yield no entries rather than an error. The plugin SHALL remember the last catalog that contained entries and use it when a later read returns nothing, so the menu never loses its names and icons. Both the bullet menu and the slot pickers in settings SHALL use this catalog.

#### Scenario: The menu keeps its icons without an active editor

- **WHEN** the bullet menu opens while no editor command can currently run
- **THEN** every slot still shows its command's name and icon

##### Example: Registries win over the listing

- **GIVEN** a registry holding an editor command and a listing that returns nothing
- **WHEN** the catalog is read
- **THEN** the editor command is present with its icon

#### Scenario: The listing is a fallback

- **WHEN** the registries are absent
- **THEN** the catalog is built from the command listing

##### Example: Listing only

- **GIVEN** only a listing that returns one command
- **WHEN** the catalog is read
- **THEN** that command is the single entry

#### Scenario: A broken registry is survivable

- **WHEN** the registry is missing, holds the wrong shape, or throws while listing
- **THEN** the catalog is empty and nothing is thrown

##### Example: Hostile input

- **GIVEN** a registry whose `commands` value is a number
- **WHEN** the catalog is read
- **THEN** the result is empty
