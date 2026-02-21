# Aureus - Scripts

This directory contains utility scripts for Aureus.

## Available Scripts

### start-background.js

Starts the web server in the background.

```bash
# Start server
node scripts/start-background.js start

# Stop server
node scripts/start-background.js stop

# Check status
node scripts/start-background.js status

# Restart server
node scripts/start-background.js restart
```

### install-hooks.js

Installs Git hooks for a repository (cross-platform).

```bash
# Install hooks
node scripts/install-hooks.js install /path/to/repo

# Uninstall hooks
node scripts/install-hooks.js uninstall /path/to/repo
```

### postinstall.js

Runs automatically after plugin installation.

- Creates data directory (`~/.git-flow-master/`)
- Creates default configuration
- Creates default state file
- Installs web dependencies

## Hook Scripts

Hooks are available in both Bash (`.sh`) and PowerShell (`.ps1`) formats:

- `pre-commit` - Runs before each commit (lint, typecheck, secret scan)
- `commit-msg` - Validates commit message format
- `post-release` - Runs after creating a release

## Platform Support

### Windows

Use PowerShell scripts:
```powershell
.\start-web.ps1
```

Or batch file:
```cmd
start-web.bat
```

### Linux/macOS

Use shell scripts:
```bash
./start-web.sh
```

## Automatic Server Management

The server starts automatically when Claude Code launches via the `SessionStart` hook, and stops when Claude Code exits via the `SessionEnd` hook.

To disable automatic start/stop, edit `plugin.json` and remove the hooks.
