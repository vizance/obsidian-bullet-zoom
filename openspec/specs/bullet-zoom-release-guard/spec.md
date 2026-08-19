# bullet-zoom-release-guard Specification

## Purpose

Guard rails for publishing a release: the preflight command verifies that the working tree, the version files, and the `origin` remote all agree before a tag is created, so a build is never published from the wrong place.

## Requirements

### Requirement: The guard SHALL require and verify an explicit official repository

The release preflight command MUST require a repository path and a patch version argument. It SHALL normalize HTTPS and SSH GitHub remote forms and SHALL accept only the repository identity `github.com/vizance/obsidian-bullet-zoom` from the `origin` remote.

#### Scenario: Valid official repository arguments pass identity validation

- **WHEN** the operator runs the guard with an existing repository path, a valid patch version, and an `origin` remote resolving to `github.com/vizance/obsidian-bullet-zoom`
- **THEN** the identity check passes and the guard continues to checkout validation

#### Scenario: The chi_agent repository is rejected

- **WHEN** the operator runs the guard against a repository whose `origin` remote resolves to `github.com/vizance/chi_agent`
- **THEN** the guard exits with validation failure and reports the expected official repository and the observed remote identity

#### Scenario: Missing arguments produce a usage failure

- **WHEN** the operator omits `--repo`, `--version`, or supplies a version that is not in `x.y.z` patch format
- **THEN** the guard exits with usage code `2` and reports the required command shape

---
### Requirement: The guard SHALL require a release-ready main checkout

The guard MUST require a clean Git worktree, the `main` branch, and a `HEAD` commit equal to `origin/main`. The guard SHALL perform these checks without modifying the repository.

#### Scenario: A clean main checkout at origin main passes

- **WHEN** the official repository has no porcelain status output, the current branch is `main`, and `HEAD` equals `origin/main`
- **THEN** the checkout check passes and the guard continues to release metadata validation

#### Scenario: A dirty or non-main checkout is rejected

- **WHEN** the repository has uncommitted changes or the current branch is not `main`
- **THEN** the guard exits with validation failure and identifies the checkout condition that failed

#### Scenario: An unmerged commit is rejected

- **WHEN** the current `HEAD` differs from `origin/main`
- **THEN** the guard exits with validation failure and reports both commit identifiers

---
### Requirement: The guard SHALL validate release metadata and assets

The requested version MUST match the version in `manifest.json`, `package.json`, `package-lock.json`, and `package-lock.json.packages[""]`. The corresponding `versions.json` entry MUST equal `manifest.minAppVersion`. The repository MUST contain regular files named `main.js`, `manifest.json`, and `styles.css`.

#### Scenario: Consistent metadata and assets pass

- **WHEN** all required version fields equal the requested version, the `versions.json` entry matches the manifest minimum app version, and all three assets exist as regular files
- **THEN** the metadata and asset check passes

#### Scenario: A stale package version is rejected

- **WHEN** any required package version field differs from the requested version
- **THEN** the guard exits with validation failure and reports the mismatched file or field

#### Scenario: A release asset is missing

- **WHEN** `main.js`, `manifest.json`, or `styles.css` is absent or is not a regular file
- **THEN** the guard exits with validation failure and names the missing asset

---
### Requirement: The guard SHALL prevent duplicate release tags

The requested version tag and its `v`-prefixed equivalent MUST be absent both locally and on the `origin` remote.

#### Scenario: No matching tags exist

- **WHEN** neither the plain nor `v`-prefixed tag exists locally or on `origin`
- **THEN** the tag safety check passes

#### Scenario: An existing local tag is rejected

- **WHEN** either matching tag exists in the local repository
- **THEN** the guard exits with validation failure and names the existing tag

#### Scenario: An existing remote tag is rejected

- **WHEN** either matching tag exists on the `origin` remote
- **THEN** the guard exits with validation failure and names the existing remote tag

---
### Requirement: The guard SHALL provide an auditable result without mutating release state

A successful invocation MUST exit with code `0` and print the normalized repository URL, requested version, target commit, release URL, and asset names. A validation failure MUST exit with code `1` and identify the failed check. The command MUST NOT create, modify, push, or delete repository files, tags, or releases.

#### Scenario: Successful preflight output is actionable

- **WHEN** every required check passes for version `0.1.30`
- **THEN** the command exits with code `0` and prints `vizance/obsidian-bullet-zoom`, `0.1.30`, the target commit, the release URL, and `main.js`, `manifest.json`, and `styles.css`

#### Scenario: A validation failure is safe to rerun

- **WHEN** any required check fails
- **THEN** the command exits with code `1`, prints the failed check, and leaves the worktree, tags, and remote release state unchanged
