# Aureus

> **Version:** 0.5.0
> **Advanced Git automation with Versioned Release Convention, smart releases, and conflict resolution**

---

## Features

### Smart Versioned Commits
- Auto-generate Versioned Release Convention messages (RELEASE/UPDATE/PATCH)
- Remote state checking before committing
- Version suggestions from API
- Pre-commit validations (lint, typecheck, secret scan)

### Amend Workflow
- Small fixes without version bumps
- Safety checks for pushed commits
- Keep same version, add to body

### Auto Release
- Automatic SemVer versioning (MAJOR.MINOR.PATCH)
- CHANGELOG generation from commit history
- Git tag creation with release notes
- Version file updates (package.json, etc.)

### Conflict Fixer
- Strategy-based conflict resolution
- Auto-merge for safe files (package.json, README.md)
- Interactive guidance for code conflicts

### PR Manager
- Pull request creation from feature branch
- Versioned Release Convention title generation
- Auto-labeling based on commit types

### Web Interface
- Local HTTP server for visual management at http://localhost:3747
- Dashboard with repository overview
- Dynamic hook management (enable/disable per repo)
- Convention editor
- Live commit monitoring

### MCP Server
- Native Claude Code integration via Model Context Protocol
- 18+ Git tools available directly in Claude Code
- Resources for config, state, and conventions

---

## Quick Start

### 1. Install from Marketplace

```bash
# In Claude Code
/install-plugin claude-git
```

The web interface **starts automatically** at http://localhost:3747

### 2. Configure via Web Interface

1. Open **http://localhost:3747**
2. Go to **Repositories** → Click **Scan Repositories**
3. Click **Enable Hooks** on each repository

### 3. Use the Skills

```
/versioned-commit    → Create versioned commit
/amend-commit        → Amend last commit (keeps version)
/auto-release        → Create release with CHANGELOG
/fix-conflict        → Resolve merge conflicts
/create-pr           → Create pull request
/suggest-version     → Get version suggestions
```

---

## Versioned Release Convention

### Format

```
TYPE: PROJECT NAME - vVERSION

[optional body with changes]
```

### Commit Types

| Type | Description | SemVer Bump | Example |
|------|-------------|-------------|---------|
| **RELEASE** | Major release - Breaking changes | MAJOR | `RELEASE: My Project - v2.0.0` |
| **UPDATE** | Minor update - New features | MINOR | `UPDATE: My Project - v1.1.0` |
| **PATCH** | Patch - Bug fixes, improvements | PATCH | `PATCH: My Project - v1.0.1` |

### Examples

```
RELEASE: Aureus - v2.0.0

- Breaking: Redesigned commit message format
- Breaking: Changed hook configuration structure
- Added: New amend workflow for small fixes
- Added: PowerShell hooks for Windows support

UPDATE: Aureus - v1.1.0

- Added: Web interface for repository management
- Added: Version suggestion API endpoint
- Improved: Hook installation for Windows
- Fixed: Configuration loading edge cases

PATCH: Aureus - v1.0.1

- Fixed: Pre-commit hook secret scanning pattern
- Fixed: Commit message validation edge case
- Updated: Documentation for Versioned Release Convention
```

---

## Amend Workflow

For small fixes to an existing release, **amend** instead of creating a new version:

```
User: Amend the commit with a small fix
```

Result:
```
PATCH: My Project - v1.0.1

- Fixed: Pre-commit hook pattern
- Fixed: Additional edge case  ← Added via amend
```

### When to Amend vs New Commit

| Scenario | Action |
|----------|--------|
| Fix typo or small bug | Amend (keep version) |
| Add missing file to commit | Amend (keep version) |
| New feature completed | New commit (bump version) |
| Multiple bug fixes | New commit (PATCH) |

---

## MCP Tools

| Category | Tools |
|----------|-------|
| **Commit** | `git_versioned_commit`, `git_amend_commit`, `git_suggest_version` |
| **Validation** | `git_validate_message`, `git_generate_message` |
| **Repository** | `git_get_status`, `git_get_log`, `git_get_branch`, `git_get_diff` |
| **Release** | `git_create_release`, `git_get_tags` |
| **Config** | `git_get_config`, `git_update_config` |
| **Hooks** | `git_install_hooks`, `git_uninstall_hooks`, `git_get_tracked_repos` |
| **Analysis** | `git_analyze_commits`, `git_suggest_type`, `git_get_last_commit` |

---

## Git Hooks

### Pre-Commit Hook
- Secret scanning (API keys, passwords, tokens)
- Linting (ESLint, Prettier, Clippy)
- Type checking (TypeScript, Mypy, Cargo)
- Tests (optional, Vitest, Jest, Pytest)

### Commit Message Hook
- Validates Versioned Release Convention format
- Checks type validity (RELEASE/UPDATE/PATCH)
- Enforces version format (vX.Y.Z)
- Line length limits

### Cross-Platform Support
- **Unix**: `.sh` scripts with execute permissions
- **Windows**: `.ps1` PowerShell scripts with batch wrappers

---

## Configuration

Create `.git-flow-config.json` in your project root:

```json
{
  "project": {
    "name": "My Project",
    "defaultBranch": "main"
  },
  "commit": {
    "types": {
      "RELEASE": "Major release - Breaking changes",
      "UPDATE": "Minor update - New features",
      "PATCH": "Patch - Bug fixes and improvements"
    },
    "rules": {
      "subjectMaxLength": 100,
      "requireVersion": true,
      "requireProjectName": true
    }
  },
  "release": {
    "bumpMajor": ["RELEASE"],
    "bumpMinor": ["UPDATE"],
    "bumpPatch": ["PATCH"],
    "changelogFile": "CHANGELOG.md"
  },
  "hooks": {
    "preCommit": {
      "lint": true,
      "typecheck": true,
      "test": false,
      "secretScan": true
    },
    "commitMsg": {
      "validate": true,
      "allowAmend": true
    }
  }
}
```

---

## Semantic Versioning Rules

- **MAJOR** (X.0.0): Any `RELEASE:` commits, breaking changes
- **MINOR** (0.X.0): Any `UPDATE:` commits (new features)
- **PATCH** (0.0.X): Any `PATCH:` commits (bug fixes, improvements)

---

## Branch Naming Convention

```
feature/    - New features
fix/        - Bug fixes
hotfix/     - Production hotfixes
release/    - Release preparation
docs/       - Documentation
refactor/   - Refactoring
```

---

## Usage Examples

### Versioned Commit

```bash
git add src/auth/login.ts
/versioned-commit
```

**Output:**
```
Analyzing changes...

Staged files:
  M src/auth/login.ts (+15, -3)

Version suggestions:
  RELEASE: v2.0.0 (for breaking changes)
  UPDATE:  v1.1.0 (for new features)
  PATCH:   v1.0.1 (for bug fixes)

Generated: UPDATE: My Project - v1.1.0

- Added: Email validation
- Improved: Error messages

Commit? [Y/n] Y
Committed: UPDATE: My Project - v1.1.0
```

### Auto Release

```bash
/auto-release
```

**Output:**
```
Analyzing commits since v1.2.3...

Found 5 commits:
  UPDATE: My Project - v1.3.0-rc1
  PATCH: My Project - v1.2.4-rc1

Version bump: MINOR (1.2.3 → 1.3.0)

Generated CHANGELOG:
  ## [1.3.0] - 2025-02-11

  ### Features
  - UPDATE: Added new feature

  ### Bug Fixes
  - PATCH: Fixed issue

Create release? [Y/n] Y
Release v1.3.0 created
```

---

## Integration

### Git Aliases

```bash
git config --global alias.vc '!claude-code /versioned-commit'
git config --global alias.amend '!claude-code /amend-commit'
git config --global alias.release '!claude-code /auto-release'
```

### VS Code Keybindings

```json
[
  { "key": "ctrl+alt+c", "command": "git-flow-master.versionedCommit" },
  { "key": "ctrl+alt+a", "command": "git-flow-master.amendCommit" },
  { "key": "ctrl+alt+r", "command": "git-flow-master.autoRelease" }
]
```

---

## Resources

- [Semantic Versioning](https://semver.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)

---

## License

MIT
