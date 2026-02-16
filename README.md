# Claude Git - Git Flow Master Plugin

> **Version:** 0.6.1
> **Author:** Yanis
> **Category:** Version Control

---

## Overview

**Claude Git** is a comprehensive Git automation plugin for Claude Code that implements the **Versioned Release Convention** - a structured approach to commit messages and version management.

### Key Features

- **Versioned Release Convention** - Structured commit format: `TYPE: Project Name - vX.Y.Z`
- **Smart Commits** - Auto-generate versioned commit messages
- **Amend Workflow** - Small fixes without version bumps
- **Auto Releases** - SemVer versioning with CHANGELOG generation
- **Conflict Resolution** - Intelligent merge conflict handling
- **PR Management** - Pull requests with versioned titles
- **Web Interface** - Dashboard at http://localhost:3747
- **MCP Tools** - 18+ tools for git automation
- **Cross-Platform** - Windows PowerShell + Unix shell hooks

---

## Installation

### From Claude Code Marketplace

```bash
# In Claude Code
/install-plugin claude-git
```

### Manual Installation

```bash
git clone https://github.com/yanis/claude-git.git
cd claude-git
npm install
```

---

## Quick Start

### 1. Auto-Start on Session Begin

When installed from marketplace, the plugin automatically:
- Starts the web interface at http://localhost:3747
- Detects git repositories in your working directory
- Prompts to install pre-commit and commit-msg hooks

### 2. Create a Versioned Commit

```
User: Create a commit for the new authentication feature
```

The plugin will:
1. Analyze staged changes
2. Get version suggestions from API
3. Generate message: `UPDATE: My Project - v1.1.0`
4. Execute the commit

### 3. Use MCP Tools

```bash
# Get version suggestions
git_suggest_version

# Create versioned commit
git_versioned_commit --type UPDATE --project "My Project"

# Amend last commit (keeps version)
git_amend_commit

# Create release with tag
git_create_release --version 1.1.0
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
RELEASE: Git Flow Master - v2.0.0

- Breaking: Redesigned commit message format
- Breaking: Changed hook configuration structure
- Added: New amend workflow for small fixes

UPDATE: Git Flow Master - v1.1.0

- Added: Web interface for repository management
- Added: Version suggestion API endpoint
- Improved: Hook installation for Windows

PATCH: Git Flow Master - v1.0.1

- Fixed: Pre-commit hook secret scanning pattern
- Fixed: Commit message validation edge case
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

---

## Web Interface

Access the dashboard at **http://localhost:3747**

### Features
- Repository overview and tracking
- Hook management (enable/disable per repo)
- Convention editor
- Live commit monitoring
- Version suggestions

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/config` | Get configuration |
| `PUT /api/config` | Update configuration |
| `GET /api/state` | Get tracked repositories |
| `GET /api/suggest/version` | Get version suggestions |
| `POST /api/repo/hooks/install` | Install git hooks |
| `POST /api/repo/commit` | Create a commit |

---

## MCP Tools

All tools available via MCP protocol:

| Tool | Description |
|------|-------------|
| `git_versioned_commit` | Create versioned commit |
| `git_amend_commit` | Amend last commit |
| `git_suggest_version` | Get version suggestions |
| `git_get_last_commit` | Get last commit details |
| `git_validate_message` | Validate commit format |
| `git_generate_message` | Generate versioned message |
| `git_get_status` | Repository status |
| `git_get_log` | Commit history |
| `git_get_branch` | Branch information |
| `git_get_diff` | Staged/unstaged diff |
| `git_create_release` | Create release with tag |
| `git_get_tags` | List version tags |
| `git_install_hooks` | Install git hooks |
| `git_uninstall_hooks` | Uninstall git hooks |
| `git_analyze_commits` | Analyze for version bump |

---

## Git Hooks

### Pre-Commit Hook
- Secret scanning
- Linting
- Type checking
- Tests (optional)

### Commit Message Hook
- Validates Versioned Release Convention
- Checks type (RELEASE/UPDATE/PATCH)
- Enforces version format (vX.Y.Z)

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

## Skills

| Skill | Description |
|-------|-------------|
| `/versioned-commit` | Create versioned commit |
| `/amend-commit` | Amend last commit |
| `/auto-release` | Create release from commits |
| `/fix-conflict` | Resolve merge conflicts |
| `/create-pr` | Create PR with versioned title |
| `/suggest-version` | Get version suggestions |

---

## Requirements

- **Node.js**: >= 18.0.0
- **Git**: >= 2.0.0
- **Claude Code**: Latest version

---

## Project Structure

```
claude-git/
├── .claude-plugin/
│   └── marketplace.json       # Marketplace configuration
├── plugins/
│   └── git-master/
│       ├── .claude-plugin/
│       │   └── plugin.json    # Plugin configuration
│       ├── agents/
│       │   └── system.md      # Agent system prompt
│       ├── skills/
│       │   └── SKILL.md       # Skill documentation
│       ├── hooks/
│       │   ├── pre-commit.ps1
│       │   ├── commit-msg.ps1
│       │   ├── post-release.ps1
│       │   ├── start-background.js
│       │   └── ...
│       ├── mcp/
│       │   └── server.js      # MCP server
│       ├── web/
│       │   ├── server.js      # Web interface
│       │   └── public/
│       └── .git-flow-config.json
├── README.md
└── CHANGELOG.md
```

---

## License

MIT

---

## Links

- [Versioned Release Convention](./plugins/git-master/docs/GIT_CONVENTIONS.md)
- [Web Interface README](./plugins/git-master/web/README.md)
- [MCP Server README](./plugins/git-master/mcp/README.md)
- [Hooks README](./plugins/git-master/hooks/README.md)
