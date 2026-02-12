# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.5.0] - 2025-02-12

### Added

#### Versioned Release Convention
- Complete implementation of Versioned Release Convention (VRC)
- Three commit types: RELEASE, UPDATE, PATCH
- Format: `TYPE: PROJECT NAME - vX.Y.Z`
- Automatic SemVer bumping based on commit type

#### Web Interface
- Dashboard at http://localhost:3747
- Repository tracking and management
- Hook management (enable/disable per repository)
- Convention editor for customization
- Live commit monitoring
- Version suggestion API endpoint

#### MCP Tools
- `git_versioned_commit` - Create versioned commits
- `git_amend_commit` - Amend last commit (keeps version)
- `git_suggest_version` - Get version suggestions
- `git_get_last_commit` - Get last commit details
- `git_validate_message` - Validate commit format
- `git_get_status` - Repository status
- `git_create_release` - Create release with tag
- `git_install_hooks` - Install Git hooks
- `git_analyze_commits` - Analyze for version bump

#### Cross-Platform Hooks
- PowerShell hooks for Windows (.ps1)
- Bash hooks for Unix/Linux (.sh)
- Automatic platform detection
- Pre-commit hook with secret scanning
- Commit message validation for VRC format
- Post-release hook for CHANGELOG updates

#### Claude Code Integration
- SessionStart hook for automatic web server startup
- PostToolUse hook for git operation cleanup
- Stop hook for graceful server shutdown
- Skills: `/versioned-commit`, `/amend-commit`, `/suggest-version`
- Skill: `/auto-release`, `/fix-conflict`

### Fixed

#### Background Server
- Fixed: `isServerRunning()` deleted PID file even when server was running
- Fixed: Added Windows-compatible process checking using `tasklist` command
- Fixed: Prevents EADDRINUSE errors on SessionStart hook

### Security

- Input validation in PowerShell hooks
- Safe config parsing with size limits
- Command injection prevention in hooks
- Secret scanning patterns in pre-commit hook
- Maximum message size limits (64KB)

---

## Links

- **GitHub:** https://github.com/Pamacea/claude-git
- **Issues:** https://github.com/Pamacea/claude-git/issues
