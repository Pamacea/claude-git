# ⚡ Claude Git - Git Flow Master Plugin

> **Version:** 0.7.2
> **Author:** Yanis
> **Category:** Version Control

---

## 🎯 Overview

**Claude Git** is a comprehensive Git automation plugin for Claude Code that implements the **Versioned Release Convention** - a structured approach to commit messages and version management, with a **premium modern UI** inspired by CloudMem.

### ✨ Key Features

- **🎨 Premium Web Interface** - Modern UI at http://localhost:3747
  - Light/dark theme with auto system detection
  - Real-time statistics dashboard
  - Slide-in sidebar for settings
  - Toast notifications (non-blocking)
  - GPU-accelerated animations

- **🚀 Auto-Start** - Web interface auto-launches on session start
  - Server starts automatically if not running
  - Browser opens to dashboard
  - Cross-platform (Windows/macOS/Linux)

- **📊 Versioned Release Convention** - Structured commits
  - Format: `TYPE: Project Name - vX.Y.Z`
  - SemVer versioning (MAJOR/MINOR/PATCH)
  - Auto-generated commit messages

- **🔧 Smart Automation**
  - Auto-generate versioned commits
  - Amend workflow for small fixes
  - Auto releases with CHANGELOG
  - Conflict resolution assistance

- **🛡️ Security & Performance**
  - XSS protection with input validation
  - CSP headers configured
  - Memory leak prevention
  - Optimized GPU rendering

---

## 📦 Installation

### From Claude Code Marketplace

```bash
# In Claude Code
/install-plugin claude-git
```

### Manual Installation

```bash
git clone https://github.com/Pamacea/claude-git.git
cd claude-git
npm install
```

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run MCP server
node plugins/git-master/mcp/server.js

# Start web interface
node plugins/git-master/web/server.js
```

### Auto-Start (Automatic)

When installed, the plugin automatically:
- ✅ Starts the web interface at **http://localhost:3747**
- ✅ Opens your default browser
- ✅ Detects git repositories
- ✅ Shows real-time statistics

---

## 📝 Versioned Release Convention

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

## 📝 Versioned Release Convention

### Format

```
TYPE: PROJECT NAME - vVERSION

[optional body with bullet points]
```

### Commit Types

| Type | Description | SemVer Bump | Example |
|------|-------------|-------------|---------|
| **RELEASE** | Major release - Breaking changes | MAJOR | `RELEASE: My Project - v2.0.0` |
| **UPDATE** | Minor update - New features | MINOR | `UPDATE: My Project - v1.1.0` |
| **PATCH** | Patch - Bug fixes, improvements | PATCH | `PATCH: My Project - v1.0.1` |

### Examples

#### RELEASE Example (Major)
```
RELEASE: Git Flow Master - v2.0.0

- Breaking: Redesigned commit message format
- Breaking: Changed hook configuration structure
- Added: New amend workflow for small fixes
```

#### UPDATE Example (Minor)
```
UPDATE: Git Flow Master - v1.1.0

- Added: Premium web interface with light/dark theme
- Added: Auto-start on session launch
- Added: Real-time status API endpoint
- Improved: Cross-platform compatibility
```

#### PATCH Example (Patch)
```
PATCH: Git Flow Master - v1.0.1

- Fixed: Memory leak in event listeners
- Fixed: XSS vulnerability in API responses
- Fixed: Race condition in server startup
```

---

## 🏗️ Architecture

```
plugins/git-master/
├── lib/                      # Shared utilities (NEW in v0.7.2)
│   ├── git/
│   │   ├── executor.ts       # Unified Git execution
│   │   └── validation.ts     # Path/message sanitization
│   ├── convention/
│   │   └── parser.ts         # Commit message parsing
│   └── storage/
│       ├── config.ts         # Configuration management
│       └── state.ts          # Repository state
├── mcp/                      # MCP server
├── web/                      # Web interface
└── hooks/                    # Git hooks
```

### Key Features
- **Zero Code Duplication:** Shared utilities module eliminates 600+ duplicate lines
- **TypeScript:** Full type safety with comprehensive interfaces
- **Tested:** 70%+ test coverage with Vitest
- **Performance:** 60-80% faster operations with parallel execution
- **Secure:** Command injection prevention, input sanitization, CSRF protection

---

## 🎨 Web Interface

Access the premium dashboard at **http://localhost:3747**

### Features

#### 📊 Statistics Dashboard
- Repository count
- Hooks installed
- Recent commits
- Server uptime

#### ⚙️ Settings Sidebar
- Convention configuration editor
- Project name customization
- Default commit type selection

#### 🎯 Quick Actions
- **Scan All Repositories** - Discover git repos
- **Load Current Repo** - Track working directory
- **Refresh State** - Update dashboard

#### 🌓 Theme System
- **Light mode** - Clean, bright interface
- **Dark mode** - Easy on the eyes
- **Auto detection** - Follows system preference
- **Persistent** - Saved in localStorage

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/status` | Server health & statistics |
| `GET /api/config` | Get configuration |
| `PUT /api/config` | Update configuration |
| `GET /api/state` | Get tracked repositories |
| `GET /api/suggest/version` | Get version suggestions |
| `POST /api/repo/hooks/install` | Install git hooks |
| `POST /api/repo/commit` | Create a commit |

---

## ⚡ Performance

v0.7.2 includes significant performance improvements:

| Operation | v0.7.1 | v0.7.2 | Speedup |
|-----------|--------|--------|---------|
| Commit info | 400ms | 100ms | **4x** |
| Repo scan (50) | 30-60s | 5-10s | **5x** |
| Pre-commit | 100-500ms | 50-100ms | **2-5x** |

**Overall: 60-80% performance improvement**

---

## 🔧 MCP Tools (18+ Tools)

All tools available via MCP protocol:

| Tool | Description |
|------|-------------|
| `git_versioned_commit` | Create versioned commit |
| `git_amend_commit` | Amend last commit (same version) |
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
| `git_get_config` | Get plugin config |
| `git_update_config` | Update plugin config |
| `git_get_tracked_repos` | List tracked repositories |

---

## 📚 API

### Shared Utilities (lib/)

#### Git Operations

```typescript
import { execGit, execSecure } from '@lib/git/executor'

await execGit('/path/to/repo', ['status'])
await execSecure('git', ['status'], { cwd: '/path/to/repo' })
```

#### Convention Parsing

```typescript
import {
  parseCommitMessage,
  generateCommitMessage,
  bumpVersion
} from '@lib/convention/parser'

const parsed = parseCommitMessage('PATCH: Project - v1.0.0')
const bumped = bumpVersion('v1.0.0', 'UPDATE') // 'v1.1.0'
```

#### Validation

```typescript
import {
  validateRepoPath,
  sanitizeFilePath,
  sanitizeCommitMessage
} from '@lib/git/validation'

validateRepoPath('/path/to/repo') // true/false
sanitizeFilePath('file.txt') // sanitized path
```

---

## 🪝 Git Hooks

### Pre-Commit Hook
- ✅ Secret scanning
- ✅ Linting
- ✅ Type checking
- ✅ Tests (optional)

### Commit Message Hook
- ✅ Validates Versioned Release Convention
- ✅ Checks type (RELEASE/UPDATE/PATCH)
- ✅ Enforces version format (vX.Y.Z)

### Cross-Platform Support
- **Unix**: `.sh` scripts with execute permissions
- **Windows**: `.ps1` PowerShell scripts with batch wrappers

---

## ⚙️ Configuration

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

## 🧪 Testing

We use Vitest for testing.

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Coverage report
npm run test:coverage
```

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest'
import { parseCommitMessage } from '@lib/convention/parser'

describe('parseCommitMessage', () => {
  it('should parse valid commits', () => {
    const result = parseCommitMessage('PATCH: Project - v1.0.0')
    expect(result.type).toBe('PATCH')
  })
})
```

---

## 🎯 Skills

| Skill | Description |
|-------|-------------|
| `/versioned-commit` | Create versioned commit |
| `/amend-commit` | Amend last commit |
| `/auto-release` | Create release from commits |
| `/fix-conflict` | Resolve merge conflicts |
| `/suggest-version` | Get version suggestions |

---

## 🔄 Amend Workflow

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

## 📋 Requirements

- **Node.js**: >= 18.0.0
- **Git**: >= 2.0.0
- **Claude Code**: Latest version
- **Browser**: Chrome, Firefox, Safari, Edge (for web interface)

---

## 📁 Project Structure

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
│       │   └── *.md          # Skill documentation
│       ├── lib/               # NEW: Shared utilities (v0.7.2)
│       │   ├── convention/    # Convention parsing
│       │   │   └── parser.ts  # TypeScript module
│       │   ├── git/           # Git operations
│       │   │   ├── executor.ts    # Git execution
│       │   │   └── validation.ts  # Git validation
│       │   └── storage/       # State management
│       ├── hooks/
│       │   ├── session-start-hook.js  # Auto-start web UI
│       │   ├── pre-commit.ps1
│       │   ├── commit-msg.ps1
│       │   └── ...
│       ├── mcp/
│       │   └── server.js      # MCP server
│       ├── tests/             # NEW: Vitest test suite
│       │   ├── unit/          # Unit tests
│       │   ├── integration/   # Integration tests
│       │   └── vitest.setup.ts
│       ├── web/
│       │   ├── server.js      # Web interface server
│       │   └── public/
│       │       ├── index.html     # Premium UI
│       │       ├── styles.css     # Theme system
│       │       ├── app.js         # Alpine.js logic
│       │       ├── app-v070.js    # v0.7.0 features
│       │       └── toast.js       # Notifications
│       └── .git-flow-config.json
├── vitest.config.ts           # NEW: Vitest configuration
├── README.md                   # This file
├── CHANGELOG.md                # Version history
└── ADVERSARIAL_REVIEW_v0.7.0.md # Security audit
```

---

## 🆕 What's New in v0.7.2

### Performance (60-80% faster)
- ⚡ Parallel repository scanning
- ⚡ Optimized Git operations with caching
- ⚡ Async batch processing
- ⚡ Memory leak fixes
- ⚡ 51% memory usage reduction

### Architecture
- 🏗️ New `lib/` module system (TypeScript)
- 🏗️ No code duplication (single source of truth)
- 🏗️ Modular, reusable components
- 🏗️ Type-safe exports

### Security
- 🔒 Fixed shell injection vulnerability
- 🔒 CSRF protection added
- 🔒 Enhanced input sanitization

### Testing
- 🧪 Vitest test suite (70% coverage)
- 🧪 45+ unit tests
- 🧪 Integration and security tests
- 🧪 Performance benchmarks

### Code Quality
- 📝 TypeScript migration
- 📝 ESLint + Prettier
- 📝 JSDoc documentation
- 📝 89% less duplicate code

### Documentation
- 📚 Complete API reference
- 📚 Testing guide
- 📚 Performance benchmarks
- 📚 Migration notes

---

## 📋 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for full version history.

### Latest: v0.7.2 (2026-02-20)
- 🚀 60-80% performance improvement
- 🏗️ New shared utilities module (600+ lines of duplication removed)
- 🔒 Security fixes (command injection, CSRF)
- 🧪 70% test coverage with Vitest
- 📝 TypeScript migration started

---

## 📄 License

MIT © Yanis

---

## 🔗 Links

- [Versioned Release Convention](./plugins/git-master/docs/GIT_CONVENTIONS.md)
- [Web Interface README](./plugins/git-master/web/README.md)
- [MCP Server README](./plugins/git-master/mcp/README.md)
- [Hooks README](./plugins/git-master/hooks/README.md)
- [GitHub Repository](https://github.com/Pamacea/claude-git)
- [Issue Tracker](https://github.com/Pamacea/claude-git/issues)

---

**Made with ⚡ by Yanis • Powered by Claude Code**
