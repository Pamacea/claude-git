# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.5.0] - 2025-02-11

### Added

#### Versioned Release Convention
- **NEW**: Complete replacement of Conventional Commits with Versioned Release Convention
- **NEW**: Three commit types: `RELEASE`, `UPDATE`, `PATCH`
- **NEW**: Format: `TYPE: PROJECT NAME - vX.Y.Z`
- **NEW**: Automatic SemVer bumping based on commit types

#### Amend Workflow
- **NEW**: `/amend-commit` skill for small fixes without version bumps
- **NEW**: Safety checks for pushed commits before amending
- **NEW**: Warning system when attempting to amend public history

#### Web Interface
- **NEW**: Dashboard at http://localhost:3747
- **NEW**: Repository tracking and management
- **NEW**: Hook management (enable/disable per repository)
- **NEW**: Convention editor for customization
- **NEW**: Live commit monitoring
- **NEW**: Version suggestion API endpoint

#### MCP Tools
- **NEW**: `git_versioned_commit` - Create commits with versioned format
- **NEW**: `git_amend_commit` - Amend last commit (keeps version)
- **NEW**: `git_suggest_version` - Get version suggestions
- **NEW**: `git_suggest_type` - Suggest commit type from changes
- **NEW**: `git_analyze_commits` - Analyze commits for version bump
- **NEW**: 14 additional MCP tools for git operations

#### Cross-Platform Hooks
- **NEW**: PowerShell hooks for Windows (`.ps1`)
- **NEW**: Batch wrappers for Git to call PowerShell hooks
- **NEW**: Automatic platform detection in web server
- **NEW**: Pre-commit hook with secret scanning
- **NEW**: Commit message validation for Versioned Release Convention
- **NEW**: Post-release hook for CHANGELOG updates

#### Auto-Start Integration
- **NEW**: SessionStart hook for automatic web interface startup
- **NEW**: PostToolUse hook for git operation cleanup
- **NEW**: Stop hook for graceful server shutdown

### Changed

- **BREAKING**: Replaced Conventional Commits with Versioned Release Convention
- **BREAKING**: Commit message format changed from `type(scope): message` to `TYPE: Project Name - vX.Y.Z`
- **IMPROVED**: Plugin configuration structure
- **IMPROVED**: Documentation structure and organization
- **IMPROVED**: Hook installation process with cross-platform support

### Security

- **FIXED**: Input validation in PowerShell hooks
- **FIXED**: Safe config parsing with size limits
- **FIXED**: Command injection prevention in hooks
- **FIXED**: Secret scanning patterns in pre-commit hook
- **FIXED**: Maximum message size limits (64KB)

### Documentation

- **NEW**: Complete README.md for root project
- **NEW**: CHANGELOG.md for version tracking
- **UPDATED**: agents/system.md with Versioned Release Convention
- **UPDATED**: skills/SKILL.md with new commands and format
- **UPDATED**: All examples to use RELEASE/UPDATE/PATCH format

---

## [0.4.0] - 2025-02-10

### Added

- Initial plugin structure
- Basic MCP server implementation
- Web interface foundation
- Git hook templates

### Changed

- Migrated from standalone scripts to plugin architecture

---

## [0.3.0] - 2025-02-09

### Added

- Pre-commit hook implementation
- Commit message validation
- Basic release workflow

---

## [0.2.0] - 2025-02-08

### Added

- Initial MCP tools
- Basic git operations

---

## [0.1.0] - 2025-02-07

### Added

- Initial project setup
- Basic plugin configuration

---

[0.5.0]: https://github.com/yanis/claude-git/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/yanis/claude-git/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/yanis/claude-git/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/yanis/claude-git/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/yanis/claude-git/releases/tag/v0.1.0
