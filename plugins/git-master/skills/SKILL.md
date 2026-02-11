# Git Flow Master - Skill

> Advanced Git automation with Versioned Release Convention, smart releases, and conflict resolution

---

## Overview

This skill provides comprehensive Git workflow automation:
- **Versioned Commit** - Auto-generate Versioned Release Convention messages
- **Auto Release** - SemVer versioning with CHANGELOG
- **Amend Workflow** - Small fixes without version bumps
- **Conflict Fixer** - Intelligent merge conflict resolution
- **PR Manager** - Pull request creation and management

---

## Web Interface

**The web interface starts automatically with Claude Code.**

- **URL:** http://localhost:3747
- **API:** http://localhost:3747/api

### Features
- Dashboard with repository overview
- Dynamic hook management (enable/disable per repo)
- Convention editor (customize types, rules)
- Live commit monitoring and compliance tracking
- Repository auto-discovery and tracking

### API Integration

Before operations, fetch context from the web API:

```bash
# Get configuration
curl http://localhost:3747/api/config

# Get tracked repositories
curl http://localhost:3747/api/state

# Get repository details
curl "http://localhost:3747/api/repo?path=/path/to/repo"

# Get version suggestions
curl "http://localhost:3747/api/suggest/version?path=/path/to/repo"
```

Use this context to respect user preferences and custom conventions.

---

## Commands

### /versioned-commit

Analyze changes and generate a Versioned Release Convention commit message.

**Usage:**
```bash
/versioned-commit
```

**What it does:**
1. Checks git status (staged files)
2. Checks remote state (warns if behind)
3. Gets version suggestions from web API
4. Analyzes diff for type (RELEASE/UPDATE/PATCH)
5. Generates commit message with version
6. Runs pre-commit validations
7. Executes commit with confirmation

**Example:**
```
/versioned-commit

Analyzing changes...

Staged files:
  M src/features/auth/actions/login.ts (+12, -3)
  M src/features/auth/components/LoginForm.tsx (+5, -1)

Remote status: Clean (up to date with origin/main)

Version suggestions:
  RELEASE: v2.0.0 (for breaking changes)
  UPDATE:  v1.1.0 (for new features)
  PATCH:   v1.0.1 (for bug fixes)

Analyzing changes...
  Type: UPDATE (new feature)
  Scope: auth
  Breaking: no

Generated message:
  UPDATE: Git Flow Master - v1.1.0

  - Added: Email format validation
  - Added: Password strength requirements
  - Improved: Error messages

Commit? [Y/n/q] Y

Committed: UPDATE: Git Flow Master - v1.1.0
  SHA: a1b2c3d4

Push to origin? [Y/n] Y
Pushed to origin/main
```

---

### /amend-commit

Amend the last commit (keeps same version, adds to body).

**Usage:**
```bash
/amend-commit
```

**When to use:**
- Fix typo or small bug in just-committed code
- Add missing file to commit
- Small additions to existing release

**Example:**
```
/amend-commit

Last commit:
  PATCH: Git Flow Master - v1.0.1

  - Fixed: Pre-commit hook pattern

Staged changes:
  M hooks/pre-commit.ps1 (+3, -1)

Amendment:
  - Fixed: Additional edge case

Amended commit:
  PATCH: Git Flow Master - v1.0.1

  - Fixed: Pre-commit hook pattern
  - Fixed: Additional edge case

Amend? [Y/n/q] Y

Amended: PATCH: Git Flow Master - v1.0.1
```

**Safety check:**
- Warns if commit is already pushed to remote
- Asks for confirmation before amending pushed commits

---

### /auto-release

Analyze commits since last tag and create a release.

**Usage:**
```bash
/auto-release [type]
```

**Types:**
- `major` - Force MAJOR bump (RELEASE commits)
- `minor` - Force MINOR bump (UPDATE commits)
- `patch` - Force PATCH bump (PATCH commits)
- (no arg) - Auto-detect from commits

**Example:**
```
/auto-release

Analyzing commits since v1.2.3...

Found 8 commits:
  RELEASE: Git Flow Master - v2.0.0-rc1
  UPDATE: Git Flow Master - v1.3.0-rc1
  UPDATE: Git Flow Master - v1.3.0-rc2
  PATCH: Git Flow Master - v1.2.4-rc1
  UPDATE: Git Flow Master - v1.3.0-rc3
  PATCH: Git Flow Master - v1.2.4-rc2
  PATCH: Git Flow Master - v1.2.4-rc3
  UPDATE: Git Flow Master - v1.3.0-rc4

Categorization:
  RELEASE: 1  -> MAJOR bump
  UPDATE: 4   -> included in MAJOR
  PATCH: 3    -> included in MAJOR

Recommended bump: MAJOR (1.2.3 -> 2.0.0)

Current version: 1.2.3
Next version: [2.0.0] (or enter custom):

Generated CHANGELOG:

  ## [2.0.0] - 2025-02-11

  ### Breaking Changes
  - RELEASE: Redesigned commit message format
  - RELEASE: Changed hook configuration structure

  ### Features
  - UPDATE: Added web interface for repository management
  - UPDATE: Added version suggestion API endpoint
  - UPDATE: Improved hook installation for Windows
  - UPDATE: Added PowerShell hooks support

  ### Bug Fixes
  - PATCH: Fixed pre-commit hook secret scanning pattern
  - PATCH: Fixed commit message validation edge case
  - PATCH: Updated documentation for Versioned Release Convention

Create release? [Y/n/q] Y

Updated package.json: 1.2.3 -> 2.0.0
Updated CHANGELOG.md
Committed: RELEASE: Git Flow Master - v2.0.0
Created tag: v2.0.0
Pushed to origin/main
Pushed tag to origin
```

---

### /fix-conflict

Resolve merge conflicts intelligently.

**Usage:**
```bash
/fix-conflict
```

**Example:**
```
/fix-conflict

Detecting conflicts...

Found 3 conflicted files:
  package.json (auto-mergeable)
  README.md (auto-mergeable)
  src/features/auth/actions/login.ts (interactive)

[1/3] Resolving package.json...
Strategy: Union merge (keep both dependencies)

  Current deps:
    - next@16.0.0
    - react@19.2.0

  Incoming deps:
    - next@16.0.0
    - zod@4.0.0

  Merged:
    - next@16.0.0
    - react@19.2.0
    - zod@4.0.0

Auto-merged package.json

[2/3] Resolving README.md...
Strategy: Combine sections

Auto-merged README.md

[3/3] Resolving src/features/auth/actions/login.ts...

Conflict detected:
  <<<<<<< HEAD
  export async function login(email: string, password: string) {
    const user = await db.user.findUnique({ where: { email } })
  =======
  export async function login(email: string, password: string) {
    const hashed = hash(password)
    const user = await db.user.findUnique({ where: { email } })
  >>>>>>> feature/auth

Choose resolution:
  [1] Keep current (HEAD)
  [2] Keep incoming (feature/auth)
  [3] Manual edit
  [4] View full diff

Choice: 2

Resolved with incoming changes

All conflicts resolved!
Stage and complete merge? [Y/n/q] Y

Staged resolved files
Merge completed: Merge branch 'feature/auth'
```

---

### /create-pr

Create a pull request with Versioned Release Convention title.

**Usage:**
```bash
/create-pr [base-branch]
```

**Example:**
```
/create-pr main

Analyzing feature branch...

Branch: feature/user-auth
Base: main
Commits: 5

Last 3 commits:
  UPDATE: My Project - v1.1.0
  - Added: Login form component
  - Added: Authentication logic

  UPDATE: My Project - v1.1.0
  - Added: Session management

  PATCH: My Project - v1.0.1
  - Fixed: Auth validation

Recommended PR title:
  UPDATE: User Authentication - v1.1.0

Generated description:

  ## Summary
  Implements complete user authentication system with login form and
  authentication logic.

  ## Changes
  - Added login form component with validation
  - Implemented authentication server action
  - Added session management
  - Created integration tests

  ## Type
  - [ ] RELEASE (Breaking)
  - [x] UPDATE (Feature)
  - [ ] PATCH (Fix)

  ## Testing
  - [x] Unit tests added
  - [x] Integration tests added
  - [ ] E2E tests added

  ## Checklist
  - [x] Code follows style guidelines
  - [x] Self-review completed
  - [x] Documentation updated
  - [x] No new warnings

Create PR? [Y/n/q] Y

PR created: https://github.com/user/repo/pull/42
  Title: UPDATE: User Authentication - v1.1.0
```

---

### /suggest-version

Get version suggestions based on last tag.

**Usage:**
```bash
/suggest-version
```

**Example:**
```
/suggest-version

Current version: v1.2.3

Suggestions:
  RELEASE: v2.0.0 (for breaking changes)
  UPDATE:  v1.3.0 (for new features)
  PATCH:   v1.2.4 (for bug fixes)
```

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
    "changelogFile": "CHANGELOG.md",
    "versionFiles": [
      "package.json",
      "package-lock.json"
    ]
  },
  "pr": {
    "baseBranch": "main",
    "template": ".github/PULL_REQUEST_TEMPLATE.md"
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

## Hooks

The skill automatically sets up Git hooks:

### Pre-Commit Hook
```bash
.git/hooks/pre-commit     # Unix
.git/hooks/pre-commit     # Windows (calls .ps1)
.git/hooks/pre-commit.ps1 # Windows PowerShell
```
- Secret scanning
- Linting
- Type checking
- Tests (optional)

### Commit Message Hook
```bash
.git/hooks/commit-msg     # Unix
.git/hooks/commit-msg     # Windows (calls .ps1)
.git/hooks/commit-msg.ps1 # Windows PowerShell
```
- Validates Versioned Release Convention format
- Checks type validity (RELEASE/UPDATE/PATCH)
- Enforces version format (vX.Y.Z)
- Enforces line length limits

### Post-Release Hook
```bash
.git/hooks/post-release   # Unix
.git/hooks/post-release.ps1 # Windows PowerShell
```
- Updates CHANGELOG.md
- Notifies about push requirements

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
- Added: PowerShell hooks for Windows support

UPDATE: Git Flow Master - v1.1.0

- Added: Web interface for repository management
- Added: Version suggestion API endpoint
- Improved: Hook installation now supports Windows
- Fixed: Configuration loading edge cases

PATCH: Git Flow Master - v1.0.1

- Fixed: Pre-commit hook secret scanning pattern
- Fixed: Commit message validation edge case
- Updated: Documentation for Versioned Release Convention
```

### SemVer Bumping Rules

- **MAJOR** (X.0.0): Any `RELEASE:` commits, breaking changes
- **MINOR** (0.X.0): Any `UPDATE:` commits (new features)
- **PATCH** (0.0.X): Any `PATCH:` commits (bug fixes, improvements)

---

## Amend Workflow

For small fixes to an existing release, **amend** instead of creating a new version:

```
# Keep same version, just add to the commit
PATCH: My Project - v1.0.1

- Fixed: Typo in error message
- Added: Missing validation check
```

### When to Amend vs New Commit

| Scenario | Action |
|----------|--------|
| Fix typo or small bug | Amend (keep version) |
| Add missing file to commit | Amend (keep version) |
| New feature completed | New commit (bump version) |
| Multiple bug fixes | New commit (PATCH) |

---

## Integration

### Git Aliases

```bash
git config --global alias.vc '!claude-code /versioned-commit'
git config --global alias.amend '!claude-code /amend-commit'
git config --global alias.release '!claude-code /auto-release'
git config --global alias.fix '!claude-code /fix-conflict'
git config --global alias.pr '!claude-code /create-pr'
```

### VS Code Keybindings

```json
[
  {
    "key": "ctrl+alt+c",
    "command": "git-flow-master.versionedCommit"
  },
  {
    "key": "ctrl+alt+a",
    "command": "git-flow-master.amendCommit"
  },
  {
    "key": "ctrl+alt+r",
    "command": "git-flow-master.autoRelease"
  }
]
```

---

## See Also

- [Versioned Release Convention](./agents/system.md)
- [Semantic Versioning](https://semver.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
