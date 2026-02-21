# Aureus - Web Interface

Local web interface for managing Git conventions, hooks, and repositories.

## Features

- 🎛️ **Web Dashboard** - Beautiful interface to manage all your repositories
- 🔄 **Dynamic Hooks** - Enable/disable hooks per repository
- 📝 **Convention Editor** - Customize commit types, scopes, and rules
- 📊 **Live Monitoring** - Real-time commit tracking and compliance
- 🔍 **Repository Scanner** - Auto-discover Git repositories
- ✏️ **Commit Composer** - Create conventional commits visually

## Quick Start

### 1. Install Dependencies

```bash
cd web
npm install
```

### 2. Start the Server

```bash
npm start
```

### 3. Open the Interface

Navigate to:
```
http://localhost:3747
```

## Usage

### Dashboard

Shows:
- Total repositories tracked
- Active hooks count
- Recent commits with convention compliance
- Quick actions

### Repositories

- **Scan** - Search directories for Git repositories
- **View** - See repository details (branch, commits, tags)
- **Enable/Disable Hooks** - Toggle Git hooks per repository

### Conventions

Customize:
- Commit types (feat, fix, docs, etc.)
- Scope patterns (automatic from file paths)
- Validation rules (min/max length)

### Config

Edit settings:
- Branch names (main, develop)
- Pre-commit hooks (lint, typecheck, tests, secret scan)
- Release settings (changelog, tag format)

## API Endpoints

### Config
- `GET /api/config` - Get current configuration
- `PUT /api/config` - Update configuration

### State
- `GET /api/state` - Get application state
- `PUT /api/state` - Update state

### Repositories
- `GET /api/scan?dir=<path>&depth=<n>` - Scan for repositories
- `GET /api/repo?path=<path>` - Get repository details
- `POST /api/repo/hooks/install` - Install Git hooks
- `POST /api/repo/hooks/uninstall` - Uninstall Git hooks
- `POST /api/repo/commit` - Create commit

### Utilities
- `POST /api/validate/message` - Validate commit message
- `GET /api/suggest/types` - Get commit type suggestions

## Data Storage

All data is stored in `~/.git-flow-master/`:

```
~/.git-flow-master/
├── config.json      # Your conventions
├── state.json       # Tracked repositories
└── hooks/          # Hook templates
```

## Hooks

### Pre-Commit Hook
- Secret scanning
- Linting
- Type checking
- Tests

### Commit Message Hook
- Conventional Commits validation
- Type checking
- Line length limits

### Post-Release Hook
- CHANGELOG generation
- GitHub release creation
- Notifications

## Configuration File

Example `.git-flow-config.json`:

```json
{
  "commit": {
    "types": {
      "feat": { "emoji": "✨", "semverBump": "MINOR" },
      "fix": { "emoji": "🐛", "semverBump": "PATCH" }
    },
    "scopes": {
      "src/features/*": "features",
      "src/lib/*": "lib"
    }
  },
  "hooks": {
    "preCommit": {
      "lint": true,
      "typecheck": true,
      "test": false
    }
  }
}
```

## Keyboard Shortcuts (Coming Soon)

- `Ctrl+N` - New commit
- `Ctrl+S` - Scan repositories
- `Ctrl+,` - Open settings

## Troubleshooting

### Server won't start
- Check if port 3747 is available
- Ensure Node.js 18+ is installed

### Hooks not working
- Make sure hooks have execute permissions: `chmod +x .git/hooks/*`
- Check hook shebang: `#!/bin/bash`

### Repository not found
- Use full path when scanning
- Check directory permissions

## Development

```bash
# Watch mode (auto-reload on changes)
npm run dev
```

## Integration with Claude Code

The web interface works alongside the Claude Code skill:

1. Use **Claude Code** for daily operations (`/smart-commit`, `/auto-release`)
2. Use **Web Interface** for configuration and management

## License

MIT © Yanis
