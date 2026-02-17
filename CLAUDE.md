# Claude Git - Plugin Configuration

> **Version:** 0.6.3 | **Last Updated:** 2026-02-17

---

## Project Overview

**Claude Git** is a comprehensive Git automation plugin for Claude Code implementing **Versioned Release Convention** with intelligent commit management, auto-releases, and cross-platform hooks.

---

## Quick Start

```bash
npm install
```

When installed from marketplace, the plugin:
- Starts MCP server for git operations
- Provides git flow automation skills
- Web interface starts on-demand when needed

---

## Versioned Release Convention

### Format

```
TYPE: PROJECT NAME - vVERSION

[optional body with bullet points]
```

### Commit Types

| Type | Description | SemVer Bump |
|-------|-------------|---------------|
| **RELEASE** | Major release - Breaking changes | MAJOR |
| **UPDATE** | Minor update - New features | MINOR |
| **PATCH** | Patch - Bug fixes, improvements | PATCH |

### Examples

```
RELEASE: Git Flow Master - v2.0.0

- Breaking: Redesigned commit message format
- Breaking: Changed hook configuration structure
- Added: New amend workflow for small fixes

UPDATE: Git Flow Master - v1.1.0

- Added: Web interface for repository management
- Added: Version suggestion API endpoint

PATCH: Git Flow Master - v1.0.1

- Fixed: Pre-commit hook secret scanning pattern
- Fixed: Commit message validation edge case
```

---

## MCP Tools Available

| Tool | Description |
|--------|-------------|
| `git_versioned_commit` | Create commits with RELEASE/UPDATE/PATCH format |
| `git_amend_commit` | Amend last commit (keeps same version) |
| `git_suggest_version` | Get suggested version numbers |
| `git_get_last_commit` | Get last commit details |
| `git_validate_message` | Validate commit message format |
| `git_get_status` | Repository status |
| `git_create_release` | Create release with tag |
| `git_install_hooks` | Install Git hooks |
| `git_analyze_commits` | Analyze for version bump |

---

## Web Interface

Access at **http://localhost:3747**

### Features
- Repository overview and tracking
- Hook management (enable/disable per repo)
- Convention editor for customization
- Live commit monitoring
- Version suggestions

---

## Skills

| Skill | Description |
|--------|-------------|
| `/versioned-commit` | Create versioned commit |
| `/amend-commit` | Amend last commit |
| `/suggest-version` | Get version suggestions |
| `/auto-release` | Create release from commits |
| `/fix-conflict` | Resolve merge conflicts |

---

## Project Structure

```
claude-git/
├── plugins/
│   └── git-master/
│       ├── .claude-plugin/
│       ├── agents/
│       ├── skills/
│       ├── hooks/          # Git hooks (cross-platform)
│       ├── mcp/            # MCP server
│       └── web/            # Web interface
├── CLAUDE.md             # This file
├── README.md             # User documentation
└── CHANGELOG.md          # Version history
```

---

## Requirements

- **Node.js:** >= 18.0.0
- **Git:** >= 2.0.0
- **Claude Code:** Latest version

---

## License

MIT © Yanis
