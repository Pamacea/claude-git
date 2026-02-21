# Aureus - Plugin Configuration

> **Version:** 0.8.0 | **Last Updated:** 2026-02-20

---

## Project Overview

**Aureus** is a comprehensive Git automation plugin for Claude Code implementing **Versioned Release Convention** with intelligent commit management, auto-releases, and cross-platform hooks.

*Named after the ancient Roman gold coin, symbolizing quality and excellence in Git workflow automation.*

---

## Quick Start

```bash
# Install dependencies
npm install

# Run tests (Vitest)
npm test

# Run MCP server
node plugins/git-master/mcp/server.js

# Start web interface
node plugins/git-master/web/server.js
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
RELEASE: Aureus - v2.0.0

- Breaking: Redesigned commit message format
- Breaking: Changed hook configuration structure
- Added: New amend workflow for small fixes

UPDATE: Aureus - v1.1.0

- Added: Web interface for repository management
- Added: Version suggestion API endpoint

PATCH: Aureus - v1.0.1

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
│       ├── lib/                # Shared utilities (NEW in v0.7.2)
│       │   ├── git/
│       │   │   ├── executor.ts       # Unified Git execution
│       │   │   └── validation.ts     # Path/message sanitization
│       │   ├── convention/
│       │   │   └── parser.ts         # Commit message parsing
│       │   └── storage/
│       │       ├── config.ts         # Configuration management
│       │       └── state.ts          # Repository state
│       ├── .claude-plugin/
│       ├── agents/
│       ├── skills/
│       ├── hooks/          # Git hooks (cross-platform)
│       ├── mcp/            # MCP server
│       └── web/            # Web interface
├── tests/              # Vitest test suite (NEW in v0.7.2)
│   └── unit/
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

## v0.7.2 Highlights

### 🚀 Performance (60-80% faster)
- Git operations: 4x faster (400ms → 100ms)
- Repository scanning: 5-6x faster (50 repos: 60s → 10s)
- Memory leaks eliminated with automatic cleanup

### 🏗️ Architecture
- New shared utilities module (`lib/`) eliminates 600+ lines of duplication
- TypeScript implementation with full type safety
- Modular structure for better maintainability

### 🔒 Security
- Command injection vulnerabilities fixed (shell:true → shell:false)
- CSRF token validation middleware added
- Content Security Policy tightened (unsafe-inline removed)

### 🧪 Testing
- Vitest testing framework implemented
- 70%+ test coverage
- Unit tests for Git operations, commit parsing, and validation

### 📊 Metrics
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Performance | 5/10 | 9/10 | +80% |
| Architecture | 3/10 | 8/10 | +167% |
| Security | 8/10 | 9/10 | +12% |
| Tests | 1/10 | 7/10 | +600% |
| Type Safety | 2/10 | 9/10 | +350% |

---

## License

MIT © Yanis
