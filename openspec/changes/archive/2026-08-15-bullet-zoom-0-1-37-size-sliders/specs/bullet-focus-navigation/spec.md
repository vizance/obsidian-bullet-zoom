## ADDED Requirements

### Requirement: Provide size sliders for the focus title and the outline

The plugin SHALL provide a settings tab with two sliders — focus title scale and outline scale — each an integer percentage from 60 to 160 with step 5 and default 100, persisted via plugin data. Changing a slider SHALL apply immediately by writing the corresponding scale multipliers to custom properties `--bullet-zoom-title-scale` and `--bullet-zoom-outline-scale` on the document body, which the stylesheet multiplies into the focus root title font-size (desktop and phone variants) and the outline sidebar font-size. Loading settings SHALL normalize invalid values: non-numeric input falls back to the default and out-of-range numbers clamp to the range. Unloading the plugin SHALL remove both custom properties.

#### Scenario: Adjust the title slider

- **WHEN** the user drags the focus title slider to 130
- **THEN** the plugin saves `titleScale` 130 and sets `--bullet-zoom-title-scale` to `1.3` on the document body

##### Example: Slider write-through

- **GIVEN** the settings tab is open with default values
- **WHEN** the title slider changes to `130`
- **THEN** the body style contains `--bullet-zoom-title-scale: 1.3` and the persisted data records `titleScale: 130`

#### Scenario: Normalize invalid persisted data

- **WHEN** the plugin loads persisted data containing a non-numeric or out-of-range scale
- **THEN** non-numeric values fall back to 100 and out-of-range numbers clamp into 60–160

##### Example: Normalization table

- **GIVEN** persisted data `{ "titleScale": "abc", "outlineScale": 300 }`
- **WHEN** settings are loaded
- **THEN** the effective values are `titleScale` 100 and `outlineScale` 160

#### Scenario: Stylesheet multiplies the scales

- **WHEN** the plugin stylesheet renders the focus root title and the outline sidebar
- **THEN** their font-size declarations multiply the base size by the corresponding scale custom property with a fallback of 1

##### Example: CSS contract

- **GIVEN** the plugin stylesheet is loaded
- **WHEN** its rules are inspected
- **THEN** the focus root title and phone title font-size values reference `--bullet-zoom-title-scale` and the outline sidebar font-size references `--bullet-zoom-outline-scale`

#### Scenario: Unload removes the overrides

- **WHEN** the plugin unloads
- **THEN** neither `--bullet-zoom-title-scale` nor `--bullet-zoom-outline-scale` remains on the document body

##### Example: Cleanup audit

- **GIVEN** a loaded plugin with both custom properties applied
- **WHEN** onunload runs
- **THEN** reading either property from the body style returns an empty string
