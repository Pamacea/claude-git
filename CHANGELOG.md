# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.7.0] - 2026-02-20

### Added

#### 🎨 Premium UI (claude-mem -Inspired)
- **Complete UI Refactor**: Modern, clean interface inspired by CloudMem
- **Theme System**: Full light/dark theme support with automatic system preference detection
- **Theme Persistence**: User theme choice saved in localStorage
- **Sidebar Settings**: Slide-in sidebar for configuration and statistics
- **Status Dashboard**: Real-time statistics with animated cards (repos, hooks, commits, uptime)
- **GPU Acceleration**: Smooth animations with `will-change` and `transform3d`
- **Custom Scrollbars**: Styled scrollbars matching the theme
- **Responsive Design**: Optimized for desktop, tablet, and mobile

#### 🚀 Session Start Hook
- **Auto-Start Web Interface**: Server automatically starts on session launch
- **Auto-Open Browser**: Default browser opens to `http://localhost:3747`
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Smart Detection**: Checks if server is already running before starting

#### 📊 Status API
- **New Endpoint**: `GET /api/status` provides server health and statistics
- **Real-Time Status**: Live connection indicator (green dot when online)
- **Auto-Refresh**: Status updates every 30 seconds
- **Statistics Display**: Repository count, hooks installed, recent commits, server uptime

#### 🎯 UX Enhancements
- **Quick Actions**: One-click buttons for common operations (scan, load, refresh)
- **Project Selector**: Dropdown to filter by repository
- **Loading States**: Beautiful spinner animations during data loading
- **Micro-Interactions**: Button hover effects, card animations, status dot pulse
- **Keyboard Shortcuts**: `Escape` to close sidebar, click outside to dismiss

### Changed

#### UI Structure
- **Layout**: From basic grid to full-height flex layout with main column and sidebar
- **Typography**: System fonts with terminal font for code elements
- **Color System**: 100+ CSS variables for complete theme customization
- **Cards**: Slide-in animation with hover effects and shadows
- **Buttons**: Modern gradient effects on primary actions

#### Performance
- **CSS Variables**: Eliminated redundant color definitions
- **Transform Optimizations**: GPU-accelerated animations
- **Lazy Loading**: Ready for large repository lists (foundation laid)

### Technical Details

#### New Files
- `hooks/session-start-hook.js` - Automatic web interface launcher
- `web/public/app-v070.js` - Premium UI features (theme, sidebar, status)
- `web/public/index.html.backup` - Backup of previous UI
- `web/public/styles.css.backup` - Backup of previous styles

#### Modified Files
- `web/server.js` - Added `/api/status` endpoint
- `web/public/index.html` - Complete layout refactor
- `web/public/styles.css` - CloudMem-inspired theme system
- `package.json` - Version bumped to 0.7.0
- `.claude-plugin/plugin.json` - Added session-start-hook to hooks

#### Breaking Changes
- **None** - Fully backward compatible with existing API

#### Migration Guide
- No migration needed - existing configurations are preserved
- Theme preference is automatically detected and can be toggled
- Server auto-start can be disabled by removing the SessionStart hook

---

## [0.6.7] - 2026-02-17

### Fixed

#### Plugin Installation
- Fixed: Removed invalid `postinstall` key from plugin.json (not supported by Claude Code plugin schema)
- Added: Root package.json with npm postinstall script for automatic dependency installation
- Fixed: Plugin now installs correctly without validation errors

---

## [0.6.6] - 2026-02-17

### Fixed

#### Automatic Dependency Installation
- Added: `postinstall` script in plugin.json for automatic dependency installation
- Fixed: `install-dependencies.js` now installs both web AND MCP dependencies
- Improved: `start-background.js` uses shared install script for consistency
- Fixed: Windows process checking now uses `tasklist` instead of deprecated `wmic`

#### Impact
- Dependencies are now installed automatically when the plugin is loaded/updated
- MCP server starts correctly without manual `npm install`
- SessionStart hook no longer fails with dependency errors

---

## [0.6.5] - 2026-02-17

### Fixed

#### MCP Dependencies Installation
- Fixed: MCP server dependencies not installed during SessionStart hook
- Fixed: `start-background.js` now installs both web and MCP dependencies
- Added: `getMcpDir()` function to handle MCP directory path
- Updated: `areDependenciesInstalled()` to check `@modelcontextprotocol/sdk`
- Updated: `installDependencies()` to run `npm install` in both `web/` and `mcp/` directories

#### Impact
- MCP server now starts correctly on first plugin load
- No more "Cannot find package '@modelcontextprotocol/sdk'" errors
- Automatic dependency installation for all components

---

## [0.6.4] - 2026-02-17

### Fixed

#### Hooks Configuration
- Fixed: Removed deprecated `execSync` from Stop hook in plugin.json
- Updated: All hooks now use Node.js scripts instead of shell commands
- Improved: Cross-platform compatibility for all hooks

---

## [0.6.3] - 2026-02-17

### Fixed

#### Critical Hooks Bug
- Fixed: Missing `exec` import in `start-background.js` causing SessionStart/Stop hook errors
- Fixed: `fs.open()` Promise issue - changed to `fsSync.openSync()` for spawn stdio handles
- Fixed: `.mcp.json` missing `node` command - MCP server now starts correctly on all platforms

#### MCP Configuration
- Added: `mcp.json` at root with `${CLAUDE_PLUGIN_ROOT}` for universal path resolution
- Fixed: MCP server now properly detected in `/mcp` command output

---

## [0.6.2] - 2026-02-16

### Changed

#### Performance
- Re-enabled SessionStart hook for web server auto-start (optimized)
- Improved startup time with async dependency checking

---

## [0.6.1] - 2026-02-16

### Fixed

#### MCP Server
- Fixed: MCP server path in plugin.json now points to correct ES module implementation
- Fixed: Changed from `mcp-server.js` (CommonJS) to `mcp/server.js` (ES modules with MCP SDK)
- Fixed: MCP server connection now establishes successfully

---

## [0.5.6] - 2026-02-16

### Fixed

#### MCP Server
- Fixed: Variable shadowing bug in `gitInstallHooks` function (line 721)
- Fixed: MCP server now starts correctly without syntax errors
- Fixed: MCP server connection established successfully

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

## [0.5.7] - 2026-02-16

### Performance

#### Critical Latency Fixes
- **REMOVED**: PostToolUse hook that ran after EVERY Bash command (major performance issue)
- **REMOVED**: SessionStart hook for web server auto-start
- **OPTIMIZED**: PreToolUse hook now only checks actual git commit commands
- **ADDED**: On-demand web server start (`/web-start` skill)
- **ADDED**: Manual web server stop (`/web-stop` skill)

#### Performance Improvements
- Session start time: 5-10 seconds → <1 second
- Bash command latency: +0.5-1s → 0s (no overhead)
- Web server: Auto-start → Lazy initialization (only when needed)
- MCP server: Unchanged (fast and necessary)

### Changed

#### Web Interface
- Web interface no longer starts automatically on session start
- Users can manually start it with `/web-start` skill
- Server stops automatically when Claude Code closes

#### Hook Behavior
- PreToolUse hook only activates for `git commit` commands
- No more background git operations after every Bash command
- No more HTTP requests to localhost:3747 after commands

### Migration Notes

**If you relied on automatic web server startup:**
- Use `/web-start` skill to manually start the interface
- Web interface will start automatically when you use git flow features that need it

**No breaking changes for:**
- All git flow skills (`/versioned-commit`, `/amend-commit`, etc.)
- MCP tools and git operations
- Git hooks installation and functionality

---

- **GitHub:** https://github.com/Pamacea/claude-git
- **Issues:** https://github.com/Pamacea/claude-git/issues
